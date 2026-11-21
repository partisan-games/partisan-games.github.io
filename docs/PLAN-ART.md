# Plan arta

Zadaci i statusi dopuna; postojeći resursi i pravila u [ART](ART.md), dokazi provera u [TESTING](TESTING.md#art-verification-record).

**Status poslova:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked.

| # | ID | Prioritet | Posao | Obavezan rezultat | Codex · preporuka | Status |
|---|---|---|---|---|---|---|
| 1 | ART-00 | — | Indeks i pregled postojećeg arta | Matrice stanja, putanje resursa, merljivi kadrovi, ograničenja i redosled dopuna | — | ✅ Done |
| 2 | ART-13 | P1 · dorada | [Hummel: izvorni izgled](#art-13-hummel) | Prema izvornom Hummelu obnoviti trup, posadu, `idle`/`drive` i odgovarajuću olupinu; povezati isti art u nivou i Storybook-u | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 3 | ART-14 | P1 · dorada | [BP-42: miran voz](#art-14-bp42) | Jedan aktivni `idle` kadar, bez poskakivanja; zadržana četvorokadarska vožnja i postojeće mere | Medium | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 4 | ART-01 | P1 | Tenkovi igrača: partizanski i nemački; nemački se koristi i u Do Trsta | Pripremljene petlje povezati sa zajedničkim kodom, Storybook-om i svim nivoima; sačuvati trup, odvojenu cev, sidrište i sudar | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 5 | ART-04 | P1 · ponovna upotreba pre novog arta | Opel Blitz u Do Trsta | Izabrani Kluzov atlas povezati sa kamionom u Do Trsta i njegovom Storybook pričom; proveriti sve postojeće potrošače zajedničkog arta | Medium za preuzimanje; High za novu izradu | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 6 | ART-05 | P2 | Somua S35 iz Do Trsta | Petlja gusenica na postojećem trupu, uz zadržanu odvojenu cev | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 7 | ART-06 | P2 | Bombaš i Okupator | Bombašev pad i namensko Okupatorovo pucanje povezani sa zajedničkim klasama i pričama | High → Extra High po potrebi | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 8 | ART-07 | P2 · priprema | Atlasi Ustanka | Formalni opisi ćelija, trajanja i sidrišta; po potrebi prepakivanje, bez ponovnog crtanja prihvaćenih likova | Medium | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 9 | ART-09 | P2 | Mitraljezac iz Bunkera | Vatreni klip iz postojećeg krupnog kadra, sa trzajem i povratkom u nišansku pozu | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 10 | ART-08 | P3 | Uništeni kopneni ciljevi bez odgovarajućeg crteža | Jedanaest različitih olupina povezati sa postojećim akterima; požar ostaje prateći efekat | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 11 | ART-10 | P3 | Propeleri aviona bez pokretnog propelera | Odvojeni propeleri za šest postojećih modela, obe osovine dvomotoraca; trupovi sačuvani | High za pripremu arta; Medium za povezivanje | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 12 | ART-11 | P3 · provera pre dopune | Čamci, rovovi i ostali proceduralno prikazani ishodi | Pregled izvora u veličini igre, dopunjene obe posade, mitraljezac i čamac; pokret u igri ostaje za vlasnikov pregled | High | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 13 | ART-02 | P3 · na kraju | Ranjeni partizan iz Ranjenika | Četiri faze puzanja u mestu, povezane sa stvarnim pomeranjem igrača | High → Extra High po potrebi | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 14 | ART-03 | P3 · na kraju | Nemačka i italijanska patrola iz Ranjenika | Hod obe grupe od po tri vojnika i originalna mirna poza za `halt` | High → Extra High po potrebi | ✅ Done<br>Needs game check: [vizuelni pregled](#note-1) |
| 15 | ART-12 | P4 | [Šest ambijenata sadašnjih nivoa](#art-12-priprema-i-izrada) | Sremski front 1944, Batina, proboj 1945; Grahovo, Vilusi, okolina Nikšića: izvori, metapodaci i predaja za ugradnju | High | ✅ Done<br>Needs game check: [ugrađeno u Tenkiće i Ustanak](#note-3) |
| 16 | ART-15 | P1 · dorada | [Tragovi rata na pozadinama](#art-15-tragovi-rata) | Olupine tenkova, topova, kamiona i vojnih vozila, krv i mrtvi borci na svim pozadinama u igri, najviše na mestima pokolja | High | 📋 TODO |

**Codex:** preporučeni nivo razmišljanja agenta, a ne podešavanje kvaliteta generatora slike. Medium je za metapodatke, prepakivanje i povezivanje gotovih resursa; High za novu izradu, animacije i proveru doslednosti. Extra High koristiti kada usklađivanje mnogih kadrova, poza i ograničenja ostane nerešeno na High, naročito ako se greške ponavljaju; može se primeniti na bilo koji takav zadatak. Viši nivo nije garancija bolje slike; preporuke u tabeli nisu rezultat uporednog merenja.

**Stanje:** sve dopune aktera su izrađene i povezane; svih šest pozadina ima art, metapodatke i pregled sa jedinicama. ART-12 je ugrađen u Tenkiće i Ustanak i čeka vlasnikov pregled u igri. Ranije slike ostaju rezerva.

## Zahtevi dorada

<a id="art-13-hummel"></a>

### ART-13 · Hummel veran izvorniku

- **Zahtev vlasnika:** postojeći crtež previše se razlikuje od originalnog Hummela; Codex treba ponovo da ga nacrta. Pregled potvrđuje izgubljenu posadu i drugačije proporcije nadgrađa i trupa.
- **Predlog:** upotrebiti [providni original 298×138](../assets/images/armies/hummel.png) kao osnovu za siluetu, boje, tri člana posade, cev i oznake. Mirni kadar zadržava taj izgled, a četiri faze vožnje menjaju samo gusenice/točkove pod preciznom maskom, kao kod ranije pripremljenih tenkova. Tako se dobija novi upotrebljivi atlas uz očuvan identitet izvornika.
- **Uklapanje:** zadržati postojeću ćeliju 320×160 i oslonac `(160,148)`. Original na `(11,10)` staje u tu ćeliju u prirodnoj razmeri; pri pripremi ponovo izmeriti `body` i alfa-granice. Zadržati mere vozila 298×138 pre postojeće skale igre, smer udesno, zdravlje i sudare.
- **Olupina i povezivanje:** novu oštećenu varijantu izvesti iz ispravljenog trupa, sa prepoznatljivom istom šasijom. Ažurirati izvor/recept i metapodatke Hummela u pripremi Kluza, opis njegove olupine i zajednički izvoz; isti Vehicle već koriste Kluz i njegova postojeća Storybook priča. Ostala vozila ostaju na svojim receptima.
- **Završeno kada:** uporedni pregled originala, `idle`, četiri faze `drive` i olupine u veličini igre pokazuje isti model; telo, cev i posada ne skaču, a gusenice imaju stvarne različite faze. Proveriti providnost, sidrište, mere, mirovanje/vožnju/uništenje i postojeću Storybook fabriku ciljanim unit proverama. Obnoviti izvore, preglede i indeks; odloženu proveru pokreta u igri evidentirati zasebno.

<a id="art-14-bp42"></a>

### ART-14 · BP-42 miruje bez poskakivanja

- **Zahtev vlasnika:** voz koji stoji ne treba da cupka ili poskakuje; `idle` mora biti statičan. Postojeća vožnja ostaje.
- **Predlog:** izabrati jedan postojeći dobar kadar voza za `idle`, sa `frameCount: 1`; `drive` zadržava četiri aktivna kadra. Sačuvati atlas sa četiri kolone, ćeliju 576×256, oslonac `(288,232)` i fizičke mere. Za ovu izmenu nije potrebna nova generacija slike.
- **Izvor izmene:** [recept Kluza](../assets/images/armies/sources/franjo-kluz/manifest.json) još izričito traži vibraciju voza, a [priprema](../assets/images/armies/sources/franjo-kluz/prepare.py) svakom klipu nameće četiri kadra i ne izvozi `frameCount` u runtime opis. Izmeniti taj zahtev, pripremu i izvoz broja aktivnih kadrova, da obnavljanje resursa ponovo ne uvede kvar.
- **Povezivanje:** [GroundTarget](../core/actor/GroundTarget.js) sada prosleđuje isti broj kadrova za sve redove. Predlog je da prosledi broj po klipu, sa postojećim brojem kolona kao podrazumevanom vrednošću; [Sprite](../core/actor/Sprite.js) već podržava niz dužina, pa nije potreban novi renderer. Tako se dobija pravi jednokadarski `idle`, uz nepromenjen `drive` i postojeće ostale aktere.
- **Završeno kada:** pri dužem mirovanju aktivni izvorni pravougaonik, položaj i razmera ostaju isti; `drive` napreduje kroz četiri kadra, a prelazak u `idle`, pauza, uništenje i ponovno stvaranje daju ispravan kadar. Proveriti Vehicle i GroundTarget, izvozne opise, Kluzovu postojeću priču i odsustvo promene ostalih klipova ciljanim unit proverama; obnoviti preglede/metapodatke i indeks. Pregled u igri ostaje odložen prema postojećoj odluci vlasnika.

<a id="art-15-tragovi-rata"></a>

### ART-15 · Tragovi rata na pozadinama

- **Zahtev vlasnika:** pozadine su previše mirne i idilične, kao crtani film; ovo je ratna igra, pa moraju imati krv i mrtve. Nedostaju uništeni tenkovi i topovi, kamioni i druga vojna vozila i mrtvi borci koji leže unaokolo, posebno u bitkama koje su bile klanica (Sutjeska, Kozara, Neretva).
- **Obim:** sve pozadine koje igre koriste: Tenkići (Sremski front 1944 i 1945, animirana Batina, grad, Bihać, Drvar, Užice), Ustanak (Grahovo, Vilusi, okolina Nikšića) i ostale iz [pregleda](../pozadine.html) kad dobiju nivo. Bez ranjenih koji se pomeraju (odluka vlasnika); mrtvi i olupine su nepomični i ostaju u mirnoj osnovi, a dim i vatra nad olupinama idu kao žarišta živih efekata.
- **Pravila:** olupine i uniforme odgovaraju vojskama i periodu mesta prema [ISTORIJA](ISTORIJA.md); ništa posleratno. Mirni pojas tla iza jedinica ostaje čitljiv, a linija tla i veličina slike se ne menjaju, da ugradnja ostane ista. Kod animirane Batine menja se samo osnova sloja, bez pomeranja animiranih likova.
- **Završeno kada:** svaka pozadina u igri ima vidljive olupine i mrtve, uz sačuvan izvor, prompt i hash; metapodaci (linija tla, žarišta) su ažurirani; vlasnik je pregledao pozadine u [pregledu](../pozadine.html) i u igri.

## Zahtevi ostalih dopuna

### ART-01

Izraditi zasebne petlje vožnje za postojeći partizanski i nemački trup, sa najmanje četiri različite faze gusenica. U pregledu nema klizanja stopljenih gusenica, skakanja trupa ili pomeranja oslonca cevi. Istu nemačku petlju povezati u Tenkićima i Do Trsta, a partizansku kroz zajednički TenkLevo. Završiti obaveznu integraciju i Storybook pregled oba tenka. Olupine vodi ART-08.

### ART-02

Izraditi petlju puzanja ranjenog partizana odozgo; ruke, noge i telo učestvuju u puzanju, a pomeranje po ekranu daje igra. Petlja se spaja bez skoka, zadržava identitet i sidrište; postojeća statična slika može ostati mirovanje.

### ART-03

Izraditi petlju patrolnog hoda za nemačku i italijansku grupu, uz miran kadar za `halt`. U svakom prihvaćenom GIF-u su **tri vojnika**, ne dva: sva trojica ostaju ista i na istim relativnim mestima; koraci su vidljivi, bez pomeranja cele grupe unutar ćelije. Ne dodavati pucanje ili smrt koje Patrol nema.

### ART-04

Isporučiti odgovarajući art vožnje Opela za Do Trsta: postojeći Kluzov atlas uz dokumentovan izbor ćelija i sidrišta, ili novi list ako pogled/stil ne odgovaraju. Zadatak ostaje otvoren dok vožnja nije povezana sa stvarnim kamionom i njegovom Storybook pričom, uz proveru svih potrošača zajedničkog resursa. Sam izbor atlasa ili upotrebljiva petlja u izdvojenom pregledu nisu završetak.

### ART-05

Izraditi petlju gusenica Somue S35 na prihvaćenom trupu. Cev ostaje odvojena, oslonac i silueta miruju, a faze se jasno razlikuju u veličini igre. Olupinu vodi ART-08.

### ART-06

Izraditi Bombašev neponovljivi pad do zadržane pale poze, u stilu postojećeg lista. Za Okupatora izraditi namensko pucanje iz postojeće frontalne nišanske poze: trzaj, hitac i povratak, uz mirne noge. Sačuvati njegov hod i `umire`; postojeći plamen može ostati zaseban. Obe dopune su potrebne za zatvaranje stavke.

### ART-07

Opisati ćelije, aktivne redove, sidrišta i trajanja svih pet navedenih listova Ustanka. Ako treba celobrojna mreža, mehanički prepakovati prihvaćene crteže bez promene izgleda i bez odsecanja; proveriti sve krajnje ćelije. Zadatak je priprema postojećeg arta, ne novi dizajn.

### ART-08

Izraditi prepoznatljivu uništenu varijantu za svaki od sledećih izgleda: partizanski tenk, nemački tenk, Somua S35, Hummel, Opel Blitz, Opel legije, BP-42, Flak 38, PaK 38, kuća-bunker i zasebni bunker. Za Opel iz Do Trsta koristiti odgovarajuću istu olupinu ako deli izgled. Dovoljan je smislen završni crtež; prelaz i požar mogu ostati proceduralni. Silueta oštećenja mora biti čitljiva i bez plamena. Beležiti završetak po imenovanom izgledu; jedan crtež ne zatvara celu stavku.

### ART-09

Vatreni klip mitraljesca iz Bunkera iz postojećeg krupnog kadra: nišanjenje, trzaj i povratak, uz položaj vrha cevi u metapodacima. Kadar ostaje poravnat pri rotaciji celog lika; ne širiti kadar na celo telo niti uvoditi hod.

### ART-10

Pripremiti telo bez statične elise i odvojene slojeve propelera za Ju 87, Bf 109 iz Do Trsta, kao i Bf 109, Fw 190, Bf 110 i He 111 iz Visa. Navesti osovinu svakog propelera i predviđen način pokreta; za dvomotorce obe. Propeleri Poteza, igrača iz Visa i Bf 109 iz Kluza već su ugrađeni i ne izrađuju se ponovo.

### ART-11

U stvarnoj veličini proveriti: oba čamca (plovidba/paljba/uništenje), obe vrste rovovskih vojnika (podizanje/paljba/pad), mitraljesca iz Bunkera (ishod pogotka), Flak i PaK (čitljivost rada oruđa/posade), obalsko mitraljesko gnezdo (paljba/pala posada) i avione (propeler/paljba/pogibija). Za svaku potvrđenu rupu upisati imenovan resurs koji treba izraditi i uslov završetka; zatim ga izraditi u okviru odgovarajućeg prioriteta. Ako je radnja već čitljivo pokrivena, zabeležiti kojim resursom/postupkom. Sam spisak „P3, pogledati” nije rezultat; ovo nije odobrenje za pokretanje igre bez potrebne dozvole.

### ART-12

<a id="art-12-priprema-i-izrada"></a>

**Potvrđen obim:** šest ambijenata sadašnjih nivoa. Tenkići: Sremski front, jesen 1944 → Batina, novembar 1944 → proboj Sremskog fronta, april 1945. Ustanak: Grahovo → Vilusi → okolina Nikšića, 1941. Ranije slike i izvori ostaju rezerva. Ilustracije pejzaža nisu dokumentarna rekonstrukcija pojedinačnih borbi niti potvrda artiljerijskih dvoboja.

**Proba:** [svedeno Grahovo i poređenje](../assets/images/sources/pozadine/grahovo-sparse-preview.html); prethodna slika je sačuvana.

**Nova odluka vlasnika:** isprobati jednu svedeniju kompoziciju: manje elemenata i detalja, više praznog prostora, uz istu rezoluciju. Zastave ne smeju biti naslikane u statičnoj pozadini; ako se koriste, moraju se izdvojiti i animirati. Ranije verzije sa ljudima i zastavama ostaju arhiva; izabrane su čiste osnove sa mirnom vodom prema odluci vlasnika.

**Izrada:** čitljiv pixel art cele grupe, bliži drugoj stilskoj probi, bez krupnih kocki ili realizma. Različiti pejzaži, sezone i tragovi rata; mirnije, svetlije površine iza jedinica. Samo ratne zgrade i oprema, bez modernih mostova, memorijala i solitera. Osnova ne sadrži ljude, zastave ili druge zamrznute žive elemente. Ako se dodaju, moraju imati zasebnu animaciju i pratiti vreme scene; u suprotnom ih ukloniti. Dim i plamen ne crtati u osnovnu sliku, već opisati kao žarišta živih efekata.

**Isporuka (Codex):** šest PNG-ova u assets/images/background, stvarni promptovi i hashovi izvora/referenci, izmerene dimenzije i linije tla, žarišta {x,y,intensity,kind}, pregledi sa jedinicama 1280×720 i 1024×768. Linija tla je granica mirnog pojasa na oko 80% visine slike, ne horizont ili stopalo aktera. Obnoviti indeks. [Aktivni manifest](../assets/images/sources/pozadine/current-levels.json).

**Ugradnja (Claude, postojeća podela rada):** zajedničko mapiranje i smena nivoa; poravnati sliku, fizičko tlo, jedinice i granate, povezati žarišta, vetar, pauzu i nastavak efekata. Tenkići prate [IG-02](PLAN-ZA-IGRE.md#ig-02). Ustanak ostaje do dve pobede, najviše tri runde; stalni niz ambijenata nastavlja se u sledećem meču. Ova art isporuka ne menja kod igre. Storybook prikazuje aktere, pa pozadine ne dobijaju posebne priče.

**Završeno kada:** art i metapodaci svih šest ambijenata spremni su za upotrebu, ugrađeni su u oba nivoa i vlasnik ih je pregledao u igri. Pripremljeni PNG/HTML nije dokaz ugradnje; status ostaje otvoren do njenog završetka. [Istorijski okvir](ISTORIJA.md), [trajna pravila i izvori](ART.md#pozadine-i-stilske-probe).

**Izbor konačnih varijanti:** vlasnik sam bira koje pozadine i varijante ostaju.

**Rezultat izrade:** svih šest osnova je očišćeno od ljudi/zastava/oblaka; pregledano je 12 kompozicija sa jedinicama. [Galerija](../assets/images/sources/pozadine/current-preview.html), [metapodaci za preuzimanje](../assets/images/sources/pozadine/current-backgrounds.json), [izvori i promptovi](../assets/images/sources/pozadine/current-levels.json), [priprema](../assets/images/sources/pozadine/prepare-current-levels.py). Ugradnja i živi efekti nisu izvršeni ovim art prolazom.

**Sezonska dorada po novom nalogu:** izrađene su nove rezervne verzije Sutjeske (kasno proleće, reka u kanjonu), Neretve (kraj zime/rano proleće), Drvara (kraj maja) i Kozare (početak leta). [Resursi i ugovor](ART.md#sezonske-varijante-rezervnih-bojišta), [kalendarski izvori](ISTORIJA.md#godišnja-doba-ratnih-ambijenata). Izbor godišnjeg doba postaje pravilo za sledeću izradu. Sadašnji redosled šest nivoa se ne menja; stare slike se čuvaju, a konkretno vreme/vodostaj nisu proglašeni dokumentovanom rekonstrukcijom.

**Konačan izbor vlasnika:** [animirana Batina](../assets/images/sources/pozadine/batina-layered/preview.html) zamenjuje statičnu varijantu u Tenkićima. Zastava, ljudi i oblaci su zasebni živi slojevi, a tekstura vode ostaje mirna. Obrisane starije verzije ne vraćati; njihovi hashovi ostaju samo zapis porekla. Vlasnikov izbor izgleda ne znači da je agent izvršio browser proveru igre.

## Notes

Needs game check označava pregled u igri odvojen od završenosti koda.

1. <a id="note-1"></a>**Odložen browser pregled:** vlasnik je odobrio samo unit provere. Browser, mrežno učitavanje i stvarni pokret nisu provereni; PNG/GIF i unit dokazi nisu vizuelno prihvatanje.

2. <a id="note-2"></a>**Ranije pozadine:** ostaju sačuvane kao rezerva; aktivan obim je potvrđenih šest ambijenata sadašnjih nivoa.

3. <a id="note-3"></a>**ART-12, ugradnja:** Codex je završio art šest ambijenata i pregledao kompozicije 1280×720 i 1024×768. Ljudi i zastave su uklonjeni iz izabranih osnova; raniji primerci ostaju arhiva. Neuspešan efekat vode je uklonjen iz igre i pregleda; voda zasad ostaje mirna po odluci vlasnika. Claude je povezao svih šest osnova: Tenkići menjaju Sremski front 1944, Batinu i proboj 1945 po partiji, a Ustanak Grahovo, Vilusi i okolinu Nikšića po rundi; tlo slike pada na fizičko tlo, a žarišta imaju živu vatru i dim. Ostaje vlasnikov pregled u igri. Browser nije pokretan.
