"""Summarizes bench runs: one CSV row per run, a Markdown table per arm.

Usage: summarize.py <results dir> <jobs.json> <out.csv>  (Markdown to stdout)
"""
import csv
import json
import re
import statistics
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

results_dir, jobs_path, csv_path = sys.argv[1:4]


def read_env(path):
    env = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if '=' in line:
                k, v = line.split('=', 1)
                env[k] = v
    return env


def parse_junit(out):
    """Returns {test name: (seconds, status)}; skipped tests are left out."""
    tests = {}
    for xml in out.rglob('junit*.xml'):
        for case in ET.parse(xml).getroot().iter('testcase'):
            if case.find('skipped') is not None:
                continue
            name = re.sub(r' \[(android|ios)\]$', '', case.get('name', ''))
            failed = (case.find('failure') is not None or case.find('error') is not None
                      or case.get('status') not in (None, 'SUCCESS'))
            tests[name] = (float(case.get('time') or 0), 'failed' if failed else 'passed')
    return tests


def job_seconds(jobs, name):
    for job in jobs:
        if job['name'] == name and job.get('started_at') and job.get('completed_at'):
            a = datetime.fromisoformat(job['started_at'].replace('Z', '+00:00'))
            b = datetime.fromisoformat(job['completed_at'].replace('Z', '+00:00'))
            return round((b - a).total_seconds(), 1)
    return None


raw = Path(jobs_path).read_text()
# `gh api --paginate` concatenates pages; split them back into objects.
jobs = []
for page in re.split(r'(?<=\})\s*(?=\{)', raw.strip()):
    jobs += json.loads(page).get('jobs', [])

runs = []
for out in sorted(Path(results_dir).glob('bench-*/out')):
    env = read_env(out / 'result.env')
    if not env:
        continue
    steps = read_env(out / 'steps.txt')
    tests = parse_junit(out)
    runs.append({**env, **steps, 'tests': tests,
                 'job_s': job_seconds(jobs, f"bench {env['platform']} {env['arm']} {env['run']}")})

# Like for like, per platform: the tests every arm ran there (Maestro runs its
# flows for the other platform as no-op launches; e2e does not select them).
shared = {}
for platform in {r['platform'] for r in runs}:
    names = [set(r['tests']) for r in runs if r['platform'] == platform and r['tests']]
    shared[platform] = set.intersection(*names) if names else set()

rows = []
for r in runs:
    t = r['tests']
    both = shared[r['platform']]
    rows.append({
        'platform': r['platform'], 'arm': r['arm'], 'run': r['run'], 'started_at': r.get('started_at'),
        'suite_s': float(r['suite_s']), 'job_s': r['job_s'],
        'test_sum_s': round(sum(s for s, _ in t.values()), 1),
        'shared_test_sum_s': round(sum(t[n][0] for n in both if n in t), 1),
        'tests_total': len(t),
        'tests_passed': sum(1 for _, st in t.values() if st == 'passed'),
        'tests_failed': sum(1 for _, st in t.values() if st == 'failed'),
        'exit': r['exit'], 'install_s': r.get('install_s'),
        'versions': r.get('versions'), 'device': r.get('device'), 'runner': r.get('runner'),
        'anr_guard': r.get('anr_guard'), 'anr_events': r.get('anr_events'),
        'app_sha256': r.get('app_sha256'), 'boot_install_s': r.get('boot_install_s'), 'commit': r.get('commit'),
        'failed_tests': '; '.join(sorted(n for n, (_, st) in t.items() if st == 'failed')),
    })

with open(csv_path, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]) if rows else ['arm'])
    w.writeheader()
    w.writerows(rows)


def p90(xs):
    xs = sorted(xs)
    return xs[max(0, -(-len(xs) * 9 // 10) - 1)]


def fmt(xs):
    xs = [x for x in xs if x is not None]
    if not xs:
        return 'n/a'
    return f"{statistics.median(xs):.1f} (p90 {p90(xs):.1f}, {min(xs):.1f}–{max(xs):.1f})"


for platform in sorted({r['platform'] for r in rows}):
    prs = [r for r in rows if r['platform'] == platform]
    print(f"## {platform}: Maestro vs e2e\n")
    print(f"Device: {prs[0]['device']}. Runner: {prs[0]['runner']}. "
          f"Shared tests (like for like): {len(shared[platform])}\n")
    print('| Arm | N | Suite s, median (p90, min–max) | Shared-test sum s | Job s | Green runs | Tests passed / run |')
    print('|---|---|---|---|---|---|---|')
    for arm in sorted({r['arm'] for r in prs}):
        rs = [r for r in prs if r['arm'] == arm]
        green = sum(1 for r in rs if r['tests_failed'] == 0 and r['exit'] == '0')
        passed = ', '.join(f"{r['tests_passed']}/{r['tests_total']}" for r in rs)
        print(f"| {arm} | {len(rs)} | {fmt([r['suite_s'] for r in rs])} | "
              f"{fmt([r['shared_test_sum_s'] for r in rs])} | {fmt([r['job_s'] for r in rs])} | "
              f"{green}/{len(rs)} | {passed} |")
    print()
failed = [f"{r['platform']} {r['arm']} {r['run']}: {r['failed_tests']}" for r in rows if r['failed_tests']]
if failed:
    print('Failed tests:\n')
    for line in failed:
        print(f'- {line}')
