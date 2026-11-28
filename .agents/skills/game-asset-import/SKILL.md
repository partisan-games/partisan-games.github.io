---
name: game-asset-import
description: "Uvozi u Partisan Games preuzet ili nacrtan 2D i 3D asset, kao avion, vozilo ili lik: smeštaj, priprema, merenje, stvarni podaci i vrednosti igre, priča u katalogu i provere. Koristi kad vlasnik doda model u Downloads ili Codex preda nov art. Ne koristi za precrtavanje tekstura, za to su game-actor-art-2d i game-actor-art-3d."
---

# Uvoz asseta u projekat

Ovo je redosled koraka; pravila su u odeljcima na koje koraci vode, i ona važe.

## 1. Izbor i smeštaj

1. Od više preuzetih verzija istog modela uporedi trouglove, slike, odvojene delove i izgled, pa uzmi onaj sa najvećim kvalitetom za najmanje trouglova, kako izgleda u igri, koji odgovara periodu i ulozi. Pregled iscrtaj u Blenderu. Različiti oblici iste vrste, kao vrbe ili vagoni, nisu verzije: uvezi sve, da ih igra koristi naizmenično (vlasnik, 2026-11-28).
2. 3D model sačuvaj u folder nazvan po modelu: avioni idu u [aircraft](../../../assets/models/aircraft), ostalo u odgovarajuću vrstu pod `assets/models`. U folder idu `model.glb`, `preview.png` i kratak `README.md`. README navodi trouglove i veličinu, autora i izvornu stranicu iz metapodataka modela, i da li je model u igri, katalogu ili rezervi. Uz pripremljeni 2D art čuvaj izvor i ponovljivu pripremu, kao u [game-ready](../../../docs/ART.md#pravila-pripreme-i-ponovne-upotrebe).
3. Proceni trošak modela u sceni koja ga koristi: trouglove, materijale, pozive za iscrtavanje i veličinu tekstura, prema tome koliko se primeraka vidi odjednom. Dozvoljene su samo optimizacije koje ne menjaju oblik:
   - smanjenje slika, [pripremom](../../../scripts/shrink-glb-textures.py);
   - spajanje delova sa istim materijalom, kao [optimizacija figura](../../../scenes/cannon/optimizeFigure.js);
   - uklanjanje duplikata i mapa koje se ne koriste.

   Trouglovi preuzetog modela se ne smanjuju (vidi [3D avione](../../../docs/ART.md#3d-avioni)); pretežak model zameni lakšim. Trošak pre i posle uporedi istom merom i upiši u README.
4. I 2D slika se optimizuje, takođe bez menjanja izgleda. Čuva se kao lossless WebP ([pravilo](../../../docs/ART.md#slike-aktera-kao-lossless-webp)). Razlučivost odgovara izvornoj razmeri njene grupe igara: nije veća nego što ijedna igra crta, a ni manja od toga ([razmera](../../../docs/ART.md#razmera)). Prazne ivice se seku samo uz očuvanje sidrišta, oslonca i mera tela. Kadrovi istog aktera idu u jedan atlas, sa providnim razmakom oko ćelija. Veličinu fajla pre i posle uporedi i upiši uz izvor.

## 2. Merenje i razmera

1. Smer nosa, veličinu i delove meri u three.js, onako kako ih igra učitava, a ne samo u Blenderu (vidi [3D avione](../../../docs/ART.md#3d-avioni)).
2. Razmeru odredi po pravilima [razmere](../../../docs/ART.md#razmera): telo je stvarne veličine, a bombarderi Ratweek-a imaju raspon krila 0,585 stvarnog.
3. Pokretne delove, poput elisa i gusenica, poveži u zajedničkom prikazu tako da se pomeraju oko svoje ose.
4. Model već pripremljen u metrima opiši sa `scale: 1`: bez `size` ili `scale` [učitavač](../../../core3d/loaders.js) svaki model smanjuje ili uvećava na visinu od 2 m. Tako su most i pruga u Ratweeku isprva bili pogrešne veličine (2026-11-28).
5. Posle pretvaranja FBX-a u GLB pročitati materijale u GLB-u. Blender izostavlja `metallicFactor` kad je metalnost 0 u čvoru koji nije povezan, a glTF tada podrazumeva 1, pa je model u igri crn; vagoni Ratweeka su tako izašli crni (2026-11-28). Uvoznik FBX-a vezuje alfu teksture u svaki materijal, pa neprozirnim materijalima alfu treba odvezati; lišće nacrtano na crnoj podlozi bez alfe dobija masku iz boje, kao [vrba](../../../assets/models/nature/trees/willow/README.md).

## 3. Podaci i vrednosti igre

Vozilo ili avion dobija stvarne podatke i svoje vrednosti igre ([obavezan korak](../../../docs/ART.md#obavezna-integracija)):

- masu, najveću brzinu i naoružanje iz izvora, u [STATISTIKE](../../../docs/STATISTIKE.md) i [modelStatistics](../../../core/gameplay/modelStatistics.js);
- brzinu, izdržljivost, vatrenu moć i bombe izvedene iz tih podataka, u [modelPerformance](../../../core/gameplay/modelPerformance.js), da se modeli razlikuju u igri.

Vrednost koje nema u izvoru se izostavlja, ne izmišlja.

## 4. Katalog i igra

1. Napravi opis modela i priču u katalogu pre ulaska u igru, po [pravilima kataloga](../../../docs/KATALOG.md#dodavanje-priče). Svako stanje mora moći da se uključi dugmetom, a letelica leti u mestu.
2. Kada asset ulazi u igru, poveži isti resurs u svim potrošačima ([obavezan korak](../../../docs/ART.md#obavezna-integracija)). Tekst koji igrač vidi, poput naziva u izboru, prvo predloži vlasniku.

## 5. Provere

1. Posle dodavanja, premeštanja ili brisanja modela obnovi art katalog: `python -B scripts/build-art-catalog.py`.
2. Pokreni `node scripts/check-project.js` i testove kataloga i modela koje izmena dotiče, uključujući pokrivenost kataloga i učitavanje opisa modela.
3. Vlasniku daj adresu priče u katalogu (`http://localhost:8080/pages/catalog.html#...`) i reci šta nisi video na ekranu.
