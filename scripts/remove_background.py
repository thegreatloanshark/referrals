"""Optional local preprocessing, NOT imported into Vercel serverless functions.
Usage: pip install rembg pillow onnxruntime; python scripts/remove_background.py input.jpg output.png
Review dependencies and downloaded model sources under your organization's security policy.
"""
import sys
from pathlib import Path
from rembg import remove
if len(sys.argv)!=3: raise SystemExit('Usage: remove_background.py input_photo output.png')
src, dst = map(Path,sys.argv[1:]); dst.write_bytes(remove(src.read_bytes()))
