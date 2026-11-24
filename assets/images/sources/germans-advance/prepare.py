"""Pack motion cels from the original pixel art used by The Germans Advance."""

from collections import deque
from hashlib import sha256
import json
from math import cos, radians, sin
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[4]
IMAGES = ROOT / "assets/images"
DESCRIPTORS = ROOT / "core/actor/advanceArt.js"
HERE = Path(__file__).resolve().parent

SOURCES = {
    "gunner": "armies/nemci/vojnici/vojnik-26.png",
    "rifleman": "armies/nemci/vojnici/vojnik-27.png",
    "crouch": "armies/nemci/vojnici/vojnik-19.png",
    "tank": "armies/panzer3.png",
}


def load(kind, ground=False):
    image = Image.open(IMAGES / SOURCES[kind]).convert("RGBA")
    if not ground:
        return image
    # Retain boots and tracks, cutting the grassy pedestal from the original art.
    start = image.height - 15
    for y in range(start, image.height):
        for x in range(image.width):
            r, g, b, a = image.getpixel((x, y))
            if a and g - b > 16 and r - b > 4:
                image.putpixel((x, y), (0, 0, 0, 0))
    attached = set()
    queue = deque((x, start) for x in range(image.width))
    while queue:
        x, y = queue.popleft()
        if (x, y) in attached or not image.getpixel((x, y))[3]:
            continue
        attached.add((x, y))
        queue.extend((nx, ny) for ny in range(max(start, y - 1), min(image.height, y + 2))
                     for nx in range(max(0, x - 1), min(image.width, x + 2)))
    for y in range(start, image.height):
        for x in range(image.width):
            if (x, y) not in attached:
                image.putpixel((x, y), (0, 0, 0, 0))
    return image


# Per leg: ankle ahead/behind the hip, lift from the ground, forward knee bend, boot pitch.
# Hold the ground through the first seven poses; the other leg is half a cycle ahead.
STRIDE = [
    (9, 0, 0, -15), (6, 0, 2, 0), (3, 0, 3, 0), (0, 0, 2, 0),
    (-3, 0, 1, 4), (-6, 0, 0, 12), (-9, 0, 2, 23), (-10, 4, 5, 28),
    (-6, 8, 8, 20), (-1, 10, 9, 2), (4, 7, 7, -10), (8, 3, 3, -16),
]

TROUSERS = {
    "rifleman": ((126, 117, 120), (91, 85, 90)),
    "gunner": ((107, 113, 105), (81, 86, 79)),
}
HELMET_CLEARANCE = 2


def marching_leg(draw, hip, floor, step, cloth, near):
    hip_x, hip_y = hip
    stride, lift, bend, angle = step
    ax = hip_x + stride
    theta = radians(angle)

    def rotate(points):
        return [(round(x * cos(theta) - y * sin(theta)), round(x * sin(theta) + y * cos(theta))) for x, y in points]

    boot = rotate([(-3, -7), (3, -7), (4, -3), (8, -2), (9, 0), (8, 1), (-3, 1)])
    ay = floor - lift - max(y for _, y in boot)
    knee_x = round((hip_x + ax) / 2 + bend)
    knee_y = min(ay - 8, hip_y + 10)
    shin_x, shin_y = rotate([(0, -5)])[0]
    bx, by = ax + shin_x, ay + shin_y
    draw.polygon([(hip_x - 4, hip_y - 2), (hip_x + 4, hip_y - 2), (knee_x + 3, knee_y),
                  (bx + 3, by), (bx - 3, by), (knee_x - 3, knee_y)], fill=cloth, outline="#151913")
    if near:
        draw.line([(hip_x - 2, hip_y + 2), (knee_x - 1, knee_y), (bx - 1, by - 2)], fill=tuple(c * 4 // 5 for c in cloth))
    draw.polygon([(ax + x, ay + y) for x, y in boot], fill="#282a27" if near else "#20211e", outline="#11130f")


def rifle_at_ready(image, hip, angle):
    upper = image.crop((0, 0, image.width, hip))
    # Keep both hands and the rifle together when lowering the arms around the shoulder.
    mask = Image.new("L", upper.size)
    ImageDraw.Draw(mask).polygon([(18, 16), (34, 14), (36, 11), (77, 9), (77, 16),
                                 (57, 19), (52, 22), (34, 27), (27, 25), (18, 25)], fill=255)
    held = upper.copy()
    held.putalpha(ImageChops.multiply(held.getchannel("A"), mask))
    upper.paste((0, 0, 0, 0), (29, 0, upper.width, hip))
    draw = ImageDraw.Draw(upper)
    draw.polygon([(19, 16), (24, 16), (27, 19), (27, 28), (21, 28), (18, 22)],
                 fill="#626d5b", outline="#22271f")
    upper.alpha_composite(held.rotate(-angle, center=(18, 17)))
    return upper


def gait(image, kind, hip, hip_x, baseline, frame, rifle_angle):
    # Room above the original helmet for the lift of the body over the planted leg.
    pose = Image.new("RGBA", (image.width, image.height + HELMET_CLEARANCE))
    draw = ImageDraw.Draw(pose)
    rise = (0, 1, 2, 0, -1, -1)[frame % 6]
    hip_x += 1
    hip_y = hip + rise + HELMET_CLEARANCE
    near, far = TROUSERS[kind]
    floor = baseline + HELMET_CLEARANCE - 1

    def step(i):
        stride, lift, bend, angle = STRIDE[i % len(STRIDE)]
        if kind == "rifleman":
            return stride, round(lift * .7), max(0, bend - 1), angle
        return stride, lift, bend, angle

    marching_leg(draw, (hip_x + 1, hip_y), floor, step(frame + 6), far, False)
    marching_leg(draw, (hip_x - 1, hip_y), floor, step(frame), near, True)
    upper = (rifle_at_ready(image, hip, rifle_angle + (0, 1, 2, 1, 0, -1)[frame % 6]) if kind == "rifleman"
             else image.crop((0, 0, image.width, hip)))
    pose.alpha_composite(upper, (1, rise + HELMET_CLEARANCE))
    return pose


def firing(image, hip, recoil):
    pose = Image.new("RGBA", image.size)
    pose.alpha_composite(image.crop((0, hip, image.width, image.height)), (0, hip))
    pose.alpha_composite(image.crop((0, 0, image.width, hip + 3)), (-recoil, 0))
    return pose


def dip(image, hip, baseline, pixels):
    pose = Image.new("RGBA", image.size)
    legs = image.crop((0, hip, image.width, baseline)).resize((image.width, baseline - hip - pixels))
    pose.alpha_composite(legs, (0, hip + pixels))
    pose.alpha_composite(image.crop((0, 0, image.width, hip + 2)), (0, pixels))
    return pose


def muzzle(image, anchor):
    barrel = image.crop((image.width // 2, 0, image.width, 56))
    end = barrel.getbbox()[2] - 1
    ys = [y for y in range(barrel.height) if barrel.getpixel((end, y))[3] > 0]
    return [image.width // 2 + end + 1 - anchor[0], round(sum(ys) / len(ys)) - anchor[1]]


def pack(kind, size, anchor, standing, source_keys, clips):
    columns = max(len(frames) for _, frames, _, _ in clips)
    w, h = size
    atlas = Image.new("RGBA", (columns * w, len(clips) * h))
    actions = {}
    for row, (name, frames, ms, loop) in enumerate(clips):
        for column, frame in enumerate(frames):
            atlas.paste(frame, (column * w, row * h))
        actions[name] = {"row": row, "ms": ms, "loop": loop}
        if name in {"fire", "crouch-fire"}:
            actions[name]["muzzles"] = [muzzle(frame, anchor) for frame in frames]
    folder = "tenkovi" if kind == "tank" else "vojnici"
    source = f"game-ready/{folder}/advance-{kind}.png"
    atlas.save(IMAGES / source, optimize=True)
    return {"src": source, "width": w, "height": h, "anchor": {"x": anchor[0], "y": anchor[1]},
            "standingPixels": standing, "clips": actions}, {
                "sources": [SOURCES[key] for key in source_keys],
                "sha256": sha256((IMAGES / source).read_bytes()).hexdigest(),
            }


def infantry(kind, hip, hip_x, source_anchor, baseline):
    source = load(kind, ground=True)
    anchor = (31, 76)
    size = (96, 84)

    def cell(pose, feet=baseline, shift=0):
        frame = Image.new("RGBA", size)
        frame.alpha_composite(pose.crop((0, 0, pose.width, feet)), (anchor[0] - source_anchor + shift, anchor[1] - feet))
        return frame

    def march(name, angle):
        frames = [cell(gait(source, kind, hip, hip_x, baseline, i, angle), baseline + HELMET_CLEARANCE)
                  for i in range(len(STRIDE))]
        return name, frames, [72] * len(frames), True

    clips = [
        ("idle", [cell(source)], [1000], True),
        march("walk", 19),
        ("fire", [cell(firing(source, hip, n)) for n in (1, 3, 1, 0)], [34, 32, 34, 30], False),
    ]
    keys = [kind]
    if kind == "rifleman":
        crouch = load("crouch")
        lower = cell(crouch, 53)
        clips += [
            march("walk-aim", 9),
            ("kneel", [cell(dip(source, hip, baseline, d)) for d in (4, 9)] + [lower], [60, 60, 55], False),
            ("crouch", [lower], [1000], True),
            ("crouch-fire", [cell(firing(crouch, 32, n), 53) for n in (1, 3, 1, 0)], [34, 32, 34, 30], False),
        ]
        keys.append("crouch")
    return pack(kind, size, anchor, baseline, keys, clips)


def tank_art():
    source = load("tank", ground=True)
    wheels = [(27, 112), (245, 111)]
    frames = []
    for phase in range(6):
        pose = source.copy()
        tread = source.crop((35, 92, 236, 99))
        pose.paste(ImageChops.offset(tread, phase * 2, 0), (35, 92))
        for cx, cy in wheels:
            box = (cx - 13, cy - 13, cx + 14, cy + 14)
            wheel = source.crop(box).rotate(-phase * 12)
            mask = Image.new("L", wheel.size)
            ImageDraw.Draw(mask).ellipse((0, 0, 26, 26), fill=255)
            pose.paste(wheel, box[:2], mask)
        draw = ImageDraw.Draw(pose)
        for x in range(45, 230):
            if (x + phase * 2) % 7 < 2:
                draw.line((x, 133, x, 135), fill="#555451")
        frames.append(pose)
    return pack("tank", source.size, (100, 141), 141, ["tank"], [
        ("idle", [source], [1000], True), ("drive", frames, [95] * 6, True),
    ])


def commander_art():
    source = load("rifleman").crop((0, 0, 78, 42))
    frames = []
    for angle, drop in [(0, 0), (3, 1), (7, 2), (11, 3), (7, 2), (3, 1)]:
        image = Image.new("RGBA", (93, 51))
        image.alpha_composite(source, (4, 8 + drop))
        image = image.rotate(-angle, center=(29, 42))
        image.paste((0, 0, 0, 0), (0, 48, 93, 51))
        frames.append(image)
    return pack("commander", (93, 51), (33, 48), 40, ["rifleman"], [
        ("idle", frames, [300, 135, 135, 245, 135, 135], True),
    ])


def js(value):
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{key if key.isidentifier() else repr(key)}: {js(item)}" for key, item in value.items()) + " }"
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(map(js, value)) + "]"
    return repr(value) if isinstance(value, str) else json.dumps(value)


def main():
    atlases = {
        "rifleman": infantry("rifleman", 44, 22, 29, 69),
        "gunner": infantry("gunner", 42, 23, 25, 65),
        "tank": tank_art(),
        "commander": commander_art(),
    }
    runtime = {key: art for key, (art, _) in atlases.items()}
    assets = []
    for key, (art, meta) in atlases.items():
        clips = art["clips"]
        assets.append({
            "id": f"advance-{key}", "image": "../../" + art["src"], **meta,
            "frame": {"width": art["width"], "height": art["height"],
                      "columns": max(len(clip["ms"]) for clip in clips.values()), "rows": len(clips)},
            "anchor": art["anchor"], "standingPixels": art["standingPixels"],
            "animations": [{"name": name, "frameCount": len(clip["ms"]), "duration": sum(clip["ms"]) / 1000, **clip}
                           for name, clip in clips.items()],
        })
    lines = ["// Generated by assets/images/sources/germans-advance/prepare.py.", "export default {"]
    for key, art in runtime.items():
        fields = ", ".join(f"{name}: {js(value)}" for name, value in art.items() if name != "clips")
        lines.extend([f"  {key}: {{", f"    {fields},", "    clips: {"])
        lines.extend(f"      {name if name.isidentifier() else repr(name)}: {js(value)}," for name, value in art["clips"].items())
        lines.extend(["    },", "  },"])
    DESCRIPTORS.write_text("\n".join(lines + ["}", ""]), encoding="utf-8")
    (HERE / "sprites.json").write_text(json.dumps({"assets": assets}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
