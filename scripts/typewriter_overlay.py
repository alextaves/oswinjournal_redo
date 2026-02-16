#!/usr/bin/env python3
"""
Typewriter text overlay for Oswin Journal videos.

Usage:
  python3 scripts/typewriter_overlay.py INPUT_VIDEO OUTPUT_VIDEO [LINE1] [LINE2]

Examples:
  python3 scripts/typewriter_overlay.py input.mp4 output.mp4
  python3 scripts/typewriter_overlay.py input.mp4 output.mp4 "OSWIN JOURNAL" "CHRISTOPHER BISSONNETTE"

Requires: Pillow (pip install Pillow), ffmpeg
If Pillow isn't installed globally, use the venv:
  /tmp/textvenv/bin/python3 scripts/typewriter_overlay.py ...

Style: Avenir Next Bold, tracking 15%, pure white, rotated 90° CW,
       centered horizontally, 5% from top, typewriter finishes at 3s.
"""

import sys
import os
import subprocess
import json
from PIL import Image, ImageDraw, ImageFont

# ── Defaults ──────────────────────────────────────────────────
DEFAULT_LINE1 = "OSWIN JOURNAL"
DEFAULT_LINE2 = "CHRISTOPHER BISSONNETTE"

# ── Style (baked in) ──────────────────────────────────────────
FONT_PATH = '/System/Library/Fonts/Avenir Next.ttc'
FONT_SIZE = 48
FONT_INDEX = 0  # Bold
TRACKING = int(FONT_SIZE * 0.15)  # ~7px extra between chars
TEXT_COLOR = (255, 255, 255, 255)  # pure white
SHADOW_COLOR = (0, 0, 0, 80)
SHADOW_OFFSET = 2
LINE_GAP = 18
FPS = 30
ANIM_END = 3.0  # typewriter completes at 3 seconds

# Position
HORIZ_CENTER = True
VERT_PCT = 0.05  # 5% from top

TEMP_DIR = '/tmp/text_overlay_frames'
CONCAT_FILE = '/tmp/overlay_concat.txt'

# ── Font ──────────────────────────────────────────────────────
font = ImageFont.truetype(FONT_PATH, FONT_SIZE, index=FONT_INDEX)


def get_tracked_width(text):
    if not text:
        return 0
    total = 0
    for i, char in enumerate(text):
        bbox = font.getbbox(char)
        total += bbox[2] - bbox[0]
        if i < len(text) - 1:
            total += TRACKING
    return total


def draw_tracked_text(draw, x, y, text, color):
    current_x = x
    for char in text:
        draw.text((current_x, y), char, font=font, fill=color)
        bbox = font.getbbox(char)
        current_x += bbox[2] - bbox[0] + TRACKING


def get_video_info(path):
    result = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', path],
        capture_output=True, text=True
    )
    info = json.loads(result.stdout)
    stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    w, h = int(stream['width']), int(stream['height'])
    duration = float(info['format']['duration'])
    fps_parts = stream['r_frame_rate'].split('/')
    fps = int(fps_parts[0]) / int(fps_parts[1]) if len(fps_parts) == 2 else int(fps_parts[0])
    return w, h, duration, fps


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    input_video = sys.argv[1]
    output_video = sys.argv[2]
    line1 = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_LINE1
    line2 = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_LINE2

    if not os.path.exists(input_video):
        print(f"Error: {input_video} not found")
        sys.exit(1)

    # Get video dimensions and duration
    W, H, total_duration, vid_fps = get_video_info(input_video)
    print(f"Video: {W}x{H}, {total_duration:.1f}s, {vid_fps}fps")

    os.makedirs(TEMP_DIR, exist_ok=True)
    # Clean old frames
    for f in os.listdir(TEMP_DIR):
        if f.startswith('frame_') and f.endswith('.png'):
            os.remove(os.path.join(TEMP_DIR, f))

    # ── Calculate text layout ─────────────────────────────────
    ascent, descent = font.getmetrics()
    line_height = ascent + descent
    line1_width = get_tracked_width(line1)
    line2_width = get_tracked_width(line2)
    max_line_width = max(line1_width, line2_width)
    text_block_w = max_line_width + 20
    text_block_h = line_height * 2 + LINE_GAP + 20

    print(f"Font: {FONT_SIZE}px Avenir Next Bold, Tracking: {TRACKING}px")
    print(f"Lines: \"{line1}\" / \"{line2}\"")

    # ── Timing ────────────────────────────────────────────────
    line1_chars = len(line1)
    line2_chars = len(line2)
    total_chars = line1_chars + line2_chars

    # Proportional timing: each line gets time based on char count
    line1_end = ANIM_END * 0.4  # first 40% of animation time
    pause_end = ANIM_END * 0.47  # brief pause
    line2_end = ANIM_END * 0.97  # rest of animation time

    line1_interval = line1_end / line1_chars if line1_chars else 1
    line2_interval = (line2_end - pause_end) / line2_chars if line2_chars else 1

    def chars_visible_at(t):
        if t < 0:
            return (0, 0)
        if t < line1_end:
            n1 = min(int(t / line1_interval) + 1, line1_chars)
            return (n1, 0)
        if t < pause_end:
            return (line1_chars, 0)
        if t < line2_end:
            n2 = min(int((t - pause_end) / line2_interval) + 1, line2_chars)
            return (line1_chars, n2)
        return (line1_chars, line2_chars)

    def render_frame(n1, n2):
        text_img = Image.new('RGBA', (text_block_w, text_block_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(text_img)
        y1 = 10
        y2 = y1 + line_height + LINE_GAP
        x_start = 10

        if n1 > 0:
            p1 = line1[:n1]
            draw_tracked_text(draw, x_start + SHADOW_OFFSET, y1 + SHADOW_OFFSET, p1, SHADOW_COLOR)
            draw_tracked_text(draw, x_start, y1, p1, TEXT_COLOR)
        if n2 > 0:
            p2 = line2[:n2]
            draw_tracked_text(draw, x_start + SHADOW_OFFSET, y2 + SHADOW_OFFSET, p2, SHADOW_COLOR)
            draw_tracked_text(draw, x_start, y2, p2, TEXT_COLOR)

        rotated = text_img.rotate(-90, expand=True)
        frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        rot_w, rot_h = rotated.size
        x_pos = (W - rot_w) // 2 if HORIZ_CENTER else W - rot_w - 50
        y_pos = int(H * VERT_PCT)
        frame.paste(rotated, (x_pos, y_pos), rotated)
        return frame

    # ── Generate unique frames ────────────────────────────────
    anim_frames = int(ANIM_END * FPS)
    frames = []
    prev_state = None
    for f in range(anim_frames + 1):
        t = f / FPS
        state = chars_visible_at(t)
        if state != prev_state:
            frames.append(state)
            prev_state = state

    final_state = (line1_chars, line2_chars)
    if frames[-1] != final_state:
        frames.append(final_state)

    print(f"Generating {len(frames)} overlay frames...")
    for i, (n1, n2) in enumerate(frames):
        img = render_frame(n1, n2)
        path = os.path.join(TEMP_DIR, f'frame_{i:04d}.png')
        img.save(path, optimize=True)

    # ── Write concat file ─────────────────────────────────────
    with open(CONCAT_FILE, 'w') as cf:
        cf.write("ffconcat version 1.0\n\n")
        for i in range(len(frames)):
            filepath = os.path.join(TEMP_DIR, f'frame_{i:04d}.png')
            cf.write(f"file '{filepath}'\n")
            if i < len(frames) - 1:
                next_state = frames[i + 1]
                for fr in range(anim_frames + 1):
                    t = fr / FPS
                    if chars_visible_at(t) == next_state:
                        next_t = t
                        break
                cur_state = frames[i]
                for fr in range(anim_frames + 1):
                    t = fr / FPS
                    if chars_visible_at(t) == cur_state:
                        cur_t = t
                        break
                cf.write(f"duration {next_t - cur_t:.6f}\n")
            else:
                for fr in range(anim_frames + 1):
                    t = fr / FPS
                    if chars_visible_at(t) == frames[i]:
                        start_t = t
                        break
                cf.write(f"duration {total_duration - start_t:.6f}\n")
        cf.write(f"file '{os.path.join(TEMP_DIR, f'frame_{len(frames)-1:04d}.png')}'\n")

    # ── Composite with FFmpeg ─────────────────────────────────
    print(f"Compositing onto video ({total_duration:.0f}s)... this takes a few minutes.")
    cmd = [
        'ffmpeg', '-y',
        '-i', input_video,
        '-f', 'concat', '-safe', '0', '-i', CONCAT_FILE,
        '-filter_complex', '[1:v]fps=30,format=rgba[text];[0:v][text]overlay=0:0:shortest=1',
        '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
        '-t', str(total_duration),
        output_video
    ]
    subprocess.run(cmd, check=True)
    print(f"\nDone! Output: {output_video}")


if __name__ == '__main__':
    main()
