#!/usr/bin/env python3
"""Lists the files of every section in frontend/data/samples.config.json and writes
frontend/data/manifest.json. Runs automatically in the GitHub Pages workflow, so adding a file
to a folder and pushing is all that is needed (GitHub Pages cannot list folders by itself)."""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
cfg_path = os.path.join(ROOT, 'data', 'samples.config.json')
cfg = json.load(open(cfg_path, encoding='utf-8'))

def natural(s):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', s)]

sections = {}
for sec in cfg.get('sections', []):
    folder = os.path.join(ROOT, sec['dir'])
    items = []
    if os.path.isdir(folder):
        for name in sorted(os.listdir(folder), key=natural):
            path = os.path.join(folder, name)
            if not os.path.isfile(path) or name.startswith('.') or name.lower().startswith('readme'):
                continue
            if sec.get('prefix') and not name.startswith(sec['prefix']):
                continue
            items.append({'file': name, 'size': os.path.getsize(path)})
    sections[sec['id']] = items

out = os.path.join(ROOT, 'data', 'manifest.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'sections': sections}, f, ensure_ascii=False, indent=1)
print('manifest written:', {k: len(v) for k, v in sections.items()})
