# Renault FT — tekstura

[Ploče oklopa](../../../images/textures/vehicles/renault-ft-plates.webp) imaju nacrtane zakovice, šarke, proreze, rubove panela i habanje preko [osnovne teksture](../../../images/textures/vehicles/renault-ft-base.webp). Šablon je izveden iz četiri ortografska pogleda na postojeći FBX. [Prikaz](../../../../core3d/actor/derived/tankCondition.js) poravnava atlas u lokalnim koordinatama jer se UV ostrva preklapaju. Zasebni materijali pokretnih gusenica zadržavaju svoju ponovljivu teksturu. [Šablon, poreklo i priprema](plates.json).

[Raniji albedo](../../../images/textures/vehicles/renault-ft.webp) ima 1254 × 1254 px, sa tamnozelenim oklopom na levoj i tamnim čelikom na desnoj polovini. Služi kao izvor za osnovnu teksturu. Dve runtime mape od 512 × 512 zajedno koriste oko 2,67 MiB RGBA sa mip nivoima, prema oko 8,0 MiB ranije. Model i raspored grupa za iscrtavanje ostaju isti.

[Istorijski opis](https://tanks-encyclopedia.com/renault-ft-and-renault-kegresse-in-service-with-the-kingdom-of-yugoslavia/) navodi zadržanu francusku tamnozelenu boju jugoslovenskih FT. Nijansa i istrošenost su umetnička procena; nisu rekonstrukcija konkretnog vozila kod Kraljeva. Tačan model tamo zaplenjenog Renaulta ostaje nepotvrđen prema [kontekstu igre](../../../../docs/KONTEKST.md#demolish-barricades).

[Izvorni FBX](../renault-ft.fbx) ostaje neizmenjen, sa postojećim [poreklom](../readme.txt); njegova prava nisu ponovo utvrđivana. [Runtime FBX](textured.fbx) ima samo prilagođene UV koordinate i neutralan materijal; teksturu učitava postojeći loader kroz [opis tenka](../../../../core3d/actor/derived/Tank.js). Geometrija, transformacija i veličina ostaju iste. Nova skripta prati MIT licencu projektnog koda; generisani albedo nema preuzete fotografske piksele.

[preview.py](preview.py) se pokreće Blenderom 4.5 u pozadini, uvozi original, odvaja UV oblasti hodnog dela, izvozi runtime FBX i proverava da su 712 temena, 432 poligona i svetske koordinate očuvani unutar 0,01 mm. Brojevi komponenti važe za hash originala iz manifesta; pri promeni izvora ponovo pregledati dodelu materijala. Zatim renderuje stvarno izvezeni model [spreda](preview.png) i [otpozadi](rear.png), bez pregledača. Python paket Pillow služi samo za lossless konverziju izvornog generisanog PNG-a u WebP.

Offline prikazi potvrđuju raspored materijala, ne izgled pri osvetljenju svake igre. Pregled u katalogu i kroz igranje radi vlasnik.
