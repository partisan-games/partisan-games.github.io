# The Germans Advance — zajednički art

[prepare.py](prepare.py) priprema zajedničke atlase, [mapiranje klipova](../../../../core/actor/advanceArt.js) i [metapodatke](sprites.json) od precrtanih osnova. Originalne sličice služe samo kao reference stila i opreme; njihovi pikseli nisu izvor gotovih poza.

## Precrtavanje bez promene stila

Strelac, mitraljezac, strelac sa rancem, podoficir, Panzer III i zasebni komandir precrtani su ugrađenim `image_gen`, uz očuvan jednostavan piksel stil, konture, paletu i proporcije referenci. [Stvarni promptovi, reference i hashovi](redrawn/generation.json) čuvaju poreklo svih novih osnova, faza čučećeg hoda i podoficirovog znaka rukom. Ovo nije novo istorijsko istraživanje uniforme, oznaka ili varijante vozila.

[Normalizacija](redrawn/normalize.py) uklanja slab alfa veo pragom 200, ujednačeno svodi crteže nearest-neighbor postupkom i ograničava boje na paletu originalnih referenci. Hod i trzaj grade se od novih osnova; tenk ima šest malih točkova, pokretne gusenice i točkove, a komandir sopstveni crtež i blag pokret. Njegova glava ostaje u razmeri pešadije, dok se donji deo tela skriva u kupoli; mesto oslonca čita se iz metapodataka, bez posebnog podešavanja po sceni.

Priprema proverava hash generisanih osnova i odbija direktno preuzimanje referentne slike kao gotovog arta. Testovi proveravaju poreklo svih aktera, klipove, oslonce, oba smera i aktuelnost lossless WebP kopija. Posle pripreme osvežiti odgovarajuće runtime kopije i optimizacioni manifest.

[Zajednički prikaz](../../../../core/actor/AdvanceSprite.js) koristi iste atlase u katalogu i promo sceni. [Koreografija](../../../../scenes/bitka/Battle.js) zaustavlja pomeranje pri klečanju, pucanju i davanju znaka, a hod vezuje za stvarno pređeni put. [Zajednički kadar](preview.png), njegov [uvećani prikaz](preview-2x.png) i [ključni kadrovi rasporeda](formation-preview.png) nastaju iz runtime atlasa pomoću [preview.py](preview.py); to je dokaz razmere i sastavljanja, ne snimak igre u pregledaču.
