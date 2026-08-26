import subprocess, os

dora_dir = os.path.dirname(os.path.abspath(__file__))

cmd = ['git', 'log', '--pretty=format:COMMIT_START%n%H%n%an%n%ad%n%s', '--date=format:%Y-%m-%d %H:%M', '--name-status']
res = subprocess.run(cmd, cwd=dora_dir, capture_output=True, text=True, encoding='utf-8')

commits_raw = res.stdout.split('COMMIT_START\n')
entries = []

for block in commits_raw:
    if not block.strip(): continue
    lines = block.strip().split('\n')
    commit_hash = lines[0][:7]
    author = lines[1]
    date_str = lines[2]
    subject = lines[3]
    files = [l.split('\t')[-1] for l in lines[4:] if l.strip() and not l.endswith('バージョン履歴.md')]
    if not files: continue
    files_str = ', '.join(['' + f + '' for f in files[:5]])
    if len(files) > 5:
        files_str += ' ほか ' + str(len(files)-5) + ' 件'
    entries.append(f'### 📌 {subject}\n* **日時**: {date_str} （コミット: {commit_hash}）\n* **変更ファイル**: {files_str}\n')

content = '# 📜 ゲーム開発・機能更新履歴\n\n本書は、本ゲームの機能追加・修正・更新が行われるたびに、Gitコミットと連動してローカルに自動記録されるバージョン履歴書です。\n\n---\n\n' + '\n'.join(entries)

with open(os.path.join(dora_dir, 'バージョン履歴.md'), 'w', encoding='utf-8') as f:
    f.write(content)
