# Junkers Ju 52

[model.glb](model.glb) koriste [katalog](../../../../catalog.html#letelice-3d/junkers-ju-52-model) i nivo Drvar kroz isti prikaz.

Sve četiri teksture su ugrađene u GLB.

Model ima 9.061 trougao, 5 materijala i 12 primitiva za iscrtavanje; prozirni delovi i tri propelera su odvojeni.

[Telo transporta](../../../../core/gameplay/bodies/aircraft/Transport.js) ima samo `idle` (mirovanje), `move` (let) i `dead` (pad i zaustavljanje na tlu). Pogodak dodaje dim; obaranje ne dozvoljava ponovni let. Katalog prikazuje samo avion: desant i stvaranje padobranaca pripadaju nivou.

[Prikaz](../../../../core3d/actor/aircraft/Ju52.js) prati položaj, smer i pad tela, okreće tri dvokraka propelera i prikazuje dim. Osovine propelera upisane su u model. Izvoz GLB pretvara geometriju iz Blenderovog Z-up u Y-up, ali ne pretvara prilagođene JSON podatke: osovine se zato izričito zapisuju kao `[x, z, -y]`. Provera zahteva da osovina bude unutar geometrije i da sredina stvarnih lopatica ostane na njoj pri rotaciji, a ne samo da sam pivot miruje. Visina od 5,8 m je procenjena mera; pokreti su proceduralni, bez novih snimljenih klipova.

## Poreklo i prava korišćenja

U dostavljenom paketu nema licence. [Sketchfab kandidat](https://sketchfab.com/3d-models/junkers-ju-52-66810e4514e14d47b297f6680e5628a1), 42manako, sa odgovarajućim brojem trouglova, navodi CC BY ali i da je BUTTHE4D izvukao model iz *Men of War: Assault Squad*. Podudarnost broja trouglova sama ne dokazuje identitet; prava ponovne upotrebe nisu potvrđena. Ovaj resurs ne proglašavamo MIT modelom niti originalnim artom projekta; originalna skripta optimizacije prati licencu projektnog koda.
