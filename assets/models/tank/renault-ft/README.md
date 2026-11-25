# Renault FT — tekstura

[Tekstura](../../../images/textures/vehicles/renault-ft.webp) je originalno generisan albedo ugrađenim `image_gen`, 1254 × 1254 px, sačuvan kao lossless WebP bez promene piksela. Leva polovina je tamnozeleni oklop, desna tamni čelik gusenica i hodnog dela. Stvarni prompt, izvor za paletu i SHA-256 otisci su u [generation.json](generation.json). Nema oznaka jedinice ni vojske, jer isti model koriste obe strane.

[Istorijski opis](https://tanks-encyclopedia.com/renault-ft-and-renault-kegresse-in-service-with-the-kingdom-of-yugoslavia/) navodi zadržanu francusku tamnozelenu boju jugoslovenskih FT. Nijansa i istrošenost su umetnička procena; nisu rekonstrukcija konkretnog vozila kod Kraljeva. Tačan model tamo zaplenjenog Renaulta ostaje nepotvrđen prema [kontekstu igre](../../../../docs/KONTEKST.md#demolish-barricades).

[Izvorni FBX](../renault-ft.fbx) ostaje neizmenjen, sa postojećim [poreklom](../readme.txt); njegova prava nisu ponovo utvrđivana. [Runtime FBX](textured.fbx) ima samo prilagođene UV koordinate i neutralan materijal; teksturu učitava postojeći loader kroz [opis tenka](../../../../core3d/actor/derived/Tank.js). Geometrija, transformacija i veličina ostaju iste. Nova skripta prati MIT licencu projektnog koda; generisani albedo nema preuzete fotografske piksele.

[preview.py](preview.py) se pokreće Blenderom 4.5 u pozadini, uvozi original, odvaja UV oblasti hodnog dela, izvozi runtime FBX i proverava da su 712 temena, 432 poligona i svetske koordinate očuvani unutar 0,01 mm. Brojevi komponenti važe za hash originala iz manifesta; pri promeni izvora ponovo pregledati dodelu materijala. Zatim renderuje stvarno izvezeni model [spreda](preview.png) i [otpozadi](rear.png), bez pregledača. Python paket Pillow služi samo za lossless konverziju izvornog generisanog PNG-a u WebP.

Offline prikazi potvrđuju raspored materijala, ne izgled pri osvetljenju svake igre. Pregled u katalogu i kroz igranje radi vlasnik.
