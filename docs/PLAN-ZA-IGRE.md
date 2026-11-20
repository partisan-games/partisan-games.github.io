# Plan za igre

Dogovoreno u [kontekstu igara](KONTEKST.md), a još neurađeno. Igra koja preraste u višednevni posao dobija svoj plan.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-01](#ig-01) | Neretva | Dva ekrana: prvo Nemci, pa četnici, svaki sa svojom pozadinom | Claude, Codex | 📋 TODO |
| 2 | [IG-02](#ig-02) | Tenkići | Više nivoa u različitim bitkama; prvi je Sremski front | Vlasnik, Claude, Codex | 📋 TODO |
| 3 | [IG-03](#ig-03) | Vis | Tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis | Claude | 📋 TODO |
| 4 | [IG-04](#ig-04) | Do Trsta | Nekoliko povezanih etapa do dolaska tenka u Trst | Vlasnik, Claude | ⛔ Blocked<br>Čeka izbor etapa |
| 5 | [IG-05](#ig-05) | Čamac | Dalje etape oko Šolte | Vlasnik, Claude | ⛔ Blocked<br>Čeka izbor etapa |

Pravila rada: [DOCS](DOCS.md) i [CLAUDE.md](../.claude/CLAUDE.md). Nov art radi Codex po [ART](ART.md); placeholder nije art. Novi UI elementi i tekstovi traže vlasnikovo odobrenje. Agent ne pravi commit bez naloga.

<a id="ig-01"></a>
## IG-01 · Neretva: dva ekrana

- **Dogovor ([kontekst](KONTEKST.md#neretva)):** prvi ekran protiv Nemaca, drugi protiv četnika; pozadine vezane za izabrani položaj. Sada je jedan ekran na kome su Nemci i četnici izmešani u rovu ([Main](../scenes/neretva/Main.js)), na podlozi od suve trave.
- **Šta:** prvi ekran samo nemački vojnici, drugi samo četnici; posle prvog ekrana prelaz na drugi, a pobeda tek posle drugog. Bez ograničenja municije, kao sada.
- **Art (Codex):** po jedna pozadina za svaki ekran, u pogledu iz kog se igra i po pejzažu Neretve (kanjon, reka, srušeni most kod Jablanice), po pravilima iz [ART-12](ART.md); likovi u rovovima već postoje.
- **Odluka vlasnika pre ugradnje:** tekst prelaza između ekrana.
- **Gotovo kada:** unit test da prvi ekran ima samo Nemce, drugi samo četnike i da je pobeda tek posle drugog; vlasnik je odigrao oba ekrana.

<a id="ig-02"></a>
## IG-02 · Tenkići: više nivoa

- **Dogovor ([kontekst](KONTEKST.md#tenkići)):** svaki nivo je druga bitka sa svojim tenkovima i bojištem; prvi je Sremski front, ravnica sa rovovima umesto razrušenog grada.
- **Šta:** izbor bojišta po partiji kroz pozadine iz [ART-12](ART.md) (Sremski front, Beograd i ostale); grad ostaje jedno od bojišta.
- **Odluka vlasnika:** da li nivoi idu redom ili nasumično, i da li nivo menja i tenkove, kako kontekst predviđa, ili samo bojište. Tenkovi drugih bitaka traže istorijsku proveru i nov art.
- **Gotovo kada:** unit test izbora bojišta; vlasnik je odigrao partiju na novom bojištu.

<a id="ig-03"></a>
## IG-03 · Vis: tri etape

- **Dogovor ([kontekst](KONTEKST.md#vis)):** tri etape; posle prve dve sletanje na aerodrom, posle treće na Vis. Sada postoji jedna etapa sa talasima iz [levels.js](../scenes/vis/levels.js) i sletanjem na Vis na kraju.
- **Šta:** još dve etape talasa ispred postojeće, svaka završena sletanjem na aerodrom, kao Kluzove misije redom; sledeća etapa ne troši novi žeton, a nova igra počinje prvom.
- **Odluka vlasnika:** tekstovi posle sletanja na aerodrom.
- **Gotovo kada:** unit test redosleda etapa i pobede tek na Visu; vlasnik je odigrao sve tri.

<a id="ig-04"></a>
## IG-04 · Do Trsta: etape

- **Dogovor ([kontekst](KONTEKST.md#to-trieste)):** nekoliko povezanih etapa, sa dolaskom tenka do Trsta na kraju.
- **Prvi korak (vlasnik):** izabrati broj etapa, polaznu tačku, trasu i cilj svake etape; protivnici se zatim vezuju za provereni kontekst etape u [ISTORIJA](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst).
- **Zatim:** razraditi ovu stavku u korake, kao IG-03.

<a id="ig-05"></a>
## IG-05 · Čamac: dalje etape

- **Dogovor ([kontekst](KONTEKST.md#čamac)):** desant na Šoltu; prva etapa se završava iskrcavanjem. Plovilo, radnja i ciljevi daljih etapa su za razradu.
- **Prvi korak (vlasnik):** izabrati šta sledi posle iskrcavanja i koliko etapa.
- **Zatim:** razraditi ovu stavku u korake.
