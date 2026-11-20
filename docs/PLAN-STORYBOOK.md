# Storybook gradivnih blokova

Sopstveni Storybook u kome se svaki blok 2D i 3D sveta isprobava sam, kroz svoja stanja i parametre.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Korak | Rezultat | Status |
|---|---|---|---|---|
| 1 | [SB-01](#sb-01) | 2D pozornica i prvi blok | Strelac živi van igre i gađa metu na mišu | ✅ Done |
| 2 | [SB-12](#sb-12) | Zajednička mašina stanja za 2D blokove | Mala, čista mašina stanja u zajedničkom kodu; dogovor `states`, `state`, `setState` za sve blokove | ✅ Done<br>Prvi korisnik: strelac Franje Kluza; ceo smoke na kraju T1 |
| 3 | [SB-02](#sb-02) | Avioni, tenkovi i vojnici: spisak, animacije, stanja i pucanje | Biraš animirane 2D vojnike, vozila i Bf 109 i tenk iz Tenkića, menjaš im stanja i gledaš kako pucaju | 🔄 In progress<br>Ostalo: provera curenja u browseru |
| 4 | [SB-03](#sb-03) | Kontrole parametara | Panel podešavanja sam nastaje iz izvezenih objekata podešavanja bloka | 📋 TODO |
| 5 | [SB-04](#sb-04) | Ostali blokovi Franje Kluza i zajednički kod | PVO, efekti, aerodrom i pozadina imaju priče; opšti blokovi su u zajedničkom kodu, sa svojim unit testovima | 📋 TODO |
| 6 | [SB-05](#sb-05) | Više blokova na pozornici · uslovno | Blokovi se dodaju jedan uz drugi i deluju jedan na drugog | 📋 TODO |
| 7 | [SB-06](#sb-06) | Ostali blokovi Ustanka, Visa i Tenkića | Priče, nezavisni blokovi i njihovi unit testovi | 📋 TODO |
| 8 | [SB-07](#sb-07) | Ostali blokovi ostalih 2D igara | Priče i nezavisni blokovi za Do Trsta, Čamac, Bunker, Ranjenik, Neretvu i Otpisane | 📋 TODO |
| 9 | [SB-08](#sb-08) | 3D pozornica | Orbitna kamera, svetlo, tlo, kontrole kao u 2D, dugmad stanja i animacija | 📋 TODO |
| 10 | [SB-13](#sb-13) | 3D likovi na zajedničkoj mašini stanja | 3D FSM koristi mašinu iz SB-12; ponašanje likova je isto | 📋 TODO |
| 11 | [SB-09](#sb-09) | 3D likovi | Priče za likove iz `core3d/actor/derived` | 📋 TODO |
| 12 | [SB-10](#sb-10) | 3D letelice i objekti | Priče za `core3d/aircraft` i `core3d/objects` | 📋 TODO |
| 13 | [SB-11](#sb-11) | Smoke provera, dokumentacija i pregled | Svaka priča se otvara bez greške i curenja; vlasnik pregledao | 📋 TODO |

## Cilj i obim

- **Cilj (odluka vlasnika):** projekat gradi blokove iz kojih se sastavlja bilo kakav 2D ili 3D svet, ne samo pojedinačne igre. Blok je čista, nezavisna komponenta: radi sam na pozornici, a sve što mu treba dobija kroz opcije pri stvaranju. Storybook je i alat za isprobavanje i merilo: blok koji ne može sam na pozornicu još nije gotov.
- **Obuhvaćeno:**
  - nova stranica [storybook.html](../storybook.html) u korenu, kao [ui.html](../ui.html), sa kodom u `storybook/`;
  - priče za sve postojeće objekte 2D i 3D igara i za zajedničke aktere iz `core/actor`, `core3d/actor`, `core3d/aircraft` i `core3d/objects`;
  - refaktorisanje koje bloku treba da radi sam, uključujući prebacivanje opšteg bloka iz igre u zajednički kod.
- **Van obima:** novi art i nove gameplay mogućnosti. Greške koje storybook otkrije, a nisu deo nezavisnosti bloka, beleže se u plan igre ili [TODO](../README.md#todo). Stranica se ne pojavljuje u glavnom meniju i ne troši novčiće.
- **Zajednički kod:** Claude sam refaktoriše blok i prebacuje ga u `core/` ili `core3d/` kad to traži nezavisnost bloka, i javlja šta je urađeno (odluka vlasnika). Izmena koja menja ponašanje postojeće igre čeka vlasnikovo odobrenje. Izmena u `core/`, `core3d/` ili `ui/` dobija unit test i ulazi u ceo smoke, po [pravilu projekta](../.claude/CLAUDE.md).

## Kako se čita

- **Izvršilac:** Claude, redom, jedan korak po nalogu; posle koraka čeka „dalje”.
- **Done:** korak je Done kad je njegov „Gotovo kada” ispunjen. Vlasnik pregleda stranicu u SB-11; to je uslov samo za SB-11.
- **Provere:** testovi, lint i browser pokreću se samo uz vlasnikovu dozvolu, po [pravilu dokumentacije](DOCS.md#statusi-u-planovima-postupne-izrade-igara). Smoke uvek u jednom Chrome-u. Ceo smoke za izmene zajedničkog koda traži se na kontrolnim tačkama talasa, ne posle svakog bloka.
- **Procene:** min / verovatno / max u poenima; 1 p je idealan radni dan jednog agenta. Čekanje na nalog i dozvole nije uračunato.
- **Traka:** poslednje polje naslova koraka; ceo plan ima jednu traku, Claude.
- **Blok:** klasa objekta koju svet koristi, npr. strelac, lovac, PVO, eksplozija. **Priča:** jedan blok sam na pozornici, u jednom početnom podešavanju, npr. lovac spreda ili otpozadi (odluka vlasnika). Naziv je preuzet iz Storybook-a.
- **Meta:** nevidljiva tačka na pokazivaču miša, veličine aviona, koja zamenjuje igrača; blok je gađa, a ona broji pogotke.
- **Uslovno:** korak postoji samo ako vlasnik to zatraži.
- **Kontrole:** panel parametara koji storybook pravi sam (SB-03). **Stanja:** dugmad iz spiska stanja bloka (SB-12). Panel nema druge radnje: događaji iz igre, kao uzbuna ili pogodak, nisu deo bloka (odluka vlasnika).

## Sažetak

- Ukupno **23 p** (15 min, 33 max), isto toliko radnih dana, dvanaest koraka redom, plus uslovni SB-05 (0.5 / 1 / 1.5 p); raspored u [plan-storybook.json](plan-storybook.json).
- Prvi talas postavlja zajedničku mašinu stanja (SB-12), pa daje ono što vlasnik prvo traži: spisak aviona, tenkova i vojnika svih 2D igara, sa animacijama, stanjima i pucanjem, pa kontrole parametara. Drugi talas pokriva ostale blokove Franje Kluza. Zatim slede ostale 2D igre, pa 3D. Scene sa više blokova dolaze tek ako ih vlasnik zatraži (SB-05).
- Stanja svih blokova vodi jedna mala mašina stanja u zajedničkom kodu: prvo je dobijaju 2D blokovi, a u talasu 3D na nju prelaze i 3D likovi (SB-13), pa isto znanje ne stoji na dva mesta (odluka vlasnika).
- Glavni rizik je blok koji zavisi od svoje scene. SB-01 to proverava na strelcu, kome trebaju avion, sesija i kamera, a refaktorisanje radi nezavisnosti je deo svakog koraka sa blokovima.

## Pretpostavke

- Stranica je razvojni alat, ne sadržaj igre, pa [pravilo odobravanja UI elemenata](DOCS.md#odobravanje-ui-elemenata) na nju ne važi (odluka vlasnika). Vlasnik je pregleda u SB-11.
- Bez React-a, build-a i novih biblioteka: obična stranica u čistom JavaScript-u, kao ostatak projekta (odluka vlasnika).
- Kontrole su automatske i bez besmislenih polja (odluka vlasnika). Storybook ih pravi samo iz izvezenih objekata podešavanja modula bloka, kao `fighter` u [Fighter.js](../scenes/franjo-kluz/Fighter.js) i `rifle` u [Rifleman.js](../scenes/franjo-kluz/Rifleman.js), nikad iz unutrašnjih polja objekta (predlog agenta, prihvaćen u razgovoru).
- Priče su u `storybook/stories/`, po jedna datoteka za vrstu bloka. Ceo alat se uklanja brisanjem `storybook/` i `storybook.html` (predlog agenta).
- Blokovi rade uz lažne zavisnosti: kameru `{ cameraX, cameraY }`, `GameSession` i metu koja zamenjuje igrača, kao u unit testovima Franje Kluza, npr. [franjoKluz.test.js:22-37](../tests/unit/franjoKluz.test.js#L22-L37). Potvrđeno je za Kluza; za ostale igre nije provereno.

## Kontekst

Provereno prema `d68b74500b18101da8d1171352d87589bba990a5` i radnoj kopiji od 2026-11-20.

- Projekat nema build: [index.html:233-239](../index.html#L233-L239) mapira `three` kroz importmap, pa ga `storybook.html` mora ponoviti.
- Scena pokreće petlju i sesiju u `start()` ([core/Scene.js:102-104](../core/Scene.js#L102-L104)) i pauzira obe u `pause()` ([core/Scene.js:136-140](../core/Scene.js#L136-L140)). Opcija `disableEvents` isključuje startni ekran i pauzu ([core/Scene.js:17-38](../core/Scene.js#L17-L38)).
- Sesija ima stanja `loading → ready → running ⇄ paused → finished` ([core/runtime/GameSession.js:5](../core/runtime/GameSession.js#L5)), a sat igre teče samo u `running` ([GameSession.js:62](../core/runtime/GameSession.js#L62)).
- Blok igrača čita tastere preko `Input` iz `Player2D` ([core/actor/Player2D.js:14-22](../core/actor/Player2D.js#L14-L22)), pa ga stranica vozi istom tastaturom kao igra.
- 3D likovi menjaju stanje kroz `setState(name)` ([core3d/actor/Actor.js:191](../core3d/actor/Actor.js#L191)), a animacije su u `anim.actions` ([core3d/actor/Animator.js:11](../core3d/actor/Animator.js#L11)). Orbitna kamera već postoji u [core3d/helpers.js:9](../core3d/helpers.js#L9).
- U `core3d/actor/derived` i `core3d/aircraft/derived` ima 45 klasa: 13 fantastičnih, 8 horor i 13 ratnih likova, 5 ostalih aktera i 6 letelica.

## Pravila rada

1. **Nezavisnost bloka:** blok, stanja, telo i upravljač, pucanje i storybook kao merilo su opisani u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi); svaki korak ih sprovodi. Pojedinačne izvezene konstante, kao `passOffset` u [Fighter.js](../scenes/franjo-kluz/Fighter.js), prelaze u objekat podešavanja kad blok dobija kontrole.
2. **Unit test bloka:** svaki blok dobija svoj test po [pravilu](ARHITEKTURA.md#gradivni-blokovi), u koraku svoje priče.
   - **Bez gubitka pokrivenosti:** pre brisanja provere iz testa igre, isti slučaj mora postojati u testu bloka i padati kad se ponašanje pokvari.
3. **Refaktorisanje:** ide u korak priče tog bloka. Igre koje blok koriste ponašaju se isto, a to dokazuju njihovi postojeći unit testovi i novi test bloka koji pada bez izmene. Opšti blok, koji nije vezan za priču jedne igre, prelazi u `core/` ili `core3d/`; izmena se javlja vlasniku.
4. **Životni ciklus:** sve što pozornica ili blok doda na `document`, `window` ili zajedničko platno uklanja se pri promeni priče, kao pri promeni igre ([pravila životnog ciklusa](../.claude/CLAUDE.md)).
5. **Stil:** stranica koristi postojeće stilove iz [ui/style.css](../ui/style.css) i ne uvodi novu temu.

## Raspored

| Talas | Claude | Trajanje u radnim danima (min / verovatno / max) |
|---|---|---|
| T1 · Osnova | SB-01, SB-12, SB-02, SB-03 · **7 p** | 4.5 / 7 / 9.5 |
| T2 · Franjo Kluz | SB-04 · **1.5 p** | 1 / 1.5 / 2.5 |
| T3 · Ostale 2D igre | SB-06, SB-07 · **5.5 p** | 3.5 / 5.5 / 7.5 |
| T4 · 3D | SB-08, SB-13, SB-09, SB-10 · **8 p** | 5.5 / 8 / 12 |
| T5 · Završetak | SB-11 · **1 p** | 0.5 / 1 / 1.5 |

**Kontrolne tačke**

1. **Kraj T1:** iz spiska se bira svaki animirani 2D vojnik i vozilo, Bf 109 i tenk iz Tenkića; njegove animacije, stanja i pucanje rade, a kontrole iz izvezenih podešavanja menjaju ga uživo.
2. **Kraj T2:** svaki blok Franje Kluza radi sam; strelac, PVO i lovac gađaju metu na mišu, a Potezom upravlja vlasnik. Ceo smoke prolazi ako je menjan zajednički kod.
3. **Kraj T3:** svaka 2D igra ima priču za svaki blok, ili zapis u nalazima zašto je nema; ceo smoke prolazi.
4. **Kraj T4:** svaki 3D lik pušta svaku svoju animaciju; letelice i objekti se vide, okreću i imaju kontrole.
5. **Kraj T5:** smoke otvara sve priče u jednom Chrome-u; vlasnik je pregledao stranicu.

## Koraci

<a id="sb-01"></a>

### SB-01 · 2D pozornica i prvi blok · 1 / 1.5 / 2 p · Claude

- **Šta:**
  - `storybook/Stage2D.js`, podklasa `Scene2D` sa `disableEvents: true`. Ima svoju kameru (`cameraX`, `cameraY`), liniju tla i nebo iz `drawSky`.
  - Meta zamenjuje igrača: nevidljiva tačka prati pokazivač miša, a blok je dobija kao `plane` ili `player`. Pozornica crta samo blok.
  - `storybook.html` za sada prikazuje samo strelca iz Franje Kluza, sa dugmadima njegovih stanja.
- **Uzor:** postavljanje scene i lažnih zavisnosti u [franjoKluz.test.js:22-37](../tests/unit/franjoKluz.test.js#L22-L37); prikaz kamere u `render()` iz [scenes/franjo-kluz/Main.js](../scenes/franjo-kluz/Main.js).
- **Gotovo kada:** unit test pravi `Stage2D` sa strelcem i proverava sledeće:
  - posle `end()` na `document` i `window` nema dodatih rukovalaca;
  - strelac posle uzbune puca u metu iznad sebe.
- **Zamke:**
  - `die()` u `GameObject2D` zaustavlja objekat ([core/actor/GameObject2D.js:166-169](../core/actor/GameObject2D.js#L166-L169)).
  - U happy-dom se slike ne učitavaju, pa test zadaje širinu i visinu ([franjoKluz.test.js:562](../tests/unit/franjoKluz.test.js#L562)).

<a id="sb-12"></a>

### SB-12 · Zajednička mašina stanja za 2D blokove · 1 / 1.5 / 2 p · Claude

- **Zašto:** u 2D svaki blok vodi stanja na svoj način: [Strelac](../scenes/ustanak/Strelac.js) sam bira sliku za idle i pucanje, [Occupier](../core/actor/Occupier.js) ima brojače hoda, a [Tenk](../scenes/tenkici/Tenk.js) nema imenovana stanja. Zato ni storybook ni drugi kod ne mogu da znaju koja stanja blok ima. Mašina stanja po objektu je standardni obrazac za ponašanje likova ([Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html)); vlasnik je izabrao jednu zajedničku za 2D i 3D, prvo za 2D.
- **Šta:**
  - **Mašina:** `core/gameplay/StateMachine.js`, čista logika bez crtanja i DOM-a, kao ostala pravila u `core/gameplay` ([ARHITEKTURA](ARHITEKTURA.md#odgovornosti)). Prima vlasnika i stanja kao obične objekte `{ enter(owner, from), update(owner, dt), exit(owner, to) }` po imenu. Ima `set(name)` (isto stanje se ne ponavlja; prelaz poziva `exit` starog i `enter` novog), `name`, `names` i `update(dt)`. Nepoznato ime baca grešku.
  - **Dogovor za blokove:** blok sa ponašanjem ima `states` (imena), `state` (trenutno) i `setState(name)`. Stanje pri ulasku pokreće svoju animaciju; prelaze odlučuju stanja i blok, ne storybook.
  - **Granica:** blok bez različitih ponašanja, npr. metak, eksplozija ili zastavnik koji samo maše, nema stanja. Svaki blok sa stanjima koristi ovu mašinu, i kad ih ima samo dva, da svi rade isto.
- **Uzor:** [core3d/actor/FSM.js](../core3d/actor/FSM.js) za `setState` koji ne ponavlja isto stanje i redosled `exit` pa `enter`; čista pravila u [core/gameplay](../core/gameplay/).
- **Gotovo kada:** unit test mašine proverava redosled `exit` i `enter`, da isto stanje ne ulazi ponovo, da `update` ide samo u trenutno stanje i da nepoznato ime baca grešku. Lint granica slojeva prolazi.
- **Zamke:** 3D `FSM` bira klasu stanja po tome da li je lik igrač ([core3d/actor/FSM.js:19-23](../core3d/actor/FSM.js#L19-L23)). Taj izbor ostaje kod 3D likova i ne ulazi u zajedničku mašinu (SB-13).

<a id="sb-02"></a>

### SB-02 · Avioni, tenkovi i vojnici: spisak, animacije, stanja i pucanje · 1.5 / 2.5 / 3.5 p · Claude

- **Zašto prvo:** vlasnik najpre hoće da lista i bira avione, tenkove i vojnike, pušta njihove animacije, menja stanja i puca (odluka vlasnika).
- **Šta:**
  - **Spisak:** `storybook/stories/index.js` daje tri vrste: avioni, tenkovi i vozila, vojnici. Svaka vrsta izvozi `{ title, stories: [{ name, block, create(stage) }] }`, gde je `block` modul bloka, a `create` vraća blok na pozornici. Uz priču piše iz koje igre ili zajedničkog koda blok dolazi.
  - **Blokovi (odluka vlasnika):** prvo samo oni sa animiranim artom iz `assets/images/armies/game-ready` koje nivoi koriste, po jedna priča za svaku varijantu:
    - vojnici: nemački strelac i jurišnik iz Franje Kluza (`Rifleman`), i iz Ustanka partizanski strelac (`Strelac`), partizanski i italijanski zastavnik (`Zastavnik`) i partizanska i italijanska posada topa (`Posada`);
    - tenkovi i vozila: Hummel, dva Opel Blitz kamiona i oklopni voz BP-42 iz Franje Kluza (`kinds` u [enemies.js](../scenes/franjo-kluz/enemies.js)), i tenk iz Tenkića (`TenkLevo`, `TenkDesno`), jedini tenk koji danas puca, sa cevi koja se okreće;
    - avioni: lovac Bf 109 iz Franje Kluza, sa propelerom koji se okreće.
  - **Ostali** avioni, tenkovi i vojnici sa mirnim slikama dolaze u SB-04, SB-06 i SB-07.
  - **Bez radnji:** panel ima samo dugmad stanja; blok bez stanja dobija ih po SB-12 ili ostaje bez dugmadi. Blok koji puca gađa metu na mišu.
  - **Stanja:** blok sa ponašanjem objavljuje stanja po dogovoru iz SB-12; storybook od `states` sam pravi dugmad. Prvi korisnici su vojnik (miran, patrolira, puca, pogođen, pao), tenk (stoji, ide, puca, uništen) i avion (leti, puca, pada). Patrola vojnika Franje Kluza dobija animaciju hoda kad Codex završi zahtev 2 iz [FK-13](PLAN-KLUZ.md#fk-13); do tada stanje patrole postoji, a vojnik ne hoda.
  - **Upravljanje:** avion i tenk igrača prave se sa pravim `Input`-om, pa ih voziš i pucaš tastaturom igre.
  - **Adresa:** levo je stablo „vrsta → blok → priča”, a adresa je `storybook.html#<vrsta>/<priča>`, pa se priča otvara linkom i preživljava reload. Promena priče gasi staru pozornicu sa `end()` pre nove.
  - **Nezavisnost:** blok koji ne može sam na pozornicu postaje nezavisan po pravilima rada 1–3, sa svojim unit testom. Ako to traži veću preradu, njegova priča čeka SB-04, SB-06 ili SB-07, a razlog ide u nalaze ovog koraka.
- **Uzor:** [ui.html](../ui.html) za razvojnu stranicu u korenu; [scenes/main.js:31-128](../scenes/main.js#L31-L128) za `location.hash`; unit testovi igara u `tests/unit/` za lažne zavisnosti.
- **Gotovo kada:**
  - unit test proverava da svaka priča ima jedinstvenu adresu i da se pravi i gasi bez greške;
  - svaki blok sa gornjeg spiska ima priču ili zapis u nalazima; tenk iz Tenkića u stanju `fire` okreće cev ka meti i ispaljuje granatu;
  - svaki blok u stanju `fire` ispali bar jedan projektil na metu;
  - testovi igara više ne proveravaju sopstveno ponašanje blokova iz ovog koraka (pravilo rada 2); prvi su strelčevi slučajevi u [franjoKluz.test.js](../tests/unit/franjoKluz.test.js) i [franjoKluzArt.test.js](../tests/unit/franjoKluzArt.test.js), koje sada pokriva [rifleman.test.js](../tests/unit/rifleman.test.js);
  - u browseru deset promena priče ne ostavlja dodatne rukovaoce ni elemente; meri se kao u [tests/smoke/leaks.spec.js](../tests/smoke/leaks.spec.js), uz vlasnikovu dozvolu.

<a id="sb-03"></a>

### SB-03 · Kontrole parametara · 1 / 1.5 / 2 p · Claude

- **Šta:**
  - **Kontrole:** `storybook/controls.js` pregleda izvoze modula bloka (`block` iz priče) i uzima samo obične objekte čija su polja brojevi, da/ne vrednosti ili takvi ugnežđeni objekti. Funkcije, klase i pojedinačne konstante preskače. Od broja pravi klizač od 0 do četiri puta veće vrednosti od početne (za 0 do 1), od da/ne prekidač, a od ugnežđenog objekta grupu.
  - **Promena vrednosti:** menja polje izvezenog objekta, pa ponovo pravi priču, da promena deluje i na vrednosti koje blok pročita samo pri stvaranju. Dugme „Vrati” vraća početne vrednosti, a one se vraćaju i pri promeni priče, da izmena ne pređe u drugu priču ni u igru.
  - **Pozornica:** dodaju se uvećanje, prikaz okvira sudara i izbor podloge (nebo, šahovnica).
- **Uzor:** objekti `fighter`, `wreckFall` u [Fighter.js](../scenes/franjo-kluz/Fighter.js) i `rifle` u [Rifleman.js](../scenes/franjo-kluz/Rifleman.js).
- **Gotovo kada:** unit test za `controls.js` proverava da od izvoza `Fighter.js` nastaju kontrole za `fighter` i `wreckFall`, a ne za klasu ni `passOffset`. Promena brzine strelca ponovo pravi priču sa novom vrednošću, a promena priče vraća početnu.
- **Zamke:** izvezena konstanta (`export const x = 5`) ne može se menjati spolja, jer je uvoz samo za čitanje; zato kontrole prave samo od objekata (pravilo rada 1). Okvir sudara se crta posle bloka, na istoj kameri; zastavica `debug` u `Renderer2D` crta oblik umesto slike ([core/Renderer2D.js:64](../core/Renderer2D.js#L64)) i nije prikaz okvira.

<a id="sb-04"></a>

### SB-04 · Ostali blokovi Franje Kluza i zajednički kod · 1 / 1.5 / 2.5 p · Claude

- **Šta:**
  - **PVO bez mete:** PVO još nišani avion sam, sa predviđanjem leta (`aim` u [Flak.js](../scenes/franjo-kluz/Flak.js)). Telo prelazi na `aimAt` i pucanje niz cev, a predviđanje leta u upravljača, kao [Gunner](../core/gameplay/Gunner.js).
  - **Priče:** Potez u NDH i partizanskim oznakama, PVO sa cevi koja prati metu i rasprskavanjem, bomba, eksplozija, plamen pucnja, aerodrom, ruševina i slojevi pozadine.
  - **Nezavisnost:** blokovi Franje Kluza, i oni iz SB-02, postaju nezavisni po pravilima rada 1–3. Opšti blokovi, npr. eksplozija, plamen pucnja, PVO top, lovac, vojnik sa puškom i vozilo-meta, prelaze u zajednički kod po [rasporedu po vrstama](ARHITEKTURA.md#gradivni-blokovi), a [Sentry](../core/gameplay/Sentry.js) i [Gunner](../core/gameplay/Gunner.js) u `core/gameplay/controllers/`. Pravila igre, kao uzbuna i pritajeni let, ostaju u [Main.js](../scenes/franjo-kluz/Main.js) i menjaju samo stanja blokova.
- **Uzor:** `createEnemy` u [Main.js](../scenes/franjo-kluz/Main.js) za opcije koje blokovi danas dobijaju.
- **Gotovo kada:**
  - unit test proverava da svaki blok iz `scenes/franjo-kluz` i iz zajedničkog koda u koji je prešao ima bar jednu priču;
  - izuzeci su moduli bez objekta: `Main.js`, `missions.js`, `enemies.js`, `spriteArt.js` i `view.js`;
  - svaki blok ima svoj unit test po pravilu rada 2, provere njegovog ponašanja su prebačene iz testova Franje Kluza, a [franjoKluz.test.js](../tests/unit/franjoKluz.test.js) proverava samo misije, uzbunu, sletanje i to kako igra slaže blokove; svi unit testovi prolaze.
- **Zamke:** `outsideView` iz [view.js](../scenes/franjo-kluz/view.js) radi sa svetskim koordinatama kamere. Pri prelasku blokova u zajednički kod i on prelazi sa njima, umesto da se kopira.

<a id="sb-05"></a>

### SB-05 · Više blokova na pozornici · 0.5 / 1 / 1.5 p · uslovno · Claude

- **Okidač:** vlasnik zatraži scene sa više blokova; do tada priča prikazuje jedan blok (odluka vlasnika).
- **Šta:**
  - **Dodavanje:** dugme „Dodaj blok” stavlja blok iz kataloga na pozornicu pored postojećih, na mestu klika.
  - **Meta:** blok koji traži metu dobija izabrani blok umesto lažne mete, npr. strelac i PVO gađaju Potez kojim vlasnik upravlja.
  - **Kontrole:** svaki blok na pozornici ima svoje kontrole i stanja; panel prikazuje one izabranog bloka.
- **Gotovo kada:** unit test stavlja na pozornicu Potez, PVO i strelca, podiže uzbunu i proverava da oba gađaju Potez. Uklanjanje bloka ne ostavlja rukovaoce.

<a id="sb-06"></a>

### SB-06 · Ostali blokovi Ustanka, Visa i Tenkića · 2 / 3 / 4 p · Claude

- **Upravljači tenka:** tenk iz Tenkića ima stanja od SB-02, ali tastaturu igrača i AI još drži u sebi (`handleInput`, `samohod` u [Tenk.js](../scenes/tenkici/Tenk.js)). Oni prelaze u zasebne upravljače, kao [Sentry](../core/gameplay/Sentry.js), a Tenkići i Do Trsta ih dodeljuju tenkovima; ponašanje igara ostaje isto.
- **Šta:** priče za blokove iz `scenes/ustanak`, `scenes/vis` i `scenes/tenkici` koje SB-02 nije pokrio: top (`Top`), avioni iz Visa (`Avionce`, `Enemy`, `Boss`), đule, zastava, vetar, pozadine i pojačanja, i za `Flame` iz `core/actor`. Blokovi postaju nezavisni i dobijaju svoje unit testove po pravilima rada 1–3. Blok koji ne može da postane nezavisan bez promene ponašanja igre ide u tabelu „Nalazi” ovog koraka, sa predlogom za vlasnika.
- **Uzor:** blokovi i priče iz SB-04; unit testovi tih igara u `tests/unit/` za lažne zavisnosti.
- **Gotovo kada:** važi isti test pokrivenosti kao u SB-04, za ove foldere, svaki blok ima svoj unit test, a provere blokova su prebačene iz testova tih igara, i svaka priča se pravi i gasi bez greške. Unit testovi tih igara prolaze, a tabela nalaza je popunjena ili prazna.

<a id="sb-07"></a>

### SB-07 · Ostali blokovi ostalih 2D igara · 1.5 / 2.5 / 3.5 p · Claude

- **Šta:** priče i nezavisni blokovi koje SB-02 nije pokrio, npr. avion iz Do Trsta (`Aircraft`), `Mitraljezac`, `Patrola`, `Svabo`, i `Occupier`, `Grenadier`, `GrenadierSprite`, `WoundedSoldier`, `SideVehicle` i `TopDownPlayerVehicle` iz `core/actor`, za `scenes/to-trieste`, `scenes/camac`, `scenes/bunker`, `scenes/ranjenik`, `scenes/neretva` i `scenes/otpisani`, po pravilu iz SB-06.
- **Gotovo kada:** isti test pokrivenosti, testovi igara i tabela nalaza kao u SB-06.

<a id="sb-08"></a>

### SB-08 · 3D pozornica · 1.5 / 2 / 3 p · Claude

- **Šta:**
  - **Pozornica:** `storybook/Stage3D.js`, podklasa `Scene3D` sa `disableEvents: true`. Ima orbitnu kameru iz `createOrbitControls`, svetlo, tlo, kontrole iz SB-03, i dodavanje blokova iz SB-05 ako taj korak postoji.
  - **Stanja i animacije:** dugmad stanja nastaju iz `states` po dogovoru iz SB-12, kao u 2D, a spisak animacija iz `anim.actions`.
  - **Upravljanje:** lik igrača se vozi tastaturom igre.
- **Uzor:** [core3d/helpers.js:9](../core3d/helpers.js#L9) za kameru; [core3d/actor/Actor.js:183-192](../core3d/actor/Actor.js#L183-L192) za stanja.
- **Gotovo kada:** unit test pravi `Stage3D` sa jednim likom i bez grafičkog konteksta proverava spisak stanja. U browseru jedan lik pušta svako svoje stanje, a posle `end()` platno `#platno-3d` je prazno i bez rukovalaca.
- **Zamke:** `AnimationMixer` šalje `finished` i `loop` za svaku akciju, i za onu koja se gasi ([pravilo projekta](../.claude/CLAUDE.md)). Dugme stanja ne sme da reaguje na tuđi događaj.

<a id="sb-13"></a>

### SB-13 · 3D likovi na zajedničkoj mašini stanja · 1.5 / 2 / 3 p · Claude

- **Šta:** [core3d/actor/FSM.js](../core3d/actor/FSM.js) prelazi na `StateMachine` iz SB-12. Izbor klase stanja za igrača ili AI ostaje u 3D kodu kao fabrika stanja, a klase iz `core3d/actor/states` postaju stanja zajedničke mašine. `Actor.setState` i imena stanja ostaju ista, pa se igre ne menjaju.
- **Uzor:** mašina i dogovor iz SB-12; [core3d/actor/Actor.js:183-192](../core3d/actor/Actor.js#L183-L192).
- **Gotovo kada:** postojeći unit testovi 3D likova prolaze; novi unit test proverava da 3D lik prelazi kroz idle, walk i attack preko zajedničke mašine. Ceo smoke prolazi u jednom Chrome-u, uz vlasnikovu dozvolu, jer se menja zajednički kod svih 3D igara.
- **Zamke:** stanje 3D lika poziva `enter(oldState, oldState?.action)` sa prethodnom akcijom animacije ([core3d/actor/FSM.js:34](../core3d/actor/FSM.js#L34)); zajednička mašina mora preneti prethodno stanje, a 3D stanja odatle čitaju akciju.

<a id="sb-09"></a>

### SB-09 · 3D likovi · 1.5 / 2.5 / 3.5 p · Claude

- **Šta:** priče za likove iz `core3d/actor/derived/fantasy` (13), `horror` (8) i `ww2` (13), kao i za `Cannon`, `Elephant`, `Flamingo`, `Tank` i `Zeppelin`, sa podrazumevanim modelom i oružjem iz njihovih igara. Likovi postaju nezavisni i dobijaju svoje unit testove po pravilima rada 1–3.
- **Gotovo kada:** unit test proverava da svaka klasa iz tih foldera ima priču, a svaki lik ima svoj unit test stanja, bez učitavanja modela. U browseru svaki lik pušta sve svoje animacije; lik čiji se model ne učita ide u tabelu nalaza.

<a id="sb-10"></a>

### SB-10 · 3D letelice i objekti · 1 / 1.5 / 2.5 p · Claude

- **Šta:** priče za `core3d/aircraft` (`Warplane`, `Airship`, `Missile`), `core3d/aircraft/derived` (6) i `core3d/objects` (18). Gde klasa to ima, priče pokazuju okretanje, let, pogodak i rušenje.
- **Gotovo kada:** isti test pokrivenosti kao u SB-09, za ove foldere, i tabela nalaza.

<a id="sb-11"></a>

### SB-11 · Smoke provera, dokumentacija i pregled · 0.5 / 1 / 1.5 p · Claude

- **Šta:**
  - **Smoke:** `tests/smoke/storybook.spec.js` otvara svaku priču iz kataloga i proverava da nema greške u konzoli i da blok postoji. Posle svih priča broj rukovalaca i elemenata je kao na početku.
  - **Dokumentacija:**
    - u [README](../README.md) ide jedan red o otvaranju `storybook.html`;
    - cilj gradivnih blokova, pravilo nezavisnosti i unit test bloka idu u [ARHITEKTURA](ARHITEKTURA.md);
    - komanda i ograničenja provere idu u [TESTING](TESTING.md).
  - **Plan:** trajna znanja prelaze u dokumentaciju, pa se plan briše.
- **Gotovo kada:** smoke spec prolazi u jednom Chrome-u, uz vlasnikovu dozvolu, a vlasnik je prošao kontrolnu listu ispod. Nalazi iz SB-06 do SB-10 su rešeni ili upisani u planove igara ili TODO.
- **Kontrolna lista** (vlasnik):
  - [ ] Kontrole menjaju blok uživo, „Vrati” ga vraća, a u panelu nema besmislenih polja.
  - [ ] Blok prati i gađa mesto pokazivača miša, a pogoci se broje.
  - [ ] Okvir sudara se poklapa sa slikom.
  - [ ] Svaka animacija vojnika i vozila iz Franje Kluza se vidi i završava kako treba.

## Rizici

| Rizik | Posledica | Ublažavanje |
|---|---|---|
| Blok zavisi od svoje scene, npr. čita `scene.player` ili globalno stanje | Priča ne može da ga napravi | Refaktorisanje u koraku bloka (pravila rada 1–3); SB-01 proverava obrazac na strelcu |
| Prebacivanje bloka u zajednički kod promeni ponašanje igre | Igra radi drugačije posle izmene | Postojeći unit testovi igre, unit test bloka i ceo smoke na kontrolnoj tački; promena ponašanja čeka vlasnika |
| Pozornica ostavlja rukovaoce ili crteže posle promene priče | Sledeća priča se ponaša drugačije nego u igri | `end()` kao u igrama; merenje curenja u SB-02 i SB-11 |
| Kontrole izmene izvezeni objekat podešavanja | Izmena pređe u drugu priču ili u igru | Vraćanje početnih vrednosti pri promeni priče (SB-03) |
| Happy-dom ne učitava slike ni modele | Unit testovi ne vide izgled | Unit testovi proveravaju katalog, kontrole i životni ciklus; izgled proverava vlasnik u browseru |
| 3D modeli se dugo učitavaju | Smoke za sve priče traje dugo | SB-11 meri trajanje; po potrebi smoke otvara po jednu priču iz 3D vrste, uz zapis u TESTING |

## Nije preneto

- Biblioteka Storybook i React: traže build i Node server, a projekat nema build (odluka vlasnika).
- Kontrole iz unutrašnjih polja objekta: daju besmislena polja (odluka vlasnika).
- Upravljanje vremenom (pauza, korak po kadar, usporavanje): vlasniku ne treba; uvodi se tek ako zatreba (odluka vlasnika).
