# Franjo Kluz: od jedne mete do misija nad Kozarom

Igra postaje let sa misijom: poletanje sa aerodroma, bombardovanje i mitraljiranje istorijskih ciljeva, povratak i sletanje, u više nivoa.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Korak | Rezultat | Status |
|---|---|---|---|---|
| 1 | [FK-01](#fk-01) | Protivnici na Kozari 1942 | Kratko u ISTORIJA: ko su protivnici i koji crtež im odgovara | ✅ Done |
| 2 | [FK-02](#fk-02) | Kamera i svet | Avion leti kroz svet sa stalnim mestima; kamera ga prati | 📋 TODO |
| 3 | [FK-03](#fk-03) | Sletanje na aerodrom | Pobeda samo na pisti; drugde je prinudno sletanje ili pad | 📋 TODO |
| 4 | [FK-04](#fk-04) | Bombe | Bomba pada po putanji; rakete i automatsko nišanjenje nestaju | 📋 TODO |
| 5 | [FK-05](#fk-05) | Prednji mitraljez | Rafal za meke ciljeve | 📋 TODO |
| 6 | [FK-06](#fk-06) | Gorivo, municija i dopuna | Sletanje na aerodrom puni bombe, municiju i gorivo | 📋 TODO |
| 7 | [FK-07](#fk-07) | Ciljevi na zemlji i PVO | Kolona i protivavionska vatra iz FK-01 umesto Hummela | 📋 TODO |
| 8 | [FK-08](#fk-08) | Zadnji strelac i lovac | Osmatrač gađa lovca koji goni avion | — |
| 9 | [FK-09](#fk-09) | Nivoi i prvi nivo: prelazak | Izbor nivoa; let Banjaluka → Urije 23. maja 1942 | 📋 TODO |
| 10 | [FK-10](#fk-10) | Drugi nivo: prvi borbeni let | Napad kod Kozare 4. juna 1942 | 📋 TODO |
| 11 | [FK-11](#fk-11) | Treći nivo: odbrana baze | Napad nemačke avijacije na bazu, jul 1942 | — |
| 12 | [FK-12](#fk-12) | Provere i pregled | Testovi, smoke, dokumentacija, vlasnikova partija | 📋 TODO |

## Obim

- **U obimu:** samo Franjo Kluz (`scenes/franjo-kluz/`), njeni testovi, art i zvuci, i istorijske beleške u [ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz).
- **Zajednički kod:** [PlayerPlane](../core/actor/derived/PlayerPlane.js) koristi samo ova igra (i dva unit testa), pa se avion seli u scenu kao `Potez`; kad core verzija ostane bez korisnika, briše se (FK-02, smoke u FK-12). [SideVehicle](../core/actor/SideVehicle.js) i [Recurring](../core/objects/Recurring.js) koriste i druge igre: ne menjaju se, scena pravi svoje klase.
- **Van obima:** naslov kartice na naslovnoj, 3D igre, novi zajednički sistem nivoa za druge igre, mobilne kontrole osim onih koje [Controls](../ui/Controls.js) već daje.

## Kako se čita

- **Izvršilac:** Claude, redom, jedan korak po nalogu; posle koraka čeka „dalje”.
- **Gotovo:** kad prođu provere iz „Gotovo kada”. Vlasnikovo izričito odobrenje je uslov za FK-01 (izbor protivnika), za svaki nov art, zvuk i UI element (HUD, izbor nivoa) i za FK-12. Placeholder nije art ([pravilo](DOCS.md#pravilo-za-umetnost)); nov snimak ulazi tek kad ga vlasnik izabere.
- **Procena:** 1 p je jedan idealan radni dan; min / verovatno / max.
- **Uslovno:** FK-08 i FK-11 su opcioni; rade se kasnije, samo ako ih vlasnik zatraži.
- **Provere:** testovi i izvršne provere pokreću se uz vlasnikovu dozvolu ([statusi](DOCS.md#statusi-u-planovima-postupne-izrade-igara)); browser samo za snimke, jedan Chrome; smoke samo uz posebno odobrenje.
- **UI:** za HUD i ekran izbora nivoa prvo se pokazuje konkretan predlog; do odobrenja se radi samo logika ([pravilo](DOCS.md#odobravanje-ui-elemenata)).

## Osnova

Provereno na `a2ad3198`.

- Svet se pomera, ne kamera: desna strelica gura sve ostale objekte (`ubrzavaOstale`, [Main:88-91](../scenes/franjo-kluz/Main.js#L88-L91)), gore ih spušta (`dizePredmete`, [Main:93-99](../scenes/franjo-kluz/Main.js#L93-L99)), a zvuk to prati ručno preko `audioWorldOffset` ([Main:40](../scenes/franjo-kluz/Main.js#L40), [Main:147](../scenes/franjo-kluz/Main.js#L147)). Avion stoji u ekranu ([PlayerPlane:37-39](../core/actor/derived/PlayerPlane.js#L37-L39)). Zato bomba ne može naslediti stvarnu brzinu aviona i aerodrom nema stalno mesto.
- Aerodrom je `Recurring` koji se nasumično vraća sa desne strane ([Main:42](../scenes/franjo-kluz/Main.js#L42), [Recurring:21-27](../core/objects/Recurring.js#L21-L27)); sletanje važi bilo gde ([Main:112-117](../scenes/franjo-kluz/Main.js#L112-L117)).
- Oružje: raketa na Enter i raketa sa automatskim nišanjenjem na V, 1,5 s ([PlayerPlane:23-28](../core/actor/derived/PlayerPlane.js#L23-L28), [PlayerPlane:76-80](../core/actor/derived/PlayerPlane.js#L76-L80)). Jedini protivnik, Hummel, patrolira x 150–600 i gađa raketom na 10 s ([SideVehicle:19](../core/actor/SideVehicle.js#L19), [SideVehicle:29-40](../core/actor/SideVehicle.js#L29-L40)).
- Kamera sa ličnim rendererom već postoji u Čamcu ([camac/Main:77-85](../scenes/camac/Main.js#L77-L85)); [Scene2D](../core/Scene2D.js) iz `cameraX/cameraY` daje zvuku vidljivi prozor.
- Istorija: rakete i Hummel ne pripadaju 1942; Potez 25 je imao mitraljeze i bombe ([ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz)).
- Postojeći art koji je kandidat, a ne potvrda: `armies/ndh/kamioni/opel-blitz-*.png`, `armies/ndh/tenkovi/`, `armies/nemci/pvo/`, `armies/nemci/avioni/` (Bf 109, Ju 87, Storch), `items/bomba.png`; zvuk `aircraft-gun.mp3`.

## Pretpostavke

- Potez 25 nosi jedan prednji mitraljez, dvojni mitraljez osmatrača pozadi i bombe pod krilima (opšti podatak o tipu, ne proverava se detaljno).
- Kluzov let 23. maja bio je bez borbe; prvi nivo je izbegavanje vatre i sletanje, ne napad (izbor igre).
- 30 fps kao u svim 2D igrama osim Visa ([constants](../core/constants.js)).

## Koraci

<a id="fk-01"></a>
### FK-01 · Protivnici na Kozari 1942 · 0.25 / 0.25 / 0.5 p · Claude

- **Šta:** osnovno, bez detaljnog istraživanja: u [ISTORIJA](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz) dopisati u nekoliko redova ko su protivnici oko Kozare 1942 (Nemci, snage NDH) i koja vozila, PVO i avioni iz `assets/images/armies/` im okvirno odgovaraju; jedan opšti izvor je dovoljan.
- **Gotovo kada:** kratka lista je u ISTORIJA; vlasnik je izabrao protivnike za FK-07, a FK-08 i FK-11 ostavio kao opcione za kasnije.

<a id="fk-02"></a>
### FK-02 · Kamera i svet · 1 / 1.5 / 2.5 p · Claude

- **Šta:** nova klasa `scenes/franjo-kluz/Potez.js` (iz PlayerPlane) ima svetske koordinate i brzinu: gas menja brzinu (200–600 kao sada, [Main:24-25](../scenes/franjo-kluz/Main.js#L24-L25)), gore/dole visinu do 5555. Scena drži `cameraX/cameraY` koji prate avion; pozadina se crta po slojevima sa faktorom paralakse (oblaci, šuma, žbunje kao sada, [Main:18-21](../scenes/franjo-kluz/Main.js#L18-L21)), a nebo po visini kamere. Aerodrom Urije je objekat na stalnoj svetskoj tački, ne `Recurring`. Brišu se `ubrzavaOstale`, `dizePredmete`, `zaustaviParalax`, `audioWorldOffset`. Core `PlayerPlane` i njegovi testovi ([game2d.test:112](../tests/unit/game2d.test.js#L112), [migration2d.test:9](../tests/unit/migration2d.test.js#L9)) prelaze na `Potez`; core fajl se briše. U ovom koraku oružje i Hummel ostaju kakvi su.
- **Reference:** kamera i renderer u [camac/Main:60-85](../scenes/camac/Main.js#L60-L85); vidljivost zvuka iz [Scene2D:11-20](../core/Scene2D.js#L11-L20).
- **Gotovo kada:** unit testovi: pozicija aviona raste sa brzinom × dt nezavisno od dužine frejma; kamera drži avion u kadru; aerodrom ostaje na istoj svetskoj tački posle 60 s leta; nivelisanje iz postojećeg testa prolazi za `Potez`. Snimak: let napred i nazad pored aerodroma. Ceo unit skup i lint prolaze.
- **Zamke:** brisanje core fajla je izmena u `core/`, pa traži smoke (FK-12). `isGrounded` meri tlo u ekranu (`groundLevel = canvas2d.height`, [Main:12](../scenes/franjo-kluz/Main.js#L12)); prelazi u svetsko tlo. Smrt aviona sada spušta svet ([Main:104-106](../scenes/franjo-kluz/Main.js#L104-L106)); sa kamerom pada avion.

<a id="fk-03"></a>
### FK-03 · Sletanje na aerodrom · 0.5 / 0.75 / 1 p · Claude

- **Šta:** pista Urija ima svetske granice. Sletanje uspeva na pisti ispod granice brzine i nagiba, sa zvukom točkova na pisti (nagib kao sada, [PlayerPlane:93-96](../core/actor/derived/PlayerPlane.js#L93-L96)); van piste ili prebrzo avion se razbije. Pobeda posle ispunjenog zadatka nivoa i sletanja; ocena sletanja (meko, tvrdo) ide u tekst pobede.
- **Gotovo kada:** unit testovi za: sletanje na pisti, pad van piste, pad pri prevelikoj brzini, pobedu samo posle zadatka. [victory.spec:40-44](../tests/smoke/victory.spec.js#L40-L44) postavlja avion na pistu.
- **Zamke:** igrač sada startuje sa tla; poletanje mora ostati moguće i van „sletanja” (avion na pisti pri startu nije pobeda).

<a id="fk-04"></a>
### FK-04 · Bombe · 0.75 / 1 / 1.5 p · Claude

- **Šta:** V pušta bombu koja nasleđuje brzinu aviona i pada gravitacijom; na tlu eksplodira sa poluprečnikom štete. Broj bombi po letu bira se po igrivosti. Rakete i `shootAimed` (sadašnje V) se brišu iz igre i [kontrola](../scenes/franjo-kluz/Main.js#L33). Zvuk puštanja, pada i eksplozije bira vlasnik; `explosion.mp3` iz rakete je kandidat.
- **Reference:** balističko đule u [ustanak/Djule.js](../scenes/ustanak/Djule.js) (pad i eksplozija na tlu).
- **Gotovo kada:** unit testovi: putanja bombe zavisi od brzine aviona u trenutku puštanja; eksplozija oštećuje cilj u poluprečniku, a promašaj ne; ne može se pustiti više bombi nego što ih ima. Vlasnik je odobrio izgled bombe i eksplozije.
- **Zamke:** bez FK-02 avion nema stvarnu brzinu, zato je ovaj korak posle njega. `items/bomba.png` treba proveriti da li liči na avionsku bombu; ako ne, art se planira, ne crta se oblik.

<a id="fk-05"></a>
### FK-05 · Prednji mitraljez · 0.5 / 0.75 / 1 p · Claude

- **Šta:** Space (već taster za pucanje) ispaljuje rafal u pravcu nosa aviona; pogađa pešadiju, kamione i lovca, a ne oklop. Zvuk `aircraft-gun.mp3` ako ga vlasnik odobri za ovu igru.
- **Gotovo kada:** unit testovi: brzina paljbe ne zavisi od frejmova, meci prate ugao aviona, oklop ne prima štetu od metka.
- **Zamke:** ESLint zabranjuje browser tajmere; hlađenje preko `Cooldown` i sata sesije kao kod sadašnjeg oružja ([PlayerPlane:24-27](../core/actor/derived/PlayerPlane.js#L24-L27)).

<a id="fk-06"></a>
### FK-06 · Gorivo, municija i dopuna · 0.75 / 1 / 1.5 p · Claude

- **Šta:** gorivo opada sa vremenom i gasom; bez goriva motor staje i avion klizi. Sletanje na aerodrom posle par sekundi mirovanja puni bombe, municiju i gorivo. HUD (gorivo, bombe, municija) po [stilu igre](../ui/styles.js).
- **Gotovo kada:** unit testovi: potrošnja zavisi od dt i gasa; dopuna samo na pisti i u mirovanju; prazan rezervoar gasi motor. Vlasnik je odobrio HUD.
- **Zamke:** dopuna ne sme da pokrene pobedu iz FK-03 pre ispunjenog zadatka.

<a id="fk-07"></a>
### FK-07 · Ciljevi na zemlji i PVO · 1 / 1.5 / 2 p · Claude

- **Šta:** Hummel se briše; umesto njega ciljevi koje je vlasnik izabrao: nemačka pešadija, kolona kamiona (`ndh/kamioni/opel-blitz-*.png`) i oklopni voz (`nemci/vozovi/oklopni-vozovi/`), na stalnim svetskim mestima; glavna opasnost je laka PVO. PVO puca rafalom ili granatom koja se rasprsne kod aviona, sa svojim zvukom i dimom rasprskavanja; oštećenje aviona traje do pada ili dopune, a oštećen avion se dimi. Kandidati za crtež PVO su u `armies/nemci/pvo/` (npr. `flak-m39.png`, `2cm-flak-madsten.png`).
- **Reference:** cilj i patrola iz [to-trieste/CombatTarget.js](../scenes/to-trieste/CombatTarget.js).
- **Gotovo kada:** unit testovi: PVO gađa samo avion u dometu i vidnom polju, pogodak smanjuje zdravlje aviona, uništen cilj ostaje uništen. Snimak napada na kolonu.
- **Zamke:** neprijateljska vatra ne sme početi pre starta ni posle kraja (`session.state`, kao [SideVehicle:48](../core/actor/SideVehicle.js#L48)).

<a id="fk-08"></a>
### FK-08 · Zadnji strelac i lovac · 1 / 1.5 / 2 p · conditional · Claude

- **Okidač:** vlasnik kasnije zatraži lovca (opciono).
- **Šta:** lovac iz FK-01 dolazi otpozadi; osmatrač automatski ili na taster gađa unazad u ograničenom uglu.
- **Gotovo kada:** unit testovi za ugao i domet strelca; vlasnik je odobrio crtež lovca.

<a id="fk-09"></a>
### FK-09 · Nivoi i prvi nivo: prelazak · 1 / 1.5 / 2 p · Claude

- **Šta:** opis nivoa kao podaci (zadatak, start, aerodrom, ciljevi, tekst uvoda); izbor nivoa na startnom ekranu igre kroz `customStartScreen`, bez glavnog menija ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Prvi nivo: poletanje iz Banjaluke, let do Prijedora, sletanje na Urije.
- **Reference:** startni ekran sa izborom u [ustanak/Main:23-34](../scenes/ustanak/Main.js#L23-L34); redosled dugmadi u [DOCS](DOCS.md).
- **Gotovo kada:** unit test: svaki nivo se učita i ima ostvariv zadatak; nivo 1 se završava sletanjem na Urije. Vlasnik je odobrio ekran izbora i odigrao nivo 1.

<a id="fk-10"></a>
### FK-10 · Drugi nivo: prvi borbeni let · 0.5 / 1 / 1.5 p · Claude

- **Šta:** poletanje sa aerodroma iz FK-01 (Prijedor ili Međuvođe), napad na ciljeve iz FK-07, povratak i sletanje; dopuna iz FK-06 je potrebna za ceo zadatak.
- **Gotovo kada:** unit test: nivo se ne može završiti bez sletanja i uništenih ciljeva; vlasnik je odigrao nivo.

<a id="fk-11"></a>
### FK-11 · Treći nivo: odbrana baze · 0.75 / 1 / 1.5 p · conditional · Claude

- **Okidač:** vlasnik kasnije zatraži odbranu baze (opciono; Potez uništen na zemlji 6. jula); zavisi od FK-08.
- **Šta:** poleteti pre udara i preživeti ili odvratiti napadače; tačan zadatak bira vlasnik posle FK-01.
- **Gotovo kada:** unit test zadatka; vlasnik je odigrao nivo.

<a id="fk-12"></a>
### FK-12 · Provere i pregled · 0.5 / 0.75 / 1 p · Claude

- **Šta:** ceo unit skup, lint i `npm run check`; smoke uz vlasnikovo odobrenje, jedan Chrome, zbog brisanja core `PlayerPlane`. Ugovor sveta i kamere ove igre u [opis igre](IGRE.md); izvršene provere u [TESTING](TESTING.md); nove slike na naslovnoj za Franju Kluza.
- **Gotovo kada:** provere prolaze ili su pošteno navedene; vlasnik je odigrao sve nivoe i rekao da li igra ostaje ovakva. Posle toga se plan briše, a pouke ostaju u dokumentaciji.

## Raspored

Jedan izvršilac. Ukupno **6.75 / 10 / 14.5 p** bez uslovnih koraka; uslovni FK-08 i FK-11 dodaju **1.75 / 2.5 / 3.5 p**. FK-01 je kratak i ide prvi jer od njega zavise ciljevi; FK-02 se radi dok vlasnik bira protivnike. [Raspored](plan-kluz.json).

**Kontrolne tačke**
1. **Posle FK-02:** let kroz svet sa stalnim aerodromom, stara igra i dalje radi.
2. **Posle FK-06:** ciklus poletanje–napad–povratak–dopuna radi na Hummelu.
3. **Posle FK-10:** dva nivoa igriva od početka do kraja.

## Rizici

| Rizik | Posledica | Ublažavanje |
|---|---|---|
| Nema crteža za izabrana vozila | Nivo čeka art | Bira se cilj sa postojećim crtežom; nedostajući art ide u poseban plan |
| Prelazak na kameru menja osećaj leta | Igra deluje drugačije od sadašnje | Brzine i ubrzanja prenose se iz sadašnjih konstanti; vlasnik proba posle FK-02 |
| Brisanje core `PlayerPlane` | Neka igra koja ga uvozi pukne | Pretraga uvoza pre brisanja, smoke u FK-12 |
