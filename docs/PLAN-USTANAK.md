# Ustanak: redosled prerade

Po jedan top, posada i zastava sa obe strane; leva zadržava sastav i raspored.

| # | Korak | Rezultat za proveru | Status |
|---|---|---|---|
| 1 | Potvrditi preostala pravila i vizuelni pravac | Izabrani desna vojska/zastava, tri ambijenta, stil spriteova i potreban UI | ✅ Done |
| 2 | Napraviti duel dva topa sa postojećim slikama | Oba smera imaju ispravan ugao, mesto izlaska granate i sudare; jedno određeno tlo; W/S i Space, ograničena snaga preko vremena | ✅ Done |
| 3 | Uvesti jedan hitac po potezu | Samo aktivni top i njegova posada primaju komande; zamena tek posle pogotka ili promašaja, eksplozije i štete; bez prenosa držanog tastera | ✅ Done |
| 4 | Odvojiti rundu od meča | Do dve pobede, najviše tri runde; nova runda resetuje zdravlje, hice, odložene radnje i unos, ali čuva rezultat; tek kraj meča daje pobedu/Game over | ✅ Done |
| 5 | Dodati računarskog protivnika | Isti top i fizika, početno neprecizan nišan i korekcije prema promašajima; jedan hitac u svom potezu, bez paljbe u pauzi ili posle kraja | ✅ Done |
| 6 | Postaviti tri prepoznatljiva okruženja | Svaka runda drugi ambijent; kamenita brda, kameno selo i grad iz Tenkića; jednako tlo za topove i granate | ✅ Done |
| 7 | Precrtati obe strane i povezati sprite animacije | Pravi kadrovi mirovanja, punjenja, opaljenja i trzaja; granata izlazi u trenutku opaljenja, cev se nezavisno nišani, oslonci i sudari ostaju usklađeni | ✅ Done |
| 8 | **Opciono, napraviti za pregled:** blag vetar | Stalan tokom runde; utiče i na AI; može se isključiti radi poređenja, a korisnik odlučuje da li ostaje | ✅ Done |
| 9 | **Opciono, napraviti za pregled:** razoriv teren | Površinski krateri, novi sudari i oslonci jedinica; AI i potezi rade sa izmenjenim tlom; korisnik odlučuje da li ostaje | 🔄 In progress: decal zamenjuje [Worms teren](PLAN-TEREN.md) |
| 10 | Dodati zvukove igre | Punjenje i opaljenje topa, let granate, pogodak i promašaj, puška usklađena sa animacijom; ambijent vatre i vetra po rundi, najava poteza i ishod; jačina iz zajedničkog `config.volume`, bez podešavanja po igri; pauza bez zvuka | 📋 TODO |
| 11 | Završiti provere i pregled igre | Cela partija u 1P/2P, prelazi rundi, pauza i ponovno igranje; animacije rade i posle ishoda; vetar i razaranje mogu se nezavisno uključiti/isključiti za poređenje | 📋 TODO |

**Vetar za pregled:** fizika, AI i vizuelni efekti dele isti vetar, stalan tokom runde: dim bunkera i topova i seoski/gradski požari prate smer/jačinu. Po odluci vlasnika zastave zadržavaju raniji položaj i smer ka sredini ekrana, uz usklađen talas i zajednički ritam nezavisno od vetra; borci i topovi nisu pomerani. Tenkići bez prosleđenog vetra zadržavaju svoje efekte. Vlasnik je odlučio da vetar ostaje, bez UI-ja: dim je pokazatelj smera i jačine. Unit testovi vetra prolaze, kao i ceo unit skup (469); browser nije pokretan.

**Teren za pregled:** [Terrain](../scenes/ustanak/Terrain.js) je linija ispod točkova; đule koje padne na nju ostavlja plitak krater (do 18 px), a novo đule u krateru ga produbljuje. Kasnija đulad padaju u krater, a top, posada, strelac i zastavnici iznad njega se spuštaju za dubinu tla pod nogom. Nova runda vraća ravno tlo; `terrain.enabled = false` isključuje razaranje radi poređenja, bez UI-ja. Krater je slika iz Ranjenika (`krater.gif`), spljoštena jer se tlo vidi pod blagim uglom; ispod topa ga pokriva zelena traka sa slike postolja. Prolazi ceo unit skup (473); browser proveren jednim snimkom, smoke nije pokretan.

**Zvuci za korak 10:** iz projekta se koriste `explosion.mp3` (pogodak i promašaj), `rifle.mp3` (strelac) i `avion-mali.mp3` (avioni). Nedostajuće, kandidati sa CC0 licencom, još nepreslušani i bez provere licence na samoj stranici: opaljenje [Howitzer Gun Shot 01](https://freesound.org/people/qubodup/sounds/161343/) ili [Cannon fire](https://opengameart.org/content/cannon-fire); zvižduk [Cannon Shot and Whistling](https://freesound.org/people/craigsmith/sounds/486026/) ili [Incoming Artillery](https://freesound.org/people/bendodge/sounds/170991/) (licenca neproverena); punjenje kao spoj [Metal Clang](https://freesound.org/s/184343/) i [Rifle reload](https://freesound.org/people/MaximBomba/sounds/432141/); požar [Fire Crackle and Flames 002](https://freesound.org/s/363092/); vetar [Looping Gentle Wind](https://freesound.org/s/697217/); puška i [Mosin-Nagant](https://opengameart.org/content/gunshot-sounds). Ambijent sela nije nađen. Pre ulaska u projekat vlasnik preslušava kandidate iz privremenog foldera.

**Dogovoreno:** nišanjenje bez tajmera; držanje Space puni, puštanje ispaljuje. Art obe strane dobija stvarne kadrove umesto pomeranja statične slike. Top, posada, strelac i zastava levo ostaju na svojim mestima. Kretanje topova nije dogovoreno.

**Za korak 1:** potvrđeni izbor režima, najava poteza, rezultat, dugme za sledeću rundu, naizmenično otvaranje i tri ambijenta. Zdravlje pripada topu; posada i zastava su dekoracija. Vizuelni pravac je potvrđen; vlasnik je zatvorio stavku.

**Art:** zahtev je identično precrtavanje originalnih boraca. Zastavnik i posada, prva dva borca sleva, po vlasnikovom pregledu su u redu. Vraćen je prethodni zastavnik; strelac, treći desno, ponovo je nacrtan bez brkova prema originalu i snimku početne stranice; vlasnik je potvrdio da su izgled i animacije boraca završeni. Obe posade imaju po 16 kadrova, strelac osam, a oba zastavnika po četiri kadra. Povezani su punjenje, stvarno ispaljenje i reset runde, bez starog pomeranja celih slika likova. Strelac samostalno opaljuje svake tri sekunde: četiri kadra opaljenja, bljeska i oporavka; bez štete i uticaja na poteze. Oznake na zastavama su sačuvane; italijansko platno se deformiše oko nepomičnog koplja. SVG prototip je odbačen na pregledu; oba topa koriste prethodni art. Vlasnik je zatvorio art stavku sa postojećim topovima i zastavama; dodatno precrtavanje zastava i animacije topova nisu izvedeni. Zahtevne provere i browser nisu pokretani.

**Izvođenje:** korisnik je odobrio početak rada po planu. Prvo se potvrđuju otvoreni izbori iz koraka 1; postojeći art služi za funkcionalnu probu do koraka 7. Provere pripremati uz svaki korak, ne tek na kraju; pokretati ih uz dozvolu. Rad ostaje uz Ustanak, njegove resurse i testove; deljeni engine i Tenkići se ne prepravljaju usput.

**Istorijski okvir:** [ustanak u Crnoj Gori 1941](IGRE.md#ustanak). Desno je italijanska artiljerija i posada; sadašnji tenk zamenjuje se topom. Topove, uniforme i zastave proveriti za taj kontekst pre precrtavanja.

**Opciono znači izbor posle pregleda:** i vetar i razaranje terena izrađuju se za probu. Opciona je njihova primena u konačnoj igri, ne izrada za pregled.

**Provere koraka 2–3 i UI-ja:** prošla 24 ciljana unit testa, šest browser testova Ustanka i lint bez upozorenja. [Unit testovi](../tests/unit/ustanak.test.js) pokrivaju smerove, snagu, poteze, štetu, promašaj i najave u pauzi; [browser provera oba režima](../tests/smoke/ustanak.spec.js) potvrđuje izbor igre i najave svakog poteza. Pokretanje je korisnik odobrio.

**AI:** prošlo devet unit testova, browser provera početnog promašaja i lint. Novi test korekcije pada sa starim AI-jem, a prolazi sa novim.

**Runde:** prošlo 11 unit i šest browser testova Ustanka, lint bez upozorenja. Pokriveni rezultat 2 : 1, poraz od računara, smena prve strane, pauza između rundi, otkazivanje starog pogotka i animacije posle kraja meča.

**Okruženja:** ranije prošlo 12 unit i pet browser testova. Selo ima oštru osnovnu sliku bez naslikanih efekata i osam zasebno animiranih žarišta. Sačuvane su mirne svetle površine iza topova. Prošle tri browser provere požara po rundama; posle dorade dima ponovljena provera sela, uključujući pauzu i animaciju posle pobede. Pregledani snimci, lint čist. Za komit je vraćen početak od prve runde i rezultata 0 : 0.

**Zamke proverene na b9252ddb:** [ulaz scene](../core/Scene.js:150) sada poziva sve žive objekte; [posada](../scenes/ustanak/Posada.js:12) zasebno čita Space; [snaga](../scenes/ustanak/Top.js:60) raste po frejmu bez granice. To prilagoditi u koracima 2–3, uz očuvanu pauzu. Svaki promašaj mora završiti hitac, a granica tla mora odgovarati sceni.

[Shell](../core/actor/projectiles/Shell.js) odlaže štetu: skriven projektil ili dodir mete sami nisu signal za zamenu poteza. [Kraj scene](../core/Scene.js:202) gasi gameplay sesiju, zato se ne poziva na kraju svake runde. Nova runda ne sme naslediti zakašnjeli pogodak ili AI akciju. [Test pobede](../tests/smoke/victory.spec.js:65) trenutno očekuje tenk i jednu rundu, pa mora pratiti novi tok.
