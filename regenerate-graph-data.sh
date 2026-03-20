#!/usr/bin/env bash
# Regenera graph-data.js tras editar data.json
set -euo pipefail
cd "$(dirname "$0")"
python3 -c "
import json
with open('data.json') as f:
    d = json.load(f)
print('window.__GRAPH__ = ' + json.dumps(d, ensure_ascii=False) + ';')
" > graph-data.js
echo "OK → graph-data.js"
