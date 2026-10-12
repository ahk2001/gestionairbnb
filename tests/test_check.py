import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(base_dir, 'app.js'), 'r', encoding='utf-8') as f:
    app_text = f.read()

with open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
    html_text = f.read()

ids = set(re.findall(r"getElementById\(['\"](.*?)['\"]\)", app_text))
print(f"Total IDs referenced: {len(ids)}")

missing = []
for i in sorted(ids):
    # Dynamic IDs like dot-badge-${prop}
    if '${' in i:
        continue
    if (f'id="{i}"' not in html_text) and (f"id='{i}'" not in html_text):
        missing.append(i)

print("Missing IDs:", missing)
