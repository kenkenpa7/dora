# doraプロジェクト公式 音源標準圧縮スクリプト (32kbps mono / 11kHz mono)
import os
import subprocess
import sys

dora_dir = os.path.dirname(os.path.abspath(__file__))
orig_dir = os.path.join(dora_dir, "BGM元サイズ")
bgm_dir = os.path.join(dora_dir, "bgm")
temp_dir = os.path.join(bgm_dir, "temp_standard_compress")

if not os.path.exists(orig_dir):
    print(f"[エラー] 元音源フォルダ {orig_dir} が見つかりません。")
    sys.exit(1)

os.makedirs(temp_dir, exist_ok=True)
os.makedirs(bgm_dir, exist_ok=True)

files = sorted(os.listdir(orig_dir))
total_orig = 0
total_after = 0

print("=== dora公式 音源標準圧縮 (32kbps mono / 22.05kHz) ===")
print(f"{'ファイル名':<18} | {'元サイズ':<10} | {'圧縮後':<10} | {'削減率':<8}")
print("-" * 55)

for filename in files:
    src_path = os.path.join(orig_dir, filename)
    if not os.path.isfile(src_path) or filename.startswith('.'):
        continue

    dst_path = os.path.join(temp_dir, filename)
    size_orig = os.path.getsize(src_path)
    total_orig += size_orig

    if filename.endswith('.mp3'):
        # モノラル化, 32kbps, 22.05kHz
        cmd = ["ffmpeg", "-y", "-i", src_path, "-ac", "1", "-b:a", "32k", "-ar", "22050", dst_path]
    elif filename.endswith('.wav'):
        # モノラル化, 11.025kHz 16-bit PCM
        cmd = ["ffmpeg", "-y", "-i", src_path, "-ac", "1", "-ar", "11025", dst_path]
    else:
        continue

    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    size_after = os.path.getsize(dst_path)
    total_after += size_after
    reduction = (1 - (size_after / size_orig)) * 100
    print(f"{filename:<18} | {size_orig/1024:>7.1f} KB | {size_after/1024:>7.1f} KB | {reduction:>6.1f} %")

for filename in os.listdir(temp_dir):
    os.replace(os.path.join(temp_dir, filename), os.path.join(bgm_dir, filename))

os.rmdir(temp_dir)
print("-" * 55)
reduction_total = (1 - (total_after / total_orig)) * 100
print(f"{'合計':<18} | {total_orig/1024/1024:>7.2f} MB | {total_after/1024/1024:>7.2f} MB | {reduction_total:>6.1f} %")
print("[完了] bgm/ フォルダへの標準圧縮・反映が完了しました。")
