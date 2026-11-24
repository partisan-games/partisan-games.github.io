# Junkers Ju 52

[model.glb](model.glb) koriste [katalog](../../../../catalog.html#letelice-3d/junkers-ju-52-model) i nivo Drvar kroz isti prikaz.

Izvor je vlasnikov `D:/Downloads/junkers-ju-52/source/ju52.glb`, sačuvan kao [source.glb](source.glb). Sve četiri korišćene teksture već su ugrađene u GLB; izdvojene kopije tekstura i nepovezana slika tla nisu potrebne.

[optimize.py](optimize.py) pokreće se Blenderom 4.5 u background režimu. Uklanja duplirane opise tekstura i materijala i spaja neprozirne nepokretne delove; prozirni delovi i tri propelera ostaju odvojeni. Geometrija nije pojednostavljivana, teksture nisu umanjivane: 9.061 trougao, 66 → 5 materijala, 66 → 12 primitiva za iscrtavanje. Hashovi i veličine su u [optimization.json](optimization.json).

[Telo transporta](../../../../core/gameplay/bodies/aircraft/Transport.js) ima samo `idle` (mirovanje), `move` (let) i `dead` (pad i zaustavljanje na tlu). Pogodak dodaje dim; obaranje ne dozvoljava ponovni let. Katalog prikazuje samo avion: desant i stvaranje padobranaca pripadaju nivou.

[Prikaz](../../../../core3d/actor/aircraft/Ju52.js) prati položaj, smer i pad tela, okreće tri dvokraka propelera i prikazuje dim. Osovine su upisane pri optimizaciji iz obuhvatne kružnice lopatica. Izvoz GLB pretvara geometriju iz Blenderovog Z-up u Y-up, ali ne pretvara prilagođene JSON podatke: osovine se zato izričito zapisuju kao `[x, z, -y]`. Provera zahteva da osovina bude unutar geometrije i da sredina stvarnih lopatica ostane na njoj pri rotaciji, a ne samo da sam pivot miruje. Visina od 5,8 m je procenjena mera; pokreti su proceduralni, bez novih snimljenih klipova.

## Poreklo i prava korišćenja

U dostavljenom paketu nema licence. [Sketchfab kandidat](https://sketchfab.com/3d-models/junkers-ju-52-66810e4514e14d47b297f6680e5628a1), 42manako, sa odgovarajućim brojem trouglova, navodi CC BY ali i da je BUTTHE4D izvukao model iz *Men of War: Assault Squad*. Podudarnost broja trouglova sama ne dokazuje identitet; prava ponovne upotrebe nisu potvrđena. Ovaj resurs ne proglašavamo MIT modelom niti originalnim artom projekta; originalna skripta optimizacije prati licencu projektnog koda.
