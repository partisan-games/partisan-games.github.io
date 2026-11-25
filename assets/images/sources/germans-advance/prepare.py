"""Animate newly redrawn bases; the idea collection is reference-only."""

from hashlib import sha256
import importlib.util
import json
from math import cos, radians, sin
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[4]
IMAGES = ROOT / "assets/images"
DESCRIPTORS = ROOT / "core/actor/advanceArt.js"
HERE = Path(__file__).resolve().parent
NORMALIZE_SPEC = importlib.util.spec_from_file_location('normalize_advance', HERE / 'redrawn/normalize.py')
normalizer = importlib.util.module_from_spec(NORMALIZE_SPEC)
NORMALIZE_SPEC.loader.exec_module(normalizer)
DENSITY = normalizer.DENSITY


def px(value):
    """Animation geometry stays in reference units; raster drawing uses the chosen pixel density."""
    if isinstance(value, (tuple, list)):
        return tuple(px(item) for item in value)
    return round(value * DENSITY)


def blank(size):
    return Image.new('RGBA', px(size))


def cut(image, box):
    return image.crop(px(box))


def overlay(image, part, point=(0, 0)):
    image.alpha_composite(part, px(point))


def logical_size(image):
    return tuple(value / DENSITY for value in image.size)


SOURCES = {
    "backpack": "sources/germans-advance/redrawn/backpack-base.png",
    "officer": "sources/germans-advance/redrawn/officer-base.png",
    "officer-half": "sources/germans-advance/redrawn/officer-half-base.png",
    "officer-full": "sources/germans-advance/redrawn/officer-full-base.png",
    "gunner": "sources/germans-advance/redrawn/gunner-base.png",
    "rifleman": "sources/germans-advance/redrawn/rifleman-base.png",
    "crouch": "sources/germans-advance/redrawn/crouch-base.png",
    "crouch-walk": "sources/germans-advance/redrawn/crouch-walk-refined.png",
    "tank": "sources/germans-advance/redrawn/tank-base.png",
    "commander": "sources/germans-advance/redrawn/commander-base.png",
}


def load(kind):
    return Image.open(IMAGES / SOURCES[kind]).convert("RGBA")


# Per leg: ankle ahead/behind the hip, lift from the ground, forward knee bend, boot pitch.
# Hold the ground through the first seven poses; the other leg is half a cycle ahead.
STRIDE = [
    (9, 0, 0, -15), (6, 0, 2, 0), (3, 0, 3, 0), (0, 0, 2, 0),
    (-3, 0, 1, 4), (-6, 0, 0, 12), (-9, 0, 2, 23), (-10, 4, 5, 28),
    (-6, 8, 8, 20), (-1, 10, 9, 2), (4, 7, 7, -10), (8, 3, 3, -16),
]

TROUSERS = {
    "backpack": ((126, 117, 120), (91, 85, 90)),
    "officer": ((126, 117, 120), (91, 85, 90)),
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
        return [(x * cos(theta) - y * sin(theta), x * sin(theta) + y * cos(theta)) for x, y in points]

    boot = rotate([(-3, -7), (3, -7), (4, -3), (8, -2), (9, 0), (8, 1), (-3, 1)])
    ay = floor - lift - max(y for _, y in boot)
    knee_x = round((hip_x + ax) / 2 + bend)
    knee_y = min(ay - 8, hip_y + 10)
    shin_x, shin_y = rotate([(0, -5)])[0]
    bx, by = ax + shin_x, ay + shin_y
    draw.polygon(px([(hip_x - 4, hip_y - 2), (hip_x + 4, hip_y - 2), (knee_x + 3, knee_y),
                  (bx + 3, by), (bx - 3, by), (knee_x - 3, knee_y)]), fill=cloth, outline="#151913", width=DENSITY)
    if near:
        draw.line(px([(hip_x - 2, hip_y + 2), (knee_x - 1, knee_y), (bx - 1, by - 2)]), fill=tuple(c * 4 // 5 for c in cloth), width=DENSITY)
    draw.polygon(px([(ax + x, ay + y) for x, y in boot]), fill="#282a27" if near else "#20211e", outline="#11130f", width=DENSITY)


def rifle_at_ready(image, hip, angle):
    w, _ = logical_size(image)
    upper = cut(image, (0, 0, w, hip))
    # Keep both hands and the rifle together when lowering the arms around the shoulder.
    mask = Image.new("L", upper.size)
    ImageDraw.Draw(mask).polygon(px([(18, 16), (34, 14), (36, 11), (77, 9), (77, 16),
                                 (57, 19), (52, 22), (34, 27), (27, 25), (18, 25)]), fill=255)
    held = upper.copy()
    held.putalpha(ImageChops.multiply(held.getchannel("A"), mask))
    upper.paste((0, 0, 0, 0), px((29, 0, w, hip)))
    draw = ImageDraw.Draw(upper)
    draw.polygon(px([(19, 16), (24, 16), (27, 19), (27, 28), (21, 28), (18, 22)]),
                 fill="#626d5b", outline="#22271f", width=DENSITY)
    upper.alpha_composite(held.rotate(-angle, center=px((18, 17)), resample=Image.Resampling.NEAREST))
    return upper


def gait(image, kind, hip, hip_x, baseline, frame, rifle_angle):
    # Room above the original helmet for the lift of the body over the planted leg.
    w, h = logical_size(image)
    pose = blank((w, h + HELMET_CLEARANCE))
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
             else cut(image, (0, 0, w, hip)))
    overlay(pose, upper, (1, rise + HELMET_CLEARANCE))
    return pose


def firing(image, hip, recoil):
    w, h = logical_size(image)
    pose = Image.new("RGBA", image.size)
    overlay(pose, cut(image, (0, hip, w, h)), (0, hip))
    overlay(pose, cut(image, (0, 0, w, hip + 3)), (-recoil, 0))
    return pose


def dip(image, hip, baseline, pixels):
    w, _ = logical_size(image)
    pose = Image.new("RGBA", image.size)
    legs = cut(image, (0, hip, w, baseline)).resize(px((w, baseline - hip - pixels)), Image.Resampling.NEAREST)
    overlay(pose, legs, (0, hip + pixels))
    overlay(pose, cut(image, (0, 0, w, hip + 2)), (0, pixels))
    return pose


def muzzle(image, anchor):
    barrel = image.crop((image.width // 2, 0, image.width, px(56)))
    end = barrel.getbbox()[2] - 1
    ys = [y for y in range(barrel.height) if barrel.getpixel((end, y))[3] > 0]
    return [image.width // 2 + end + 1 - px(anchor[0]), round(sum(ys) / len(ys)) - px(anchor[1])]


def pack(kind, size, anchor, standing, source_keys, clips):
    columns = max(len(frames) for _, frames, _, _ in clips)
    w, h = px(size)
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
    return {"src": source, "width": w, "height": h, "anchor": {"x": px(anchor[0]), "y": px(anchor[1])},
            "standingPixels": px(standing), "clips": actions}, {
                "sources": [SOURCES[key] for key in source_keys],
                "redrawn": True, "generation": "redrawn/generation.json",
                "sha256": sha256((IMAGES / source).read_bytes()).hexdigest(),
            }


def crouch_walk():
    """Register the six generated cels without changing their common scale or horizontal framing."""
    image = Image.open(IMAGES / SOURCES["crouch-walk"]).convert("RGBA")
    cell_width, cell_height = image.width // 3, image.height // 2
    assert image.width % 3 == 0 and image.height % 2 == 0
    cells = [image.crop((column * cell_width, row * cell_height, (column + 1) * cell_width, (row + 1) * cell_height))
             for row in range(2) for column in range(3)]
    # The generated alpha contains a faint outer veil. Keep only the solid character silhouette.
    for cel in cells:
        cel.putalpha(cel.getchannel("A").point(lambda alpha: 255 if alpha >= 200 else 0))
    bounds = [cel.getbbox() for cel in cells]
    left, top = min(box[0] for box in bounds), min(box[1] for box in bounds)
    right, bottom = max(box[2] for box in bounds), max(box[3] for box in bounds)
    frames = []
    for cel, box in zip(cells, bounds):
        registered = Image.new("RGBA", (right - left, bottom - top))
        registered.alpha_composite(cel.crop((left, top, right, box[3])), (0, bottom - box[3]))
        # Use the kneeling base's height; every frame retains this one common scale.
        target_height = load("crouch").height
        target_width = round(registered.width * target_height / registered.height)
        assert target_width <= px(80)
        reduced = normalizer.recolor(registered.resize((target_width, target_height), Image.Resampling.NEAREST), 'rifleman')
        frame = blank((96, 84))
        frame.alpha_composite(reduced, (px(12), px(76) - target_height))
        frames.append(frame)
    assert len({frame.tobytes() for frame in frames}) == 6, "Crouch-walk cels must differ"
    assert all(frame.getbbox()[3] == px(76) for frame in frames), "Crouch-walk feet must share the ground anchor"
    return "crouch-walk", frames, [144] * len(frames), True


def infantry(kind, hip, hip_x, source_anchor, baseline):
    source = load(kind)
    anchor = (31, 76)
    size = (96, 84)

    def cell(pose, feet=baseline, shift=0):
        frame = blank(size)
        overlay(frame, cut(pose, (0, 0, pose.width / DENSITY, feet)), (anchor[0] - source_anchor + shift, anchor[1] - feet))
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
    if kind == "officer":
        clips = clips[:2] + [("signal", [cell(load(key)) for key in
            ["officer", "officer-half", "officer-full", "officer-full", "officer-half", "officer"]],
            [100, 140, 400, 400, 160, 200], False)]
        keys += ["officer-half", "officer-full"]
    if kind == "rifleman":
        crouch = load("crouch")
        crouch_height = crouch.height / DENSITY
        lower = cell(crouch, crouch_height)
        clips += [
            march("walk-aim", 9),
            ("kneel", [cell(dip(source, hip, baseline, d)) for d in (4, 9)] + [lower], [60, 60, 55], False),
            ("crouch", [lower], [1000], True),
            ("crouch-fire", [cell(firing(crouch, crouch_height * .62, n), crouch_height) for n in (1, 3, 1, 0)], [34, 32, 34, 30], False),
            crouch_walk(),
        ]
        keys.append("crouch")
        keys.append("crouch-walk")
    return pack(kind, size, anchor, baseline, keys, clips)


def tank_art():
    source = load("tank")
    wheels = [(23, 120, 13), (207, 120, 13)] + [(x, 132, 7) for x in (55, 78, 101, 125, 148, 172)]
    frames = []
    for phase in range(6):
        pose = source.copy()
        for box, direction in [((26, 103, 191, 107), 1), ((40, 137, 177, 141), -1)]:
            tread = cut(source, box)
            pose.paste(ImageChops.offset(tread, px(direction * phase * 2), 0), px(box[:2]))
        for cx, cy, radius in wheels:
            box = (cx - radius, cy - radius, cx + radius + 1, cy + radius + 1)
            wheel = cut(source, box).rotate(-phase * 12, resample=Image.Resampling.NEAREST)
            mask = Image.new("L", wheel.size)
            ImageDraw.Draw(mask).ellipse(px((0, 0, radius * 2, radius * 2)), fill=255)
            pose.paste(wheel, px(box[:2]), mask)
        frames.append(pose)
    assert all(cut(frame, (0, 0, source.width / DENSITY, 103)).tobytes() == cut(source, (0, 0, source.width / DENSITY, 103)).tobytes()
               for frame in frames), 'Driving must not alter the redrawn hull, turret or gun'
    return pack("tank", logical_size(source), (100, 141), 91, ["tank"], [
        ("idle", [source], [1000], True), ("drive", frames, [95] * 6, True),
    ])


def commander_art():
    source = load("commander")
    frames = []
    for angle, drop in [(0, 0), (1, 0), (2, 1), (3, 1), (2, 1), (1, 0)]:
        image = blank((52, 46))
        overlay(image, source, (0, 4 + drop))
        image = image.rotate(-angle, center=px((17, 42)), resample=Image.Resampling.NEAREST)
        image.paste((0, 0, 0, 0), px((0, 42, 52, 46)))
        frames.append(image)
    return pack("commander", (52, 46), (17, 42), 38, ["commander"], [
        ("idle", frames, [300, 135, 135, 245, 135, 135], True),
    ])


def js(value):
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{key if key.isidentifier() else repr(key)}: {js(item)}" for key, item in value.items()) + " }"
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(map(js, value)) + "]"
    return repr(value) if isinstance(value, str) else json.dumps(value)


def main():
    generation = json.loads((HERE / 'redrawn/generation.json').read_text(encoding='utf-8'))
    assert generation['tool'] == 'built-in image_gen'
    assert generation['pixelDensity'] == DENSITY == 2, 'Keep the approved double-density pixel art'
    for entry in generation['assets']:
        path = HERE / 'redrawn' / entry['image']
        assert sha256(path.read_bytes()).hexdigest() == entry['sha256'], 'Redrawn source changed'
        for reference in entry['references']:
            assert sha256((ROOT / reference).read_bytes()).hexdigest() != entry['sha256'], 'Idea pixels cannot become finished art'
    assert {entry['id'] for entry in generation['assets']} == {'rifleman', 'gunner', 'tank', 'commander', 'crouch-walk', 'backpack', 'officer'}
    normalizer.prepare_sources()
    atlases = {
        "rifleman": infantry("rifleman", 44, 22, 29, 69),
        "backpack": infantry("backpack", 44, 23, 29, 69),
        "officer": infantry("officer", 44, 23, 29, 69),
        "gunner": infantry("gunner", 42, 23, 29, 69),
        "tank": tank_art(),
        "commander": commander_art(),
    }
    atlases['tank'][0]['crewAnchor'] = {'x': px(103), 'y': px(60)}
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
        if 'crewAnchor' in art:
            assets[-1]['crewAnchor'] = art['crewAnchor']
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
