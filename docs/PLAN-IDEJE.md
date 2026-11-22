# Plan ideja

Dogovoreni poslovi iz [konteksta igara](KONTEKST.md).

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Igra | Posao | Ko | Status |
|---|---|---|---|---|---|
| 1 | [IG-12](#ig-12) | Battle for Jablanica | Partizanski top u kanjonu Neretve ruši utvrđenje dok posada ne istakne belu zastavu | Claude, Codex, Vlasnik | 🔄 In progress<br>Needs game check: predaja i rušenje [1](#note-1) |
| 2 | [IG-13](#ig-13) | Svi | Stanje „pogođen” za aktere koji ga nemaju | Codex, Claude | 🔄 In progress<br>Waiting: tri preostala resursa [2](#note-2) |
| 3 | [IG-14](#ig-14) | Svi | Proširenje registra ostalim kandidatima od postojećeg arta | Claude, Codex, Vlasnik | 📋 TODO<br>Waiting: vlasnikov izbor kandidata [3](#note-3) |

Pravila rada: [DOCS](DOCS.md) i [CLAUDE.md](../.claude/CLAUDE.md). Nov art radi Codex po pravilima iz [ART](ART.md); placeholder nije art. Novi UI elementi i tekstovi traže vlasnikovo odobrenje. Agent ne pravi commit bez naloga. Urađenu stavku agent proverava tako što sam odigra nivo (probe, upravljač ili testovi koji igraju scenu) i tada je zatvara i uklanja iz plana; vlasnikova partija i osećaj igre nisu uslov (odluka vlasnika, 2026-11-22).

<a id="ig-12"></a>
## IG-12 · Battle for Jablanica: partizanski top ruši utvrđenje na Neretvi

- **Zahtev vlasnika (2026-11-22):** partizani upravljaju topom iz Drugog svetskog rata i ruše italijanski ili nemački bunker, odnosno staro utvrđenje koje okupator koristi kao bunker. Istorijski okvir nivoa je bitka za Jablanicu u februaru 1943. [Istorijska beleška i vizuelna referenca](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).
- **Sada u [igri](../scenes/cannon/Main.js):** [poljski top od 75 mm](../assets/models/weapon/cannon/field-gun-75.glb) sa iste obale Neretve gađa [utvrđenu kasarnu](../scenes/cannon/Fort.js) sa puškarnicama, sagrađenu od sitnih blokova i krovnih ploča, pa se pod pogocima urušava deo po deo, po uzoru na Angry Birds (zahtev vlasnika). [Lokalna fizika](../scenes/cannon/FortPhysics.js) drži delove nepomičnim kroz prva tri pogotka u isti odeljak, a ponovljeni udari otvaraju lokalni proboj; delovi iznad padaju tek kada izgube dovoljno oslonaca. Top ima neograničeno granata, a kamera je uz oslonac cevi i prati nišanjenje. [Provere stabilnosti i razaranja](TESTING.md#battle-for-jablanica-stabilnost-bunkera) rade sa stvarnim Ammo bez browsera. Granata izaziva eksploziju koja razbacuje blokove i rekvizite, ostavlja garež i u poluprečniku može ubiti stvarne branioce iza probijenog zaklona. Preživeli zauzimaju oslobođene puškarnice. Kada manje od polovine prvobitnih branilaca ostane živo, podižu belu zastavu i nude predaju: prihvatanje donosi pobedu, a odbijanje nastavlja borbu do poslednjeg branioca.
- **Mitraljezi (zahtev vlasnika, 2026-11-22):** iz svake od četiri puškarnice [mitraljezac](../scenes/cannon/Gunner.js) povremeno ispaljuje rafal svetlećih metaka ([Tracers](../scenes/cannon/Tracers.js)). Pored nišandžije i punioca nalazi se strelac koji puškom gađa aktivne puškarnice. Njegov pogodak nakratko odlaže rafal pogođenog mitraljeza. Neprijateljski pogodak ranjava jednog od živih članova posade. Crvena traka prikazuje ukupno zdravlje posade i opada pri svakom pogotku. Gubitak cele [posade](../scenes/cannon/Crew.js) završava partiju porazom.
- **Tekstovi (engleski):** uvod je promenjen na „Neretva valley, February 1943. Shell the Italian fort until its garrison surrenders.” prema vlasnikovoj ispravci meseca. Pri predaji se sada bira „Accept surrender” ili „Continue attack”, po zahtevu vlasnika; prihvatanje donosi pobedu, nastavak traži potpuno rušenje utvrđenja. Borba miruje dok igrač bira. Vlasnik je odobrio i ostale tekstove (2026-11-22).
- **Art (ugrađen):** [3D kanjon Neretve](ART.md#battle-for-jablanica-kanjon-neretve), kamenite obale, reka, zimsko šiblje, bodljikava žica i nova rasveta. Proporcije su pregledane bez browsera; vlasnikov pregled u igri ostaje otvoren.
- **Top (ugrađen):** maslinasti 3D model prema vlasnikovim referencama `75mm-02.png`, `fk249-75mm.png` i `75mm.png`, sa velikim točkovima sa žbicama i dugim lafetom. Cev i kolevka podižu se zajedno. Tačka `Muzzle` nalazi se u sredini otvora cevi.
- **Italijanski branioci:** zajednički model vojnika ima deset istorijski usmerenih varijanti uniforme, opreme, lica i M33 šlema, uz posebne oznake pešadijskih pukova „Murge” i mitraljeskog bataljona. Isti modeli dostupni su u Storybook-u i predviđeni za naredne etape.
- **Ideja: kolona kamiona (vlasnik, 2026-11-22):** italijanska kolona kamiona pokušava da se probije putem duž reke, a igrač je zaustavlja topom. Istorijski uzor su ostaci posade Prozora, koji su u zoru pokušali proboj motorizovanom kolonom sa tenkovima, i kolona koja je išla u pomoć Prozoru ([istorija](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica)). U projektu već postoje modeli kamiona ([vehicle/truck](../assets/models/vehicle/truck/)), ali među njima nema italijanskog.
- **Ideja: više nivoa (vlasnik, 2026-11-22):** nivoi prate propast divizije „Murge” u februaru 1943, na primer Prozor, Rama i Jablanica, a moguća je i zaseda kod Drežnice. Zajednički 3D modeli partizana i italijanskih vojnika već postoje. [Istorija po mestima](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).
- **Gotovo kada:** art je povezan, vlasnik je odobrio tekstove, a agent je ponovo odigrao nivo do bele zastave i nastavio razaranje.

<a id="ig-13"></a>
## IG-13 · Stanje „pogođen” za aktere

- **Zahtev vlasnika (2026-11-22):** Storybook nedavno ima dugme „Pogođen”, a mnogi akteri nemaju izgled pogođenog: posle pogotka izgledaju isto kao pre njega, sve do smrti ili olupine.
- **Izmereno u Storybook-u (2026-11-22):** pre ove dopune, posle šest pogodaka na 40% zdravlja izgled se nije menjao kod sledećih aktera. Od pešadije to su strelac, jurišnik, partizanski strelac, zastavnik, posada topa, bombaš, nemačka i italijanska patrola, ranjeni partizan i okupator. Od vozila su to Hummel, Opel Blitz (obe verzije) i BP-42, a od aviona Bf 109 i Ju 87. Od brodova su to partizanski čamac, S-čamac i nemačko patrolno plovilo, a od artiljerije Flak 38, top iz Ustanka, kuća-bunker, Pak 38, bunker iz Do Trsta i mitraljesko gnezdo. Neki od njih počnu da gore tek ispod praga zdravlja, ali ni tada nemaju izgled pogođenog dok su još čitavi. Tenkovi, Somua, Potez i avioni iz Visa već vidljivo reaguju. Tada ni novi akteri iz [IG-14](#ig-14) (He 111, Storch, motociklista, Sd.Kfz. 251 i 222) nisu imali izgled pogođenog; sada koriste povezane atlase iz [ART](ART.md#dopune-iz-plana-ideja--predaja-arta).
- **Šta:** pešadija dobija kratak klip trzaja pri pogotku, a vozila, avioni, brodovi i artiljerija izgled oštećenja, sa rupama i dimom, kad padnu ispod polovine zdravlja. Art crta Codex po [pravilima arta](ART.md), u razmeri postojećih atlasa, a zajednički prikazi koriste isto stanje u igrama i Storybook-u. Stanje se upisuje i u kolonu „Pogodak / kraj” u [ART](ART.md#obim-i-čitanje). Oštećen S-čamac je povezan; [ugovor i provere](ART.md#dopune-iz-plana-ideja--predaja-arta).
- **Gotovo kada:** svaki akter iz spiska u Storybook-u vidljivo menja izgled posle pogotka, a agent je to proverio istim merenjem.

<a id="ig-14"></a>
## IG-14 · Novi akteri od postojećeg arta

- **Zahtev vlasnika (2026-11-22):** napraviti nove aktere na osnovu postojećeg arta i proširiti registar likova i vozila koje igre koriste.
- **Polazište:** [indeks arta](../assets/images/armies/index.csv) beleži slike vojski po pogledu (bočno ili odozgo), a mnoge od njih nemaju telo, prikaz ni priču u [Storybook-u](STORYBOOK.md). Primeri su nemački avioni i tenkovi odozgo, britanski, ruski, bugarski, mađarski i četnički vojnici, kao i vozila.
- **Šta:** Claude pravi popis slika bez aktera i predlaže kandidate po igri. Za izabrane pravi telo sa standardnim stanjima, prikaz i priču, po [arhitekturi aktera](ARHITEKTURA.md), i raspoređuje ih u igre kojima pripadaju. Codex dopunjuje stanja koja nedostaju, po [ART](ART.md). Vlasnik bira koje kandidate uvodimo i u koje igre.
- **Popis (2026-11-22):** od 2.213 slika u [indeksu](../assets/images/armies/index.csv), 2.120 nijedna igra ne koristi. To su većinom pojedinačne poze, pa akteru koji hoda, puca i pada Codex mora dopuniti atlas. Avionima i vozilima često je dovoljna jedna slika. Kandidati po igri:
  - **Vis (odozgo), urađeno 2026-11-22:** neprijateljski lovci sada se biraju između šest nemačkih slika: Bf 109, Fw 190 i četiri lovca iz [avion-odozgo](../assets/images/armies/nemci/avioni/). Svi su u priči „Nemački lovac”. Italijanski Re.2005 nije uveden, jer je Italija kapitulirala 1943, a Vis se igra 1944 (vlasnik). Dvojica bez nacrtane elise dobila su okretni propeler. Partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) ostaju kandidati.
  - **Do Trsta, urađeno 2026-11-22:** nova vrsta neprijatelja je [naoružano vozilo](../core/gameplay/bodies/vehicles/GunCarrier.js), u tri verzije: motociklista sa mitraljezom na prikolici, jači i sporiji oklopni transporter Sd.Kfz. 251 i oklopni automobil Sd.Kfz. 222 sa topom 20 mm. Sva tri voze ka tenku i pucaju rafale. Motociklisti i transporteri su i u kolonama druge misije Kluza, a imaju i priče u Storybook-u. Sada koriste završne piksel atlase kroz [GunCarrierSprite](../core/actor/vehicles/GunCarrierSprite.js).
  - **Do Trsta i Tenkići (bočno):** italijanski tenkovi ([talijani/tenkovi](../assets/images/armies/talijani/tenkovi/), 18), oklopni automobil AB41 ([talijani/vozila](../assets/images/armies/talijani/vozila/)), nemački motociklisti BMW R11 ([nemci/motori](../assets/images/armies/nemci/motori/), 66) i nemačka vozila ([nemci/vozila](../assets/images/armies/nemci/vozila/), 81).
  - **Franjo Kluz (bočno), urađeno 2026-11-22:** nova su tela [He 111](../core/gameplay/bodies/aircraft/LevelBomber.js), bombarder koji u trećoj misiji iz horizontalnog leta baca niz od četiri bombe na aerodrom, i [Fieseler Storch](../core/gameplay/bodies/aircraft/Scout.js), spori nenaoružani izviđač u prvoj misiji. Oba imaju priču u Storybook-u. Sada koriste završne piksel atlase kroz [PictureAircraftSprite](../core/actor/aircraft/PictureAircraftSprite.js).

  - **Ustanak (bočno):** italijanski protivtenkovski top 47 mm sa posadom i minobacači ([talijani/artiljerija](../assets/images/armies/talijani/artiljerija/), 32).
  - **Pešadija za više igara (bočno i koso):** italijanski, britanski, ruski i četnički vojnici i SS jedinice; svaki traži Codexov atlas pokreta.
- **Obogaćeni nivoi (vlasnikov nalog „svaki nivo obogati novim akterima, gde ima smisla”, 2026-11-22):**
  - **Neretva:** dok Nemci drže rovove, povremeno se Ju 87 obrušava na branioce ispred rovova ([AirAttack](../scenes/neretva/AirAttack.js)); igrač ga obara klikom.
  - **Do Trsta:** u vazdušnim napadima se smenjuju lovac, Ju 87 i He 111.
  - **Franjo Kluz:** naoružana vozila su u kolonama sve tri misije.
  - **fps-airport, fps-base i 3d-tank:** među protivnicima je i nemački strelac sa puškom ([GermanSoldier](../core3d/actor/derived/ww2/GermanSoldier.js)).
  - **Drvar:** dodati su nemački padobranci na zemlji, više padobrana u vazduhu i Ju 52 sa padobrancima.
  - **Bez novih aktera:** u Bunker po vlasnikovoj odluci; u Ustanak i Tenkiće, jer su to fino podešeni dvoboji; u Ranjenika, jer nema smislenog postojećeg arta odozgo; u Otpisane, jer bi pikselni crteži odudarali od realističnog crno-belog stila. Za Otpisane Codex može da nacrta nemačkog motociklistu sa mitraljezom u tom stilu.
- **Art izabranih aktera je povezan:** pet novih aktera koristi [zajedničke atlase i slojeve](ART.md#dopune-iz-plana-ideja--predaja-arta). Puna vožnja Do Trsta i ciljane misije Kluza proverene su bez browsera; nove kandidate vlasnik tek bira.

- **Gotovo kada:** izabrani akteri imaju priču u Storybook-u, pojavljuju se u svojim igrama, a agent ih je odigrao.

## Notes

Waiting: čeka navedeni zavisni posao; Needs game check: potrebno je odigrati nivo.

1. <a id="note-1"></a>**IG-12, provera igre:** preostaje odigrati nivo do predaje i nastavka razaranja prema uslovu završetka; povezivanje 2D arta ne proverava Cannon.
2. <a id="note-2"></a>**IG-13, preostali art:** svi pripremljeni paketi povezani su kroz zajedničke prikaze; [provere](TESTING.md#predaja-arta-iz-plana-ideja) prolaze bez browsera. Imagegen je odbio Okupatorov pogodak i oštećenja Bf 109 i Ju 87; samo ta tri resursa ostaju otvorena. [Povezivanje i ograničenja](ART.md#dopune-iz-plana-ideja--predaja-arta).
3. <a id="note-3"></a>**IG-14, izbor:** pet izabranih novih aktera koristi završni art u igrama i Storybook-u, a provere Kluza i puna vožnja Do Trsta prolaze. Preostali kandidati ispod nisu nalog za dalje generisanje ili uvođenje; čeka se vlasnikov izbor.
