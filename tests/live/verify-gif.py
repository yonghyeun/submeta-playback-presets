"""Independently decode a GIF saved by the real browser UI; no fixture generation."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageSequence

parser = argparse.ArgumentParser()
parser.add_argument('path', type=Path)
parser.add_argument('--seconds', type=float, required=True)
parser.add_argument('--sha256', required=True)
parser.add_argument('--fps', type=int, default=10)
parser.add_argument('--width', type=int, default=480)
parser.add_argument('--height', type=int, default=270)
parser.add_argument('--report', type=Path)
args = parser.parse_args()
data = args.path.read_bytes()
digest = hashlib.sha256(data).hexdigest()
assert digest == args.sha256, 'Saved file differs from preview bytes'
assert data[:6] == b'GIF89a' and data[-1] == 0x3b, 'Invalid GIF envelope'
assert len(data) <= 20 * 1024 * 1024, 'GIF exceeds 20 MiB'
with Image.open(args.path) as image:
    assert image.format == 'GIF'
    assert image.size == (args.width, args.height), image.size
    assert image.info.get('loop') == 0, 'Expected infinite loop'
    frames, delays, means, changes = [], [], [], []
    previous = None
    for frame in ImageSequence.Iterator(image):
        pixels = frame.convert('RGB').tobytes()
        frames.append(hashlib.sha256(pixels).hexdigest())
        delays.append(frame.info.get('duration', 0))
        means.append(round(sum(pixels) / len(pixels), 3))
        if previous is not None:
            changes.append(round(sum(abs(a - b) for a, b in zip(previous, pixels)) / len(pixels), 3))
        previous = pixels
    assert len(frames) == round(args.seconds * args.fps), len(frames)
    assert all(delay > 0 for delay in delays), 'Zero frame delay'
    assert abs(sum(delays) - args.seconds * 1000) <= 1000 / args.fps + 10
    assert len(set(frames)) > 1, 'No decoded motion'
    report = {'decoder': 'Pillow', 'sha256': digest, 'bytes': len(data), 'size': list(image.size),
              'frames': len(frames), 'uniqueFrames': len(set(frames)), 'durationMs': sum(delays),
              'frameDelayMs': sorted(set(delays)), 'loop': image.info.get('loop'),
              'firstMiddleLastMeanRGB': [means[0], means[len(means)//2], means[-1]],
              'adjacentMeanAbsoluteDifference': [min(changes), max(changes)]}
    print(json.dumps(report, indent=2))
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + '\n')
