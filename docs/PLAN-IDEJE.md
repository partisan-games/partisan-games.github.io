# Plan ideja

Preostali poslovi iz [konteksta igara](KONTEKST.md).

**Status:** 📋 TODO · 🔄 In progress.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-13](#ig-13) | Svi | Dopuniti pogodak Okupatora i oštećenja Bf 109 i Ju 87 | Codex, Claude | 🔄 In progress<br>Waiting: tri resursa [1](#note-1) |
| 2 | [IG-14](#ig-14) | Svi | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [2](#note-2) |
| 3 | [IG-16](#ig-16) | 2D Storybook | Precrtati slabe prikaze prema popisu ispod; pregled je završen, izrada nije počela | Codex | 📋 TODO |

Pravila rada: [DOCS](DOCS.md), [art i integracija](ART.md#obavezna-integracija) i [arhitektura aktera](ARHITEKTURA.md#gradivni-blokovi). Bez komita bez naloga. Pre zatvaranja agent odigrava nivo; vlasnikova partija nije uslov (odluka vlasnika, 2026-11-22).

<a id="ig-13"></a>
## IG-13 · Preostala stanja „pogođen”

Napraviti tri preostala resursa, povezati ih sa zajedničkim prikazima igara i Storybook-a i proveriti vidljivu reakciju na pogodak; oštećenje aviona prikazuje se ispod polovine zdravlja. Ugovor i već završene dopune: [ART](ART.md#dopune-iz-plana-ideja--predaja-arta); dokazi: [TESTING](TESTING.md#predaja-arta-iz-plana-ideja).

<a id="ig-14"></a>
## IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i Storybook priču, povezati aktera sa igrom i odigrati nivo.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Do Trsta i Tenkići:** [italijanski tenkovi](../assets/images/armies/talijani/tenkovi/), [AB41](../assets/images/armies/talijani/vozila/), [BMW R11](../assets/images/armies/nemci/motori/) i ostala [nemačka vozila](../assets/images/armies/nemci/vozila/). Tenkići zahtevaju novu odluku o proširenju dvoboja.
- **Ustanak:** [italijanski top 47 mm sa posadom i minobacači](../assets/images/armies/talijani/artiljerija/); zahteva novu odluku o proširenju dvoboja.
- **Pešadija:** italijanski, britanski, ruski, četnički i SS vojnici; potrebni su atlasi pokreta.
- **Otpisani:** nemački motociklista sa mitraljezom u postojećem realističnom crno-belom stilu.

<a id="ig-16"></a>
## IG-16 · Popis za precrtavanje

**Pregled 2026-11-22:** pročitani su projektna pravila, konteksti, ugovor arta, arhitektura aktera i Storybook-a; pregledano je 97 slika i listova, uključujući reference i varijante. Proverene su putanje iz priča do zajedničkih prikaza i nivoa. U browseru su otvoreni motociklista, Flak, obalsko gnezdo, S-30, Hummel, BP-42, Bf 109, Somua, Bombaš i ranjenik u mirovanju. Ovo je ocena crteža; nisu proverene sve animacije niti odigrani nivoi.

Tabela je procena agenta prema sadašnjim slikama i vlasnikovoj primedbi na motociklistu, ne vlasnikovo odbijanje svakog navedenog aktera. Merilo su čitljive siluete, uverljive proporcije i usklađeno senčenje u veličini igre, kao kod dorađenog Poteza, glavnih tenkova i novije pešadije. Sam piksel stil nije nedostatak. Precrtavanje nije pokrenuto: vlasnik je prvo zatražio pregled.

| # | Akter / deo | Gde se koristi | Šta treba zameniti i zašto |
|---|---|---|---|
| 1 | [Motociklista](../storybook.html#vozila/motociklista) | Do Trsta, Kluz | Ceo [atlas](../assets/images/armies/game-ready/vozila/motorcycle-sprites.png): grub prikaz ljudi, točkova i prikolice; nova priprema zadržala je izgled slabog izvornog arta. Ćelija 83×61, silueta mirovanja široka 71 px. |
| 2 | [Sd.Kfz. 251](../storybook.html#vozila/sdkfz-251) | Do Trsta, Kluz | Ceo [atlas](../assets/images/armies/game-ready/vozila/sdkfz251-sprites.png): zrnasti obrubi, nerazgovetne gusenice i lice mitraljesca; ćelija 128×65. |
| 3 | [Sd.Kfz. 222](../storybook.html#vozila/sdkfz-222) | Do Trsta, Kluz | [Trup i kupola](../assets/images/armies/game-ready/vozila/sdkfz222-sprites.png): grub mali raster, slabo odvojene ploče i točkovi; ćelija 108×52. Kupolu zadržati kao zaseban deo. |
| 4 | [Hummel](../storybook.html#vozila/hummel) | Kluz | [Trup i posada](../assets/images/armies/game-ready/tenkovi/hummel-sprites.png): ostali su izvorni pikseli, šumasta kamuflaža i skicirana lica. Dopune gusenica i trzaja nisu precrtavanje vozila. |
| 5 | [Bf 109, bočno](../storybook.html#avioni/bf109) | Kluz, Do Trsta | [Trup](../assets/images/armies/game-ready/avioni/bf109-telo.png): stari šematski crtež, tanke crne linije preko ravnih sivih površina. Uskladiti sa Potezom i novim bočnim avionima. |
| 6 | [Ju 87, bočno](../storybook.html#avioni/ju87-obrusavac) | Kluz, Do Trsta, Neretva | [Trup](../assets/images/armies/game-ready/avioni/ju87.svg): pojednostavljena geometrijska zamena; propeler i putanja leta ne nadoknađuju detalje aviona. |
| 7 | [Flak 38](../storybook.html#artiljerija/flak38) | Kluz | [Postolje](../assets/images/armies/game-ready/artiljerija/flak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/flak38-cev.png): stari tanki crni obrubi, slabo senčenje i zelena traka tla u slici. Nova posada nije razlog da se ponovo crta. |
| 8 | [PaK 38](../storybook.html#artiljerija/pak38) | Do Trsta | [Postolje](../assets/images/armies/game-ready/artiljerija/pak38-postolje.png) i [cev](../assets/images/armies/game-ready/artiljerija/pak38-cev.png): skiciran točak i lafet, zelena traka tla i neusklađena obrada delova. Sačuvati odvojenu posadu. |
| 9 | [Schnellboot S-30](../storybook.html#brodovi/schnellboot) | Čamac | [Trup](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg) i palubna oruđa: gladak šematski prikaz odstupa od teksturisanih čamaca; nedostatak je naročito vidljiv na sadašnjoj dužini oko 819 px. |
| 10 | [Mitraljesko gnezdo odozgo](../storybook.html#artiljerija/mitraljesko-gnezdo) | Čamac | [Vreće i zaklon](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg), oružje crtano pravougaonicima i stara posada preuzeta iz patrole; sadašnji delovi pripadaju različitim stilovima. |
| 11 | [Kuća-bunker](../storybook.html#artiljerija/kuca-bunker) | Bunker, Do Trsta; dekoracija Ustanka i Drvara | [Čitava kuća](../assets/images/buildings/kuca-bunker.png): šumaste teksture i ravne površine ne uklapaju se uz noviju nacrtanu ruševinu i ambijente. Jedan resurs dele borbeni i dekorativni potrošači. |
| 12 | [Bunker](../storybook.html#artiljerija/bunker-do-trsta) | Do Trsta | [Čitav bunker](../assets/images/buildings/bunker-02.png): gruba ponovljena tekstura i urezane linije puškarnice; uskladiti sa kvalitetom nacrtane ruševine. |
| 13 | [Bombaš](../storybook.html#vojnici/bombas) | Bunker | [Osnovni lik](../assets/images/armies/game-ready/vojnici/bombas-sprites.png): stari raster stajanja i hoda je sačuvan, dok su kasnije dodati bacanje i pad. Za usklađen kvalitet potreban je isti novi lik kroz sve radnje, ne još jedno prepakivanje. |
| 14 | Mitraljezac u kući | Bunker, Do Trsta | [Figura i mitraljez](../assets/images/armies/game-ready/vojnici/mitraljezac-sprites.png): sačuvan je krupan kadar 63×27 sa blokovskom glavom i rukama; novi trzaj i pad nisu nova osnovna figura. Ne pretpostaviti da izvor sadrži celo telo. |
| 15 | [Ranjeni partizan](../storybook.html#vojnici/ranjeni-partizan) | Ranjenik | [Osnovni lik](../assets/images/armies/game-ready/vojnici/wounded-sprites.png) i povezane radnje: izvornih 69×27 px, ravne obojene plohe i slabo razdvojene ruke/oprema. Sačuvati pogled odozgo. |
| 16 | [Nemačka patrola](../storybook.html#vojnici/nemacka-patrola) | Ranjenik; delovi figure i u obalskom gnezdu | [Sva tri čoveka](../assets/images/armies/game-ready/vojnici/german-patrol-sprites.png): prvobitna mala tela i glave zadržani su pri dodavanju koraka. Potrebno precrtavanje grupe u istom pogledu. |
| 17 | [Italijanska patrola](../storybook.html#vojnici/italijanska-patrola) | Ranjenik | [Sva tri čoveka](../assets/images/armies/game-ready/vojnici/italian-patrol-sprites.png): isti problem sa sačuvanim starim osnovnim crtežom; uskladiti mirovanje, hod, pogodak i pad. |
| 18 | Somua S35 · samo cev | Do Trsta | [Cev](../assets/images/armies/game-ready/tenkovi/somua-s35-barrel.png) je teksturisana izvorna slika, stilski različita od [čitljivog nacrtanog trupa](../assets/images/armies/game-ready/tenkovi/somua-s35-sprites.png). Nema osnova za ponovno crtanje celog tenka. |

**Još za poređenje, bez zaključka da obavezno treba precrtati:** BP-42, M15/42, StuG III i Hočkis imaju novije pripremljene crteže, ali ravnije ili zrnastije senčenje od glavnih tenkova. Postojanje novog atlasa nije dokaz kvaliteta; u ovom pregledu nema dovoljno razloga da se njihovo kompletno precrtavanje proglasi obaveznim.

**Nije pronađen razlog za potpuno precrtavanje:** novi nemački strelac i jurišnik, partizanski strelac, zastavnici i posade Ustanka, četiri nove partizanske uloge, Nemac i Četnik spreda, glavni tenkovi, Somuin trup, oba Opela, Potez sa obe oznake, bočni He 111 i Storch, postojeći avioni odozgo i šest teksturisanih neprijateljskih plovila. Okupator ostaje u posebnom realističnom stilu Otpisanih; nedostajući pogodak vodi IG-13. To nije novo vlasnikovo odobrenje ni potvrda svih pokreta.

Za svaki izabrani novi crtež uskladiti i njegovo oštećenje, pad/olupinu i odvojene delove, uz očuvanje sudarnih mera, orijentacije, oslonca i tačke pucnja. Već upotrebljive odvojene posade i efekte zadržati. Pozadine, UI, neupotrebljena zbirka izvora i 3D modeli nisu deo ovog popisa 2D aktera.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-13:** imagegen je odbio tri preostala resursa; [ograničenja i zapis odbijanja](ART.md#dopune-iz-plana-ideja--predaja-arta). Ostali pripremljeni paketi su povezani; [provere](TESTING.md#predaja-arta-iz-plana-ideja) prolaze bez browsera.
2. <a id="note-2"></a>**IG-14:** pet prethodno izabranih aktera je povezano; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
