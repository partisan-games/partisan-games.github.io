# Plan ideja

Dogovoreno u [kontekstu igara](KONTEKST.md), a još neurađeno. Igra koja preraste u višednevni posao dobija svoj plan.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-02](#ig-02) | Tenkići | Istorijski protivnik u Bihaću | Codex | ⛔ Blocked<br>U dostupnim izvorima nije utvrđen model tenka bihaćke odbrane 1942. Do potvrde ostaje postojeći nemački tenk. [Izvori po bojištu](ISTORIJA.md#protivnički-oklop-po-bojištima-u-tenkićima) |
| 2 | [IG-05](#ig-05) | Čamac | Novi neprijateljski čamci, obale Šolte, novo ime igre i moguće dalje etape | Codex, Claude, Vlasnik | 📋 TODO<br>Tri etape, ostrva i gnezda na stenama su u igri, a S-čamac je „kraljica”. Codex crta neprijateljske čamce i obale Šolte, Claude ih povezuje; ime i dalje etape bira vlasnik |
| 3 | [IG-06](#ig-06) | Tenkići, Ustanak | Igrač vidi mesto i godinu istorijskog bojišta | Claude | ⛔ Blocked<br>Čeka odluku vlasnika gde prikazati mesto i godinu |
| 4 | [IG-10](#ig-10) | Avatar | Kocke i novčići se nikada ne preklapaju, a svaki novčić može da se skupi | Claude | 📋 TODO |
| 5 | [IG-12](#ig-12) | Cannon | Partizanski top u kanjonu Neretve ruši utvrđenje dok posada ne istakne belu zastavu | Claude, Codex, Vlasnik | 📋 TODO |

Pravila rada: [DOCS](DOCS.md) i [CLAUDE.md](../.claude/CLAUDE.md). Nov art radi Codex po pravilima iz [ART](ART.md); placeholder nije art. Novi UI elementi i tekstovi traže vlasnikovo odobrenje. Agent ne pravi commit bez naloga. Urađenu stavku agent proverava tako što sam odigra nivo (probe, upravljač ili testovi koji igraju scenu) i tada je zatvara i uklanja iz plana; vlasnikova partija i osećaj igre nisu uslov (odluka vlasnika, 2026-11-22).

<a id="ig-02"></a>
## IG-02 · Tenkići: više nivoa

- **Dogovor ([kontekst](KONTEKST.md#tenkići)):** svaki nivo je druga bitka sa svojim tenkovima i bojištem; Sremski front je ravnica sa rovovima.
- **Šta:** meč do dve pobede, najviše tri runde, kao u Ustanku (odluka vlasnika); svaka runda se bije na sledećem bojištu kroz pozadine iz [pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina) (Sremski front, Batina i ostale; Sremski front se javlja dva puta, sa razlikom u stanju bojišta); grad ostaje jedno od bojišta.
- **Redosled (odluka vlasnika):** bojišta idu hronološki: početak Sremskog fronta (kraj oktobra 1944), Batina (novembar 1944), proboj Sremskog fronta (april 1945), pa ostala, a posle poslednjeg ispočetka. Beograd (oktobar 1944) je opcion i išao bi prvi, samo ako se ista pozadina ne koristi već u drugoj igri, da se ne ponavlja.
- **Tenkovi:** igrač koristi isti partizanski tenk. Nove protivnike podržavaju [zajednički tenk](../core/gameplay/bodies/vehicles/Tank.js) i [Storybook](../storybook.html#vozila/nemacki-tenk). Za Bihać proveriti nove izvore o sastavu odbrane pre crtanja. Neimenovani grad koristi postojeći generički tenk.
- **Provereno:** četiri odigrana meča pokrila su svih sedam bojišta i povratak na prvo. Srem koristi M15/42, Batina StuG III, Drvar Somuu S35, a Užice Hočkis. Modeli predstavljaju dokumentovanu opremu jedinice ili područja. Stepen potvrde za svaku bitku naveden je u [istorijskim izvorima](ISTORIJA.md#protivnički-oklop-po-bojištima-u-tenkićima).

<a id="ig-05"></a>
## IG-05 · Čamac: ime igre i dalje etape

- **Sada:** tri etape su u [igri](../scenes/camac/Main.js) (noćno isplovljavanje iz luke na Visu, desant na Šoltu, povratak kroz kanal pod napadom S-čamaca), a pobeda dolazi posle povratka. Svaka etapa počinje otvorenim morem, prolazi pored ostrva od stena sa jedne ili obe strane, a pred kraj gornja obala sa kućicama najavljuje naselje (zahtev vlasnika, 2026-11-22; [Obala](../scenes/camac/Obala.js)).
- **Neprijatelji (zahtev vlasnika, 2026-11-22):** više neprijatelja, većih i manjih. S-čamac je „kraljica”: izdrži oko trideset metaka (`sBoat.health`). Gnezda mitraljeza stoje na stenovitim obalama svih etapa, gušće nego ranije, a nikad u naselju.
- **Art za neprijatelje (Codex):** u pogledu odozgo i razmeri [našeg čamca](../assets/images/armies/camac.png), uz olupine: nemački patrolni čamac, isti kao naš, ali sa nemačkom posadom; jedan manji neprijateljski čamac i jedan veći brod, manji od S-čamca. Claude ih zatim povezuje kao tela sa standardnim stanjima, pričama i rasporedom po etapama.
- **Art (Codex):** Šolta danju nema traku golih stena ni traku obale sa kućicama, pa njena ostrva i naselje za sada koriste njene obale sa poljima. Potrebne su dve trake u stilu i veličini [slike Šolte](../assets/images/background/camac-solta.png) (768 px u dužini, obala uz gornju ili donju ivicu, uz [podatke o liniji obale](../assets/images/sources/pozadine/camac-etape/prepare.py)): gole stene i naselje sa kućicama. Kad stignu, menja se samo izbor slika u [Obala](../scenes/camac/Obala.js).
- **Opcione kasnije etape:** drugi desanti sa Visa 1944, Brač (jun, partizani sa britanskim komandosima; prvi kandidat), Mljet (maj) i Korčula; pre razrade proveriti izvore u [ISTORIJA](ISTORIJA.md).
- **Ime igre (odluka vlasnika kasnije):** „Landing on Šolta” više ne pokriva sve etape; novo ime poželjno pominje desant ili partizansku mornaricu.

<a id="ig-06"></a>
## IG-06 · Mesto i godina bojišta

- **Zahtev vlasnika:** kada pozadina prikazuje istorijsko mesto, igrač treba da sazna koje je mesto i koja godina, npr. „Sremski front, jesen 1944” ili „Grahovo, 1941”.
- **Odakle:** imena i periodi već postoje u metapodacima pozadina ([current-backgrounds.json](../assets/images/sources/pozadine/current-backgrounds.json), polje `name`); igra ih ne prepisuje, nego čita odatle ili iz zajedničkog spiska bojišta u [BattleBackground](../scenes/tenkici/BattleBackground.js).
- **UI:** gde i kako se prikazuje (poruka na početku runde, natpis uz rezultat ili drugo) odlučuje vlasnik pre izrade ([pravilo](DOCS.md#odobravanje-ui-elemenata)); agent predlaže, ne menja UI sam.
- **Gotovo kada:** vlasnik je odobrio prikaz; u svakoj rundi Tenkića i Ustanka igrač vidi mesto i godinu tog bojišta; unit test da runda prikazuje podatke svog bojišta.

<a id="ig-10"></a>
## IG-10 · Avatar: kocke i novčići se ne preklapaju i svi se mogu skupiti

- **Zahtev vlasnika:** naći algoritam po kome se kocke i novčići u igri Avatar nikada ne preklapaju, i da je svaki novčić sigurno moguće skupiti.
- **Sada:** [createRandomBoxes](../core3d/geometry/index.js) baca 400 kocki od 5 m nasumično po mapi od 200 m i na visini od -5 do 50 m, bez provere preklapanja. [Scena](../scenes/avatar/Main.js) stavlja novčić (i ponekad platformu) 6,15 m iznad svake od prvih 100 kocki, pa novčić može da upadne u drugu kocku; niko ne proverava da li se do njega može doći.
- **Šta:** kocka se postavlja samo ako ne seče već postavljene, uz razmak (odbacivanje i novo izvlačenje, ili Poisson-disk raspored); novčić i platforma samo na mesto koje nije u kocki niti zaklonjeno njome: oko novčića i iznad svakog oslonca ima mesta za ceo lik avatara, a nijedna kocka ne preseca put skoka. Svaki novčić mora biti dostižan Kamenku i Laveniju, koji samo skaču: od tla, preko kocki i platformi, svaki sledeći oslonac je na dohvat jednog skoka (visina i daljina skoka se mere iz tela lika), a novčić je na dohvat skoka sa nekog dostižnog oslonca; raspored koji to ne ispuni se odbacuje ili dopunjuje. Broj pokušaja je ograničen, da raspored uvek završi.
- **Gotovo kada:** unit test da se nijedne dve kocke, nijedan novčić ni platforma i nijedna kocka ne seku i da je svaki novčić dostižan lancem skokova od tla, sa mestom za lik oko novčića i na putu skoka, za više nasumičnih semena; agent je to proverio u igri.

<a id="ig-12"></a>
## IG-12 · Cannon: partizanski top ruši utvrđenje na Neretvi

- **Zahtev vlasnika (2026-11-22):** partizani upravljaju topom iz Drugog svetskog rata i ruše italijanski ili nemački bunker, odnosno staro utvrđenje koje okupator koristi kao bunker.
- **Istorija:** serija partizanskih napada na italijanske garnizone i utvrđenja u dolini Neretve početkom 1943, kao kod Jablanice. Pre razrade izvore i stanje bojišta upisati u [ISTORIJA](ISTORIJA.md); za godišnje doba važi postojeći opis Neretve u [ISTORIJA](ISTORIJA.md#rok-i-godišnje-doba), a uz dokumentovan garnizon ide i njegova zastava.
- **Top:** u projektu već postoji [ww2-gun.fbx](../assets/models/weapon/cannon/ww2-gun.fbx). Treba proveriti da li odgovara oruđu koje su partizani tada imali; ako ne odgovara, Codex nalazi drugi model. Cev se diže i spušta kao kod sadašnjeg topa ([TiltingBarrel](../core3d/actor/characters/TiltingBarrel.js)), a posadu čine partizani.
- **Meta:** utvrđenje koje se ruši deo po deo u Ammo fizici, kao sadašnji zid, sa italijanskom ili nemačkom zastavom.
- **Bojište (Codex):** 3D pozadina po uzoru na kanjon Neretve, sa strmim stenama i rekom. Na sceni su bodljikava žica i burad; u projektu već postoje [bure](../assets/models/item/barrel/model.fbx) i [modeli vojnika](../assets/models/character/soldier/). Vojnici na obe strane su opcioni.
- **Cilj:** uništiti utvrđenje ili ga razarati dok posada ne istakne belu zastavu i ne preda se.
- **Predaja:** posada se predaje kada vidi da je poraz neminovan, na primer kada je srušen određen deo utvrđenja ili kada joj ne ostane zaklon. Pravilo i prag se mere u igri i čuvaju u jednom podatku.
- **Posle predaje:** igrač može da nastavi razaranje i napade. Kako igra to nudi, novi tekstovi i ekrani, traži vlasnikovo odobrenje ([pravilo](DOCS.md#odobravanje-ui-elemenata)).
- **Gotovo kada:** unit test da se posada predaje tačno po pravilu i da igrač i posle predaje može da razara; agent je odigrao nivo do bele zastave i nastavio razaranje.
