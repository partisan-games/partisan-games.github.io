# Franjo Kluz: preostali posao

Tri misije su igrive; ostaju vlasnikov pregled arta i igre i ugradnja precrtanog Poteza sa pokretnim slojevima. Opis igre i odluke vlasnika su u [KONTEKST](KONTEKST.md#franjo-kluz), provere u [TESTING](TESTING.md#franjo-kluz-checks--2026-11-20).

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| 1 | [FK-13](#fk-13) | Produkcijski art neprijatelja: odobrenje u igri | Vlasnik | 🔄 In progress<br>Art ugrađen, testovi prolaze; čeka vlasnikov pregled |
| 2 | [FK-14](#fk-14) | Precrtani Potez: posada, propeler i mitraljez | Codex, Claude | 🔄 In progress<br>Art i ugradnja gotovi, unit testovi prolaze; čeka vlasnikov pregled u igri i storybook-u |
| 3 | [FK-12](#fk-12) | Kontrolna lista u igri | Vlasnik | 🔄 In progress |

Novi art, zvuk i UI element ulaze tek uz vlasnikovo odobrenje; placeholder nije art ([pravilo](DOCS.md#pravilo-za-umetnost)). Testovi i browser samo uz dozvolu; smoke samo zasebno, uz vlasnikovo odobrenje. Kad su sve stavke gotove, plan se briše.

<a id="fk-13"></a>
## FK-13 · Produkcijski art neprijatelja

Vojnici, kamioni, tenk, oklopni voz i plamen pucnja su sprite listovi; cev PVO prati avion, propeler lovca se okreće, a granata PVO se rasprskava u crni oblak. Art, izvornici i pregled animacija su u [sources/franjo-kluz](../assets/images/armies/sources/franjo-kluz/) ([preview.html](../assets/images/armies/sources/franjo-kluz/preview.html)), a [prepare.py](../assets/images/armies/sources/franjo-kluz/prepare.py) ponovo pakuje listove i generiše [spriteArt](../core/actor/spriteArt.js).

- **Gotovo kada:** vlasnik je u igri odobrio svaki crtež i animaciju.

<a id="fk-14"></a>
## FK-14 · Precrtani Potez i pokretni slojevi

- **Zašto i odluka vlasnika:** vidljivi pilot i osmatrač objašnjavaju vatru iz dvoseda. Nova posada bila je detaljnija od starog ravnog trupa, pa je vlasnik odobrio precrtavanje celog Poteza u dosledan pixel stil, uz prepoznatljivu siluetu i obe oznake. Trup ostaje miran crtež; posada, propeler i mitraljez su odvojeni pokretni slojevi.
- **Art (Codex) spreman:** precrtani trupovi [partizanski](../assets/images/armies/game-ready/avioni/potez-25-partisan-bez-mitraljeza.png) i [NDH](../assets/images/armies/game-ready/avioni/potez-25-ndh-bez-mitraljeza.png), oba 400×173, sa istom geometrijom i providnošću. Razlikuju se samo dva područja nacionalnih oznaka; broj 8 i ostali pikseli su zajednički. Originalne reference ostaju sačuvane. Trupovi ne sadrže posadu, zadnji mitraljez ni elisu, pa nema duplih nepokretnih delova.
- **Pokretni slojevi:** [posada](../assets/images/armies/game-ready/avioni/potez-25-posada-sprites.png) ima četiri kadra 400×173, petlju `idle` 1,6 s i fiksan oslonac; pilot gleda napred, osmatrač prema repu. [Propeler](../assets/images/armies/game-ready/avioni/potez-25-propeler-sprites.png) ima četiri kadra 20×128, petlju `spin` 0,12 s, različite projekcije lopatica i nepomičnu glavčinu. [Mitraljez](../assets/images/armies/game-ready/avioni/potez-25-zadnji-mitraljez.png) ostaje zaseban deo 48×20 sa pivotom i `muzzle` tačkom. Svi slojevi važe za obe oznake.
- **Izvori i pregled:** [metapodaci slojeva](../assets/images/armies/sources/franjo-kluz/potez-crew/crew.json), [standardni opisi atlasa](../assets/images/armies/sources/franjo-kluz/potez-crew/sprites.json), [interaktivni pregled](../assets/images/armies/sources/franjo-kluz/potez-crew/preview.html), animirani GIF-ovi [partizanski](../assets/images/armies/sources/franjo-kluz/potez-crew/previews/potez-25-partisan-animated.gif) / [NDH](../assets/images/armies/sources/franjo-kluz/potez-crew/previews/potez-25-ndh-animated.gif), [tačni imagegen opisi](../assets/images/armies/sources/franjo-kluz/potez-crew/prompts.json) i [ponovljiva priprema](../assets/images/armies/sources/franjo-kluz/potez-crew/prepare.py). `image` putanje su relativne metapodacima, `src` putanje su za GameObject2D.
- **Ugradnja (Claude):** zameniti oba trupa kroz zajednički Potez, uz iste mere za sudare i kadar 400×173. Posada se crta iza trupa, a propeler i mitraljez iznad, sa istom rotacijom i kamerom aviona. Faze birati po vremenu igre, čuvati ih u pauzi i vraćati pri ponovnom stvaranju. Kadrovi propelera već predstavljaju okretanje oko horizontalne osovine: ne rotirati ih kao ventilator u ravni slike niti dodatno spljoštavati celu sliku/glavčinu. Motor može raditi i na zemlji; kad je ugašen, propeler drži kadar 0, a usporavanje menja kadencu. Sidrišta su u `crew.json`; ne koristiti širinu celog atlasa kao meru aktera.
- **Pucanje (Claude):** zadnji mitraljez, kao [WorldPart](../core/actor/WorldPart.js), prati [rearTarget](../scenes/franjo-kluz/Potez.js#L177) unutar `rearGun.cone` (±60° od pravca nazad), a bez cilja se vraća nazad. Njegova slika gleda ulevo, pa je rotacija željeni ugao minus π; transformisani `muzzle` je početak metka i plamena. Pogoci, domet i ostali gameplay se ne menjaju.
- **Storybook (Claude):** ista klasa i mapiranje moraju prikazati ceo novi art i sve pokretne slojeve u obe postojeće priče: [NDH](../storybook.html#avioni/potez-ndh) i [partizanski](../storybook.html#avioni/potez-partizanski). Izdvojeni pregled nije zamena za integraciju.
- **Ugrađeno (Claude, 2026-11-20):** oba trupa, posada iza trupa (crta je sam avion, odmah pre trupa), propeler i zadnji mitraljez kroz zajednički [AtlasPart](../core/actor/AtlasPart.js) i [WorldPart](../core/actor/WorldPart.js) u [Potez](../scenes/franjo-kluz/Potez.js); storybook priče dobijaju isto kroz istu klasu. Faze idu po vremenu igre i stoje u pauzi; oboren avion gasi propeler do kadra 0. Mitraljez prati lovca iza aviona, bez cilja se vraća nazad, a metak polazi sa vrha cevi. Plamen pucnja na zadnjem mitraljezu nije dodat, kao ni na prednjem. Testovi: [atlasPart](../tests/unit/atlasPart.test.js), [potez](../tests/unit/potez.test.js). Browser nije pokretan.
- **Gotovo kada:** unit provere čuvaju mere, faze pri pauzi/resetu, ugao mitraljeza i početak metka na vrhu cevi; vlasnik je u igri odobrio oba nova izgleda i pokretne slojeve.
- **Granica:** bez arta se ništa ne ubacuje.

<a id="fk-12"></a>
## FK-12 · Kontrolna lista u igri

Vlasnik igra i štiklira ono što se vidi samo u igri:

- [ ] Napad na kolonu; zvuk PVO `cannon-shot.mp3`.
- [ ] Lovci spreda i otpozadi prolaze iznad ili ispod aviona; osmatrač puca unazad samo dok se drži Space; zvuk mitraljeza lovca `aircraft-gun.mp3`.
- [ ] Misije redom: prelaz posle sletanja u prvoj, poletanje u drugoj.
- [ ] Potez u oznakama NDH u prvoj misiji: protivnici ćute do pola puta, pa sirena i uzbuna; pre sirene napad uzbunjuje samo neprijatelje na ekranu.
- [ ] Mirni vojnici stoje i patroliraju; uzbunjeni se okreću ka avionu i pucaju uvis na visok, a vodoravno na nizak avion.
- [ ] Oboren lovac zadržava brzinu, nos mu sve strmije pada, a propeler usporava.
- [ ] Ravnoteža borbe: energija aviona, šteta od vojnika, lovaca i PVO.
