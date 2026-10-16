from PIL import Image
from pathlib import Path
import sys

frames_root, output = map(Path, sys.argv[1:])
for name in ('wave', 'love', 'laugh', 'hype'):
    originals = [Image.open(p).convert('RGBA') for p in sorted((frames_root / name).glob('*.png'))]
    # One palette keeps the outline and cream stable throughout each loop.
    sheet = Image.new('RGB', (320 * 8, 240 * 6), '#14231b')
    for i, frame in enumerate(originals):
        sheet.paste(frame, ((i % 8) * 320, (i // 8) * 240), frame)
    palette = sheet.quantize(colors=255)
    encoded = []
    for frame in originals:
        indexed = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        indexed.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        encoded.append(indexed)
    encoded[0].save(output / f'{name}.gif', save_all=True, append_images=encoded[1:], duration=70, loop=0, transparency=255, disposal=2, optimize=False)
    originals[0].save(output / f'{name}.png')
    with Image.open(output / f'{name}.gif') as check:
        assert check.n_frames == 48 and check.info['loop'] == 0
    print(f'Encoded {name}: {(output / (name + ".gif")).stat().st_size:,} bytes, 3.36 seconds')
