"""Static source-state checks at game size, without launching the game or a browser."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
IMAGES = ROOT / 'assets/images'

def load(path):
    source = IMAGES / path
    if source.suffix == '.svg':
        rendered = HERE / (source.stem + '.png')
        subprocess.run(['magick', '-background', 'none', str(source), str(rendered)], check=True)
        source = rendered
    return Image.open(source).convert('RGBA')

def main():
    contact = Image.new('RGBA', (1050, 570), '#58614a')
    pen = ImageDraw.Draw(contact)
    for index, faction in enumerate(['nemci', 'cetnici']):
        atlas = load('armies/game-ready/vojnici/' + faction + '-spreda.png')
        pen.text((4, index*145+4), faction + ': hidden/rise, aim, shot, fall; near 1x and far .5x', fill='white')
        for row in range(4):
            for variant in range(3):
                frame = atlas.crop((variant*64, row*72, (variant+1)*64, (row+1)*72))
                x = row*250+variant*72
                contact.alpha_composite(frame, (x+4, index*145+25))
                contact.alpha_composite(frame.resize((32, 36), Image.Resampling.NEAREST), (x+4, index*145+100))
    boat = load('armies/camac.png').resize((178, 76), Image.Resampling.NEAREST)
    destroyed = load('armies/game-ready/wrecks/player-boat.png').resize((178, 76), Image.Resampling.NEAREST)
    pen.text((4, 300), 'Player boat: accepted hull / new disabled hull', fill='white')
    contact.alpha_composite(boat, (4, 320))
    contact.alpha_composite(destroyed, (220, 320))
    sboat = load('armies/game-ready/brodovi/schnellboot-s30.svg').resize((275, 50), Image.Resampling.NEAREST)
    pen.text((4, 420), 'S-30 hull sink: 0%, 50%, 90%; excludes procedural water/gun effects', fill='white')
    for i, progress in enumerate([0, .5, .9]):
        frame = sboat.resize((round(275*(1-progress*.08)), round(50*(1-progress*.45))), Image.Resampling.NEAREST)
        frame.putalpha(frame.getchannel('A').point(lambda a: round(a*(1-progress)**.7)))
        contact.alpha_composite(frame, (4+i*340, 445))
    contact.convert('RGB').save(HERE / 'states-game-size.png')
    sources = ['core/actor/soldiers/TrenchSoldier.js', 'scenes/camac/Boat.js', 'scenes/camac/SBoat.js',
        'scenes/camac/SinkingWreck.js', 'scenes/camac/ShoreMachineGun.js', 'scenes/camac/ShoreDestruction.js',
        'scenes/camac/WaterEffects.js', 'core/actor/aircraft/DiveBomber.js', 'core/actor/aircraft/Fighter.js',
        'scenes/to-trieste/Aircraft.js', 'scenes/vis/Enemy.js', 'scenes/vis/Avionce.js', 'scenes/vis/PlayerView.js']
    metadata = {'scope': 'Source geometry, static source composition and unit checks only. Not a game screenshot or browser/motion acceptance.',
        'sources': sources, 'findings': [
            {'actor': 'player boat', 'finding': 'Intact still hull on defeat', 'action': 'Created player-boat wreck and integrated shared Renderer2D selection, reset and the catalogue dead state.'},
            {'actor': 'S-30', 'finding': 'Four-second hull scale/fade, smoke/bubbles/ripple, separate rotating deck guns and water wake already present', 'action': 'Retain existing procedural sinking and firing; game check deferred.'},
            {'actor': 'trench soldiers, both factions', 'finding': 'Three variants, four readable source poses; .28s rise blend, .18s shot/recoil, 1.2s collapse and sink; near scale1/far .5', 'action': 'Retain accepted poses; no missing-state redraw supported by this source review.'},
            {'actor': 'Bunker machine gunner', 'finding': 'No defeated body art', 'action': 'Created four-frame .6s collapse, same crop and origin, final pose held in shared actor.'},
            {'actor': 'Flak38 and PaK38', 'finding': 'No operators in previous body art', 'action': 'Created independent two-man crews, ready/work/collapse clips, actual-shot triggers, preserved colliders and barrels.'},
            {'actor': 'shore nest', 'finding': 'Separate two-man crew drawable, live cropped rifleman and defeated body-only crop with separated dropped rifle, rotated sagging tube and timed destruction already present', 'action': 'Retain existing crew depiction; defer in-game motion acceptance.'},
            {'actor': 'planes', 'finding': 'Separate props now present; bullets/bombs, fire and trajectory/shrinking crash already distinguish action and defeat', 'action': 'Retain actual procedural flight/death; no redundant body state atlas.'},
        ]}
    (HERE / 'review.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
    print('Prepared static near/far trench poses, both boat hull states and three S-30 sinking stages. Browser not used.')

if __name__ == '__main__':
    main()
