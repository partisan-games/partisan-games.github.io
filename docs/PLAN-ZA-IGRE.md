# Plan za igre

Dogovoreno u [kontekstu igara](KONTEKST.md), a još neurađeno. Igra koja preraste u višednevni posao dobija svoj plan.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-01](#ig-01) | Neretva | Dva ekrana: prvo Nemci, pa četnici, svaki sa svojom pozadinom | Claude, Codex | 🔄 In progress<br>Kod gotov: Nemci prvih 60 s, pa četnici uz poruku; test u [migration2d](../tests/unit/migration2d.test.js). Čeka pozadine (Codex) i vlasnikovu partiju |
| 2 | [IG-02](#ig-02) | Tenkići | Više nivoa u različitim bitkama; redom početak Sremskog fronta, Batina, proboj Sremskog fronta | Claude, Codex | 🔄 In progress<br>Smena bojišta po partiji ugrađena ([BattleBackground](../scenes/tenkici/BattleBackground.js)): Sremski front 1944, Batina, proboj 1945, pa grad, Bihać, Drvar, Užice. Čeka neprijateljske tenkove (Codex) i vlasnikovu partiju |
| 3 | [IG-03](#ig-03) | Vis | Tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis | Claude | 🔄 In progress<br>Kod gotov: tri etape talasa, sirena i poruka posle prve dve; testovi u [vis.test.js](../tests/unit/vis.test.js). Čeka vlasnikovu partiju |
| 4 | [IG-04](#ig-04) | Do Trsta | Četiri etape: Lika, Senj, Rijeka, Trst | Claude, Codex | 🔄 In progress<br>Istorija etapa upisana; čeka pozadine etapa (Codex). Etape nemaju svoje tekstove (odluka vlasnika: tekst samo kad je potreban) |
| 5 | [IG-05](#ig-05) | Čamac | Tri etape: isplovljavanje sa Visa, desant na Šoltu, povratak pod napadom S-čamaca | Claude, Codex | 📋 TODO |

Pravila rada: [DOCS](DOCS.md) i [CLAUDE.md](../.claude/CLAUDE.md). Nov art radi Codex po [PLAN-ART](PLAN-ART.md), uz pravila iz [ART](ART.md); placeholder nije art. Novi UI elementi i tekstovi traže vlasnikovo odobrenje. Agent ne pravi commit bez naloga.

<a id="ig-01"></a>
## IG-01 · Neretva: dva ekrana

- **Dogovor ([kontekst](KONTEKST.md#neretva)):** prvi ekran protiv Nemaca, drugi protiv četnika; pozadine vezane za izabrani položaj. Sada je jedan ekran na kome su Nemci i četnici izmešani u rovu ([Main](../scenes/neretva/Main.js)), na podlozi od suve trave.
- **Šta:** prvi ekran samo nemački vojnici, drugi samo četnici; posle prvog ekrana prelaz na drugi, a pobeda tek posle drugog. Bez ograničenja municije, kao sada.
- **Art (Codex):** po jedna pozadina za svaki ekran, u pogledu iz kog se igra (pravo u rovove; postojeća bočna pozadina Neretve iz ART-12 tom pogledu ne odgovara) i po pejzažu Neretve (kanjon, reka, srušeni most kod Jablanice), po pravilima iz [ART-12](PLAN-ART.md#art-12-priprema-i-izrada); likovi u rovovima već postoje.
- **Tekst prelaza (odobrio vlasnik):** „Chetniks are next”.
- **Gotovo kada:** unit test da prvi ekran ima samo Nemce, drugi samo četnike i da je pobeda tek posle drugog; vlasnik je odigrao oba ekrana.

<a id="ig-02"></a>
## IG-02 · Tenkići: više nivoa

- **Dogovor ([kontekst](KONTEKST.md#tenkići)):** svaki nivo je druga bitka sa svojim tenkovima i bojištem; Sremski front je ravnica sa rovovima.
- **Šta:** izbor bojišta po partiji kroz pozadine iz [ART-12](PLAN-ART.md#art-12-priprema-i-izrada) (Sremski front, Batina i ostale; Sremski front se javlja dva puta, sa razlikom u stanju bojišta); grad ostaje jedno od bojišta.
- **Redosled (odluka vlasnika):** bojišta idu hronološki: početak Sremskog fronta (kraj oktobra 1944), Batina (novembar 1944), proboj Sremskog fronta (april 1945), pa ostala, a posle poslednjeg ispočetka. Beograd (oktobar 1944) je opcion i išao bi prvi, samo ako se ista pozadina ne koristi već u drugoj igri, da se ne ponavlja.
- **Tenkovi (odluka vlasnika):** igračev partizanski tenk je isti na svim nivoima; nivo menja bojište i neprijateljski tenk. Neprijateljski tenk svake bitke traži istorijsku proveru u [ISTORIJA](ISTORIJA.md) i nov art (Codex), sa ugradnjom kroz zajednički [Tenk](../scenes/tenkici/Tenk.js) i storybook priču; dok novog arta nema, nivo koristi postojeći nemački tenk.
- **Gotovo kada:** unit test izbora bojišta; vlasnik je odigrao partiju na novom bojištu.

<a id="ig-03"></a>
## IG-03 · Vis: tri etape

- **Dogovor ([kontekst](KONTEKST.md#vis)):** tri etape; posle prve dve sletanje na aerodrom, posle treće na Vis. Sada postoji jedna etapa sa talasima iz [levels.js](../scenes/vis/levels.js) i sletanjem na Vis na kraju.
- **Šta:** još dve etape talasa ispred postojeće, svaka završena sletanjem na aerodrom, kao Kluzove misije redom; sledeća etapa ne troši novi žeton, a nova igra počinje prvom.
- **Posle sletanja (odobrio vlasnik):** oglasi se sirena (`air-raid-siren.mp3`, kao kod Kluza) i poruka „Sirens! The enemy is attacking the base!”, pa sledeća etapa počinje poletanjem pod napadom.
- **Ugrađeno:** etape su u [levels.js](../scenes/vis/levels.js); prva lakša, druga sa teškim lovcima, treća postojeća sa bosom. Rezultat, životi i bombe prelaze u sledeću etapu. Aerodrom na putu za sada koristi postojeću sliku baze sa Visa; poseban crtež aerodroma je kandidat za art.
- **Gotovo kada:** unit test redosleda etapa i pobede tek na Visu; vlasnik je odigrao sve tri.

<a id="ig-04"></a>
## IG-04 · Do Trsta: etape

- **Dogovor ([kontekst](KONTEKST.md#to-trieste)):** nekoliko povezanih etapa, sa dolaskom tenka do Trsta na kraju.
- **Etape (odluka vlasnika):** četiri, geografskim redom trase 4. armije i 1. tenkovske brigade u Tršćanskoj operaciji 1945: Lika (Gospić, početak aprila), Senj i primorje, Rijeka (obavezna, želja vlasnika), Trst (ulazak 1. maja). Rijeka je konačno oslobođena 3. maja, posle Trsta; igra ide redom trase, ne datuma.
- **Zatim:** u [ISTORIJA](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst) upisati izvore za svaku etapu i protivnike na njoj; pozadine po pejzažu etape (Codex, pravila iz [ART-12](PLAN-ART.md#art-12-priprema-i-izrada)); razraditi korake ugradnje etapa redom, kao IG-03.

<a id="ig-05"></a>
## IG-05 · Čamac: dalje etape

- **Dogovor ([kontekst](KONTEKST.md#čamac)):** desant na Šoltu; prva etapa se završava iskrcavanjem. Plovilo, radnja i ciljevi daljih etapa su za razradu.
- **Etape (odluka vlasnika):** tri, redom: noćno isplovljavanje iz luke na Visu; postojeći desant na Šoltu sa iskrcavanjem; povratak na Vis pod napadom S-čamaca, kojima je [izvor](ISTORIJA.md#šolta-911-maj-1944--sastav-za-igru-čamca) potvrdio prisustvo na povratnom pravcu. Sledeća etapa ne troši novi žeton, a nova igra počinje prvom.
- **Opcione kasnije etape:** drugi desanti sa Visa 1944, Brač (jun, partizani sa britanskim komandosima; prvi kandidat), Mljet (maj) i Korčula; pre razrade proveriti izvore u [ISTORIJA](ISTORIJA.md).
- **Ime igre (odluka vlasnika kasnije):** „Landing on Šolta” više ne pokriva sve etape; novo ime poželjno pominje desant ili partizansku mornaricu.
- **Zatim:** pozadine i obala po pejzažu Visa i kanala (Codex, pravila iz [ART-12](PLAN-ART.md#art-12-priprema-i-izrada)); razraditi korake ugradnje etapa redom, kao IG-03.
