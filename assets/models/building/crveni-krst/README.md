# Crveni krst — originalni modularni ambijent

Originalni modeli za pripremu IG-29; mere su procena za igru, ne arhitektonsko merenje. Istorijska osnova i ograničenja: [istraživanje](../../../../docs/ISTORIJA.md#crveni-krst-12-februar-1942), [vizuelne reference](../../../../docs/references/ww2-yu/crveni-krst/README.md), [pravila rasporeda](../../../../docs/KONTEKST.md#escape-enemy-base).

Paket koriste katalog i [Escape Enemy Base / Crveni krst](../../../../index.html#fps-base). Uslov pobede ostaje izlazak iz lavirinta.

[Katalog: zajednički sklop](../../../../catalog.html#scenografija-3d/sklop) je pod **3D → Scenografija → Sklopovi**. Pojedinačni modeli imaju zasebne stavke; kapija ima probu otvaranja, kula probu paljenja i usmeravanja reflektora. [Zajednički prikaz](../../../../core3d/actor/buildings/CampProp.js) čuva iste metre i modele za oba potrošača. [Sklop nivoa](../../../../scenes/fps-base/CampEnvironment.js) zasebno određuje prepreke za hod, vidljivost i metke; početni kataloški sklop nije njegov tlocrt.

| Model | Namena i spajanje u Three.js koordinatama |
|---|---|
| [Zgrada](storehouse.glb) | Zatvoren spoljašnji model, osnova 32×9 m, krov 9,1 m, vrh dimnjaka 9,74 m; vrata 2,3 m. Središte osnove je (0,0,0), fasada gleda ka +Z. Nema enterijera ili prolaza kroz naslikane prozore. |
| [Ravna ograda](fence-straight.glb) | Veza od (0,0,0) do (5,0,0); stub na početku i sredini, završni stub se dodaje jednom na kraju niza. Visina stuba 2,6 m. |
| [Ugao](fence-corner.glb) | Zajednički početni stub i dva kraka do (5,0,0) i (0,0,−5). |
| [Završni stub](fence-terminal.glb) | Lokalni oslonac u (0,0,0); zatvara poslednju tačku ravnog ili ugaonog modula. |
| [Kapija](gate.glb) | Otvor 5 m između osa stubova; `GateLeft` i `GateRight` imaju zasebne šarke. Dvokrilni model je likovna procena, ne potvrđen izgled kapije 1942. |
| [Drveni zaklon](timber-screen.glb) | Širina 5 m, visina oko 2,5 m, osnova centrirana. Pun zaklon; unutrašnja upotreba je arkadna sloboda. |
| [Kula](watchtower.glb) | Platforma na 4,25 m, vrh oko 7,1 m; model prema referentnoj silueti. `SearchlightAim` nosi lampu i jedan spot bez dinamičke senke. Visina i radni pokret su procena za igru. |

Žica je jeftina geometrija sa stvarnim prazninama, umesto planiranih providnih ravni: ravni modul ima 282 trougla, dva materijala i odvojene grupe `FencePosts` / `FenceWire`. Nivo deli stubove na spojevima i grupiše niti i završne stubove u tri instancirana sklopa; kratki završni delovi žice prilagođavaju samo dužinu. Žica blokira hod zasebnim nevidljivim kolizionim površinama, a propušta pogled i metke. Pregrada koristi stvarne pune daske i ostaje običan mesh radi ispravnih tragova pogodaka. Materijali na svih sedam modela koriste isti [atlas](materials.png), 1254×1254 (izvorna dimenzija generisanja, veća od početnog predloga 1024²). Atlas nije smanjivan niti pozajmljen sa istorijskih slika.


[Licenca originalnog koda i modela](LICENSE.txt).
