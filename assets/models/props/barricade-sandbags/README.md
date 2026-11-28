# Barikada od džakova

[model.glb](model.glb) koristi vlasnikov `barricade_sandbags_lod0.glb`, preuzet 2026-11-27. Zid je širok 2,92 m, dubok 0,94 m i visok 1,31 m, sa dnom 5 cm ispod tla. [Pregled](preview.png) prikazuje teksturiran model.

Model ima 1.393 trougla i jedan materijal sa ugrađenom PNG teksturom od 512 × 512. [Priprema](../../../../scripts/prepare-kraljevo-models.py) uzorkuje [tkanje](burlap-source.png) u koordinatama modela, upisuje ga na postojeće UV ostrvce svakog dela i popunjava rubove za filtriranje. Tkanje je generisano u OpenAI ImageGen-u kao ravni uzorak grube, istrošene jute u prigušenim maslinastim i sivosmeđim tonovima, pri ravnom svetlu. Izvorni GLB ima SHA-256 `50c880482ca17810e3862ecf65e7d1b6be6cf4a7d48c4b80674e90f54fdad58f`.

Ugrađeni metapodaci navode autora [fertator99](https://sketchfab.com/fertator99) i [izvornu stranicu](https://sketchfab.com/3d-models/barricade-sandbags-lod0-18d348bd76004edd9a1c39155970382d).

Koristi ga [Barricade](../../../../core3d/actor/buildings/Barricade.js): tri dela čine svaku barikadu na drumu i u ulici Kraljeva, a u katalogu je „Barikada od džakova“.
