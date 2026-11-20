# Standardni UI: dosledan prikaz, pouzdan ulaz i jasan početak igre

Prvo pouzdanost i naplata, zatim dosledan prikaz; dodatne funkcije imaju niži prioritet.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Prioritet | Korak | Rezultat | Status |
|---|---|---|---|---|---|
| 1 | [UI-00](#ui-00) | — | Analiza postojećeg stanja i UI.js | [Pregled svih scena](#ui-00-analysis) i [posebna analiza UI.js](#ui-js-analysis); izvršne provere ostaju neobavljene | ✅ Done |
| 2 | [UI-06](#ui-06) | P0 | Poruke, izveštaj i gašenje UI-ja | Otklonjeni UI-M1/UI-R1; stari UI ne menja novu scenu | 📋 TODO |
| 3 | [UI-07](#ui-07) | P0 | Događaji, tastatura i fokus | UI ne aktivira gameplay; postojeće kontrole dostupne i ulazi se resetuju | 📋 TODO |
| 4 | [UI-01](#ui-01) | P0/P1 | Neophodni tekstovi i odluke uz izmene | Automatske ispravke opisa; pitanja samo za dodatni taster iste već opisane radnje | 🔄 In progress |
| 5 | [UI-05](#ui-05) | P0 | Start, ponovna igra i novčić | Jedan početni prozor za naplative igre; ostale besplatne; pouzdana naplata i povraćaj | 📋 TODO |
| 6 | [UI-02](#ui-02) | P1 | Zajedničke ikonice komandi i HUD-a | Jedan izvor po značenju; municija koristi sličicu metka | 📋 TODO |
| 7 | [UI-03](#ui-03) | P1 | Prozori, opisi i raspored HUD-a | Sproveden i pregledan odobren prikaz, bez izjednačavanja sadržaja igara | 📋 TODO |
| 8 | [UI-04](#ui-04) | P1 | Provera osnovnog paketa | Proveren osnovni paket; kasnije funkcije imaju svoje provere | 📋 TODO |
| 9 | [UI-09](#ui-09) | P2 | Izbor teme u Settings | Kasnija dorada: globalni izbor teme, posle doslednog prikaza i provere osnovnog paketa | 📋 TODO |
| 10 | [UI-08](#ui-08) | P2 · uslovno | Dopune touch komandi · uslovno | Samo prethodno odobrene nedostajuće komande, bez promene tastature | 📋 TODO |

| # | ID | Prioritet | Odluka vlasnika | Predlog / potvrđeni ishod | Status |
|---|---|---|---|---|---|
| 1 | PD-1 | — | Više doslednih tema i izbor u Settings | Potvrđeno: koherentne teme i globalan, sačuvan izbor; [UI style lista ispod Volume: Predefined, Simple, RPG, White](UI.md#potvrđeni-birač-teme) | ✅ Done |
| 2 | PD-2 | P0/P1 · uz izmenu | Konačni simboli i novi/izmenjeni tekstovi | Samo stvarni sukobi/nove ikonice i novi tekstovi; dosledna postojeća upotreba ostaje. Potvrđeni su 💥 za pucanje, 👊 za nenaoružani napad, ✨ za magiju, sličica metka za municiju, [novčić koji se vrti na dostupnom i miruje na disabled dugmetu, bez poruke pri nuli](UI.md#potvrđena-oznaka-naplate) i birač teme; poruke za blokirano čuvanje podataka i neuspešan povraćaj su potvrđene; opisi komandi se ispravljaju automatski; Shift i PageUp/PageDown ostaju namerno skriveni | 🔄 In progress |
| 3 | PD-3 | P2 | Obim touch podrške i način pristupa pauzi | Koje nedostajuće radnje moraju dobiti postojeću ili novu kontrolu; za nove elemente tačan raspored i oznake pre aktiviranja UI-08 | 📋 TODO |
| 4 | PD-4 | P2 | Esc u centralnim prozorima | DOCS kaže „kao Esc”, dok kod tokom igre otvara pauzu, a u pauzi nema tog handlera; potvrditi da li se traži i povratak u meni iz prozora | 📋 TODO |

## Prioriteti i predlog manjeg obima

- **P0 — prvo:** UI-06 i UI-07 popravljaju potvrđene greške tajmera, gašenja i ulaza; zatim UI-05 sprovodi već dogovorenu naplatu, besplatne igre i pouzdan povraćaj. Te popravke ne čekaju razgovor o novim touch dugmadima ili drugačijem Esc-u. UI-01 rešava samo nove tekstove/odluke koji su stvarno potrebni neposredno sledećoj izmeni.
- **P1 — osnovni paket:** UI-02 i UI-03 sprovode odobrene simbole i koherentnost postojećih tema, sa jasnim rasporedom i tačnim opisima komandi. UI-04 proverava ceo taj paket. Bez opšte prerade svih šablona ako konkretno odstupanje može da se ukloni malom izmenom.
- **P2 — kandidati za kasnije ili preskakanje:** birač teme u Settings (UI-09), nove touch komande (PD-3/UI-08) i promena značenja Esc-a (PD-4). Birač je već odobren i ostaje planiran; predlog je da se radi posle osnovnog paketa. Nove touch mogućnosti ostaju uslovne, a Esc do nove odluke zadržava postojeće ponašanje. Ovim se ništa ne proglašava otkazanim niti se tvrdi da je nepotpuna touch podrška rešena.

**Šta ne preskačemo:** zaštitu od duple/pogrešne naplate, povraćaj posle neuspelog starta, nezavisnost besplatnih igara od džepa, izolaciju UI/gameplay ulaza i proveru menjane funkcionalnosti. Možemo preskočiti nove opcije; konkretan kvar postojećeg ponašanja nije kozmetika.

## Obim

- **Obuhvaćeno:** postojeći prozori, HUD, opisi i ikonice komandi/pokazatelja; konkretni propusti poruka i izveštaja; izolacija ulaza, fokus i reset postojećih kontrola; prihvaćeni tok početka/novčića i izbor teme u Settings posle usklađivanja stilova. Popis uključuje sve `scenes/*/Main.js`, ne samo kartice menija. Dekorativni `lookat-cursor` čuva svoju posebnu ulogu bez nametanja toka partije.
- **Zajednički kod:** UI/Report/Controls/styles/CSS, Keyboard/Input/Touch, Scene/SceneManager/ruter/Arcade i lokalni potrošači koji moraju sprovesti navedene ugovore. Svaki korak navodi neophodne zajedničke izmene i njihove potrošače; ne prepravljati zajednički API samo radi uklanjanja sličnog HTML-a.
- **Granice:** ne menjati gameplay, dodele tastera, art/zvuk niti dodavati statistike ili prirodne završetke igrama koje ih nemaju. Novi touch elementi ulaze samo kroz izričito odobren UI-08. Glavni meni se menja samo koliko zahtevaju ulaz bez naplate na kartici, cena i novi tok UI-05; bez redizajna arkade.

## Kako se čita

- **Stalni pregled:** [ui.html](../ui.html) u korenu projekta je održavana stranica za pregled UI-ja; dopunjavati je tokom rada i zadržati po završetku/uklanjanju plana. Predloge prikaza razlikovati od stanja ugrađenog u igru; stranica ne zamenjuje izvršne provere aktivnih scena.
- **Nastavak:** jedan agent, redom po prioritetima iz vodeće tabele. Posle razrešene stavke prelazi na sledeću u odobrenom obimu; staje samo na konkretnoj nedostajućoj odluci ili potrebnoj dozvoli. UI-00 ostaje Done. UI-06/UI-07 mogu odmah bez novih dizajnerskih odluka; UI-01 se koristi uz konkretnu izmenu, a ne kao globalna zabrana početka dok se ne reše sve dileme.
- **Odobrenja:** [pravilo za UI i tekstove](DOCS.md#odobravanje-ui-elemenata) ostaje na snazi. PD-1 i prikaz naplate su potvrđeni; UI-01 traži samo preostale potrebne tekstove PD-2, a UI-03 vlasnikov pregled svojih snimaka. PD-3/PD-4 čekaju svoj kasniji obim i ne blokiraju osnovni paket. Tehničko rešenje u planu nije tvrdnja da je kod izmenjen.
- **Provere:** projektni testovi, lint, check i browser samo uz vlasnikovu dozvolu; za ceo skup i smoke navesti obim/opterećenje posebno. Korak može završiti izradu i pripremu provera bez tvrdnje da su izvršene: u rezultatu navesti preostale provere za UI-04. Izričito odlaganje/preuzimanje od strane vlasnika beleži se; samo odsustvo dozvole ne zatvara obaveznu završnu proveru.
- **Procene:** min / verovatno / max; 1 p je idealan radni dan jednog agenta. Procene koraka ostaju iste; prioritet ne dokazuje da je posao kraći. Puni raspored uključuje kasniji UI-09; manji osnovni paket završava se u UI-04 bez njega. Uslovni UI-08 nije ni u jednom zbiru. Čekanje odluka, dozvola i pregleda nije uračunato; po aktiviranju uslovnog rada prvo precizirati obim i preračunati raspored.
- **Git i tuđi rad:** agent ne pravi commit i ne vraća nepovezane izmene. Plan i [raspored](plan-ui.json) ostaju namenjeni gitu prema [pravilu dokumentacije](DOCS.md#gde-pripada-znanje), bez lokalnog exclude-a.

## Sažetak

Analiza izvora je završena, a izolovani prikaz naplate usaglašen; aktivne scene još čekaju provere. Preostali puni plan je **4.75 / 9.25 / 15.5 p**. Predloženi osnovni paket bez kasnijeg birača teme iznosi **4.25 / 8.25 / 13.5 p**. Najpre popraviti gašenje i ulaz, zatim naplatu, pa doslednost prikaza i proveru. UI-09 ostaje kasnija funkcija; UI-08 ostaje uslovan. [Pokrivenost nalaza](#pokrivenost-nalaza) čuva sve otvorene obaveze.

## Pretpostavke i ograničenja

- Potvrđene su implementacije u kodu, ne stvarne dimenzije, kontrast, fizički telefoni ili prirodno dostizanje ishoda. Planirani browser slučajevi nisu rezultati.
- Već postoje zajednički šabloni i tri stila; ne treba unapred praviti novu biblioteku, novi framework ili deliti UI.js na klase. Više stilova ostaje; svaki mora biti celovit i dosledan za iste elemente u svim igrama. Igra zadaje početni stil, a korisnik dobija izbor u Settings; korisnikov izbor važi za sve igre i čuva se između poseta po [opštem pravilu podešavanja](UI.md#podešavanja-i-ulaz-u-igru).
- Franjo Kluz se paralelno menja. Pre svog koraka ponovo pročitati njegov konačan HUD/ulaze; ne koristiti stari popis kao razlog da se prepišu novije izmene.

## Kontekst i razrešene dileme

Provereno prema `d68b74500b18101da8d1171352d87589bba990a5` i aktuelnoj radnoj kopiji; izvori i ograničenja su u [analizi](#ui-00-analysis) i [analizi UI.js](#ui-js-analysis). Razlikovati potvrđenu odluku vlasnika od tehničkog pravila izvršenja:

- **Odluke vlasnika:** [naplata](DOCS.md#ulaz-u-igre-i-novčići) — bez startnog prozora besplatno, inače plaćanje na Start/izbor, ponovna partija jednim klikom uz isti izbor. Zajednički izvor obuhvata i HUD; municija je **sličica metka, ne 🔫**, prema odluci već upisanoj u UI-02. To ne odobrava novu statistiku ili proizvoljne simbole za druge radnje.
- **Potvrđeni smer stilova:** [odluka vlasnika](DOCS.md#ui-stilovi) — više koherentnih tema, zajedničko ponašanje komponenti i korisnikov izbor u Settings koji važi za sve igre. Sva podešavanja se čuvaju između poseta prema [UI vodiču](UI.md#podešavanja-i-ulaz-u-igru). Najpre uskladiti prozore, dugmad, HUD i kontrole unutar svake teme (UI-03), zatim dodati izbor (UI-09). Ne pitati ponovo da li ukloniti teme ili ko bira; birač i nazivi su potvrđeni u PD-1; preostali novi simboli i tekstovi pripadaju PD-2.
- **T-1 · Vlasništvo:** scena poseduje fazu i pravila, UI samo prikaz i callback-e; ruter vodi navigaciju i ulaz, džep transakciju. UI ne uvozi scene/3D kod niti postaje vlasnik naplate. Zadržati odvojene #ui/#modal/message, zaštitu drawnBy, audio sesiju i posebne izbore.
- **T-2 · Ikonice:** čisti podaci o simbolima/putanjama pripadaju novom `core/io/icons.js`, koji mogu koristiti i Touch i UI. Predlog `ui/icons.js` nije prihvatljiv zajednički izvor jer [lint zabranjuje core/io → ui](../eslint.config.mjs#L168). Katalog ne sadrži DOM, HTML, veličine ni gameplay klase; UI prikazuje tekst ili sliku. Dodele tastera ostaju u keys. Ista radnja/pokazatelj koristi isti simbol, a isti ulaz ne mora značiti istu radnju. Postojeće dosledne simbole i dugmad zadržati bez novog pojedinačnog odobravanja; za pucanje ostaje 💥, nenaoružani napad dobija 👊, uključujući Capoeiru umesto sadašnjeg 💥, a osnovni simbol magijskog napada je ✨ umesto nasleđenih oznaka za mač ili pucanje. Predlog se traži za stvaran sukob ili nov simbol, ne za katalogizovanje onoga što već radi dosledno.
- **T-3 · Tajmeri i gašenje:** UI-M1 rešava jedan otkaziv aktivni tajmer po poruci, ne poređenje teksta. UI-R1 rešava sinhrono vezivanje Report-a za već napravljen startni kontejner, bez odloženog globalnog traženja po id-u. Ne menjati politiku poruka: tri sekunde zidnog vremena, postojeća se skriva iza modala, nova tokom modala se odbacuje; Ustanak čuva svoj gameplay sat.
- **T-4 · Ulaz:** UI događaj ne sme pokrenuti gameplay; otpuštanje/reset moraju očistiti ranije pritiske i kada se fokus promenio. Postojeće funkcionalne dodele tastera i razlika klik/držanje/otpuštanje ostaju. Controls/kamera dobijaju native click aktivaciju, a touch držanje odgovarajuću keydown/keyup aktivaciju kada je baš to dugme fokusirano, bez dvostrukog okidanja.
- **T-5 · Činjenice nisu novi zahtev:** Esc tokom igre otvara pauzu, a izvor nema zajednički Escape handler u centralnim prozorima. U osnovnom paketu to ponašanje ostaje; eventualna promena navigacije čeka PD-4 i zasebno planiranje tog dodatka. Cache posle clear, višestruko otvaranje starta iste instance i opšti SSR nisu današnji potvrđeni kvarovi i ne dobijaju zaseban refaktor.
- **T-6 · Start nije trajna klasifikacija:** requiresCoin i izbor sačuvati kao podatke za pokušaj partije posle init-a, a pre clearIntro. Posle starta intro je prazan, pa ponovno čitanje hasStartScreen može pogrešno proglasiti naplativu igru besplatnom. Replay prenosi stabilan identifikator izbora, ne tekst/HTML uklonjenog dugmeta; reload koristi redovan ulaz, ne uvodi se novo trajno pamćenje izbora.
- **T-7 · Povraćaj ostaje:** Avatar/Warplane/Vis učitavaju i posle izbora, a navigacija može prekinuti plaćanje. Zato se refund ne uklanja. Izbor najpre pripremiti dok gameplay čeka, zatim jednom naplatiti i pokrenuti samo još važeći pokušaj; neuspeh ili otkazivanje posle naplate vraća taj receipt tačno jednom. Koristiti postojeći [spend/refund ugovor](../ui/DailyCoins.js#L40), bez novog sistema valute.

## Pokrivenost nalaza

Ovo je mapa obaveza, ne dokaz ispravke; detaljni dokazi ostaju u Notes.

| Nalaz iz analize | Obrada | Granica završetka |
|---|---|---|
| 1 i 7 · tasteri, fokus, modalnost | UI-07, raspored u UI-03 | Native aktivacija i pozadina provereni u browseru; bez remapiranja gameplay-a |
| 2 · događaji kroz pauzu/UI | UI-07 | Neretva/Otpisani/Dark city/Capoeira i zajednički ulaz poštuju fazu i metu |
| 3 · opisi nisu isto što i sposobnosti | UI-01/PD-2, UI-03 | Odobren tačan opis javnih komandi; tajni levi Shift se ne otkriva, neizvršiv skok se ne obećava |
| 4 i 5 · touch razlike i nedostajuće komande/pauza | UI-07 za postojeće kontrole; kasniji PD-3/UI-08 za nove | Osnovni paket popravlja postojeće kontrole; preostala ograničenja ostaju navedena bez tvrdnje o punoj podršci |
| 6 · tvrdnja o Esc | T-5, kasniji PD-4 | Postojeće ponašanje ostaje; izmena navigacije traži odluku i ne blokira UI-07 |
| 8 · uski ekran i slojevi | UI-03, UI-04 | Snimci/merenja umesto tvrdnje iz CSS-a |
| 9 · reset i dva dodira | UI-07 | Nema zaglavljenih ulaza; CapsLock se osvežava iz stvarnog događaja |
| 10 · naplata i kasno učitavanje | UI-05 | Priprema, jedan spend, isti izbor i jedan refund pri prekidu |
| 11 · simboli/HTML nazivi | UI-02, PD-2/UI-03 | Katalog po značenju; alt/tekst po odobrenju |
| 12 · poruke i prirodni ishodi | T-3, UI-06/UI-04 | Sačuvana postojeća semantika; ne dodaju se ishodi gde ih nema |
| UI-M1 i UI-R1 · tajmeri poruke/izveštaja | UI-06 | Isti tekst i A/B/A bez ranog brisanja; ugašeni report ne dopisuje DOM |

## Raspored, zavisnosti i procene

Jedan izvršilac. Puni redosled je UI-00 → UI-06 → UI-07 → UI-01 → UI-05 → UI-02 → UI-03 → UI-04 → UI-09. UI-04 završava osnovni paket; UI-09 je zasebna kasnija dorada sa sopstvenim proverama. UI-08 se uključuje samo posle PD-3 i UI-07/UI-03, uz novi raspored i završnu proveru tog dodatka. UI-05 ne zavisi od novog birača ili završenog vizuelnog refaktora: koristi već usaglašenu oznaku naplate iz UI vodiča; UI-02 zatim sređuje zajednički katalog.

| Talas | Koraci | Min / verovatno / max, idealni radni dani | Kontrolna tačka |
|---|---|---|---|
| 1 · Analiza, završena | UI-00 | 0.75 / 1.5 / 2.5 | Sačuvani izvori i nalazi |
| 2 · Pouzdanost | UI-06, UI-07 | 1.25 / 2.5 / 4 | Tajmeri, gašenje i postojeći ulazi imaju ciljane provere |
| 3 · Potrebni tekstovi i naplata | UI-01, UI-05 | 1 / 2 / 3.5 | Dogovoreni potrebni tekstovi; start/replay, besplatan ulaz i povraćaj pouzdani |
| 4 · Doslednost prikaza | UI-02, UI-03 | 1.5 / 2.75 / 4.5 | Odobreni simboli i postojeće teme usklađeni i pregledani |
| 5 · Provera osnovnog paketa | UI-04 | 0.5 / 1 / 1.5 | Proveren menjani tok; ne tvrdi se da su kasnije opcije ugrađene |
| 6 · Kasniji izbor teme | UI-09 | 0.5 / 1 / 2 | Birač u Settings sa proverom čuvanja i aktivnih potrošača |
| Ukupno, puni plan | Svi osim uslovnog UI-08 | **5.5 / 10.75 / 18 p** | Uključuje raniju procenu UI-00 |
| Preostalo, puni plan | Bez UI-00 i UI-08 | **4.75 / 9.25 / 15.5 p** | Uključuje kasniji UI-09 |
| Preostalo, osnovni paket | Bez UI-00, UI-09 i UI-08 | **4.25 / 8.25 / 13.5 p** | Predlog da prvo završimo ovo |
| Uslovno, zasebno | UI-08 | **0.5 / 1 / 2 p** | Tek posle odluke PD-3 i preciziranja obima |

[Mašinski raspored](plan-ui.json) sadrži puni redosled; osnovni paket je njegov deo do kraja UI-04. Izbor manjeg paketa odlaže UI-09, bez promene već donetog dogovora o biraču. Veći posao od procene podeliti pre sprovođenja.

## Koraci

<a id="ui-00"></a>
### UI-00 · Detaljna analiza postojećeg UI-ja i komandi · 0.75 / 1.5 / 2.5 p · Agent

- **Urađeno:** analiza svih scena, prozora, izgleda, ulaza, opisa, HUD-a i lokalnih varijanti, uz posebnu analizu svih odgovornosti i životnog ciklusa UI.js. [Dokazi i popis](#ui-00-analysis), [UI.js](#ui-js-analysis).
- **Granica Done:** završena analiza izvora i trajni zapis; nije izvršen browser niti projektni testovi. To nije nedovršena implementacija UI-00, ali ne zatvara izvršne obaveze kasnijih koraka. Stare činjenične tvrdnje ponovo proveriti ako se izvor promenio.
- **Trajno znanje:** [arhitektura](ARHITEKTURA.md#ui-i-ulaz), [odluke](DOCS.md#ulaz-u-igre-i-novčići), [ograničenja provera](TESTING.md#ui-verification-limits). Ovaj korak se ne radi ponovo.

<a id="ui-01"></a>
### UI-01 · Neophodni tekstovi i odluke uz izmene · 0.25 / 0.5 / 1 p · Agent

- **Šta:** prema [odobrenju za automatske ispravke opisa](UI.md#komande-tastatura-i-touch), dodati nedostajuće stvarne komande i ukloniti nevažeće opise bez pojedinačnog pitanja. Pitati kada dva tastera rade isto, a jedan je već naveden; levi Shift i PageUp/PageDown ostaju skriveni. Poruke o žetonima potrebne za UI-05 već su potvrđene. Opisati konkretan okidač i prikaz. PD-3/PD-4 se ovde samo vode kao kasnije odluke; ne čekati ih pre popravki. Birač, simboli i prikaz naplate već su potvrđeni i ne traže ponovno odobrenje.
- **Referenca:** [popis](#ui-00-analysis), [UI.js](#ui-js-analysis), [pravilo odobravanja](DOCS.md#odobravanje-ui-elemenata). Za menjani zajednički deo navesti sve potrošače i nužnost izmene umesto lokalne kompozicije.
- **Gotovo kada:** netačni i nedostajući opisi osnovnog paketa provereni su prema stvarnom kodu i ispravljeni po opštem odobrenju; dodatni tasteri već opisane iste radnje imaju odluku vlasnika. Ostali novi UI tekstovi imaju konkretno odobrenje. PD-3/PD-4 ostaju jasno označeni kao kasnije odluke, bez aktiviranja UI-08 ili promene Esc-a. Odlaganje novih opcija ne proglašava postojeći kvar prihvaćenim.
- **Spolja:** za opise postojećih komandi primeniti opšte odobrenje; pitati samo o dodatnom tasteru već opisane iste radnje. Ostale nove UI elemente/tekstove i obim podrške bira vlasnik, ne tehničke detalje tajmera. Browser za predlog samo uz dozvolu; bez nje pripremiti konkretne primere iz postojećih šablona i jasno navesti neproveren izgled.
- **Potvrđene poruke (PD-2):** za blokirano čuvanje podataka i neuspešan povraćaj koristiti [dogovorene poruke o arkadnim žetonima](UI.md#džep-i-arkadni-žetoni) u postojećem početnom prozoru. Nedostupno stanje ne pretvarati u nula žetona; pri neuspešnom povraćaju zadržati nerešen receipt. Tekstovi više nisu otvorena dilema; implementacija je UI-05.
- **Potvrđen i dodat opis (PD-2):** Physics vehicle prikazuje „Space — brake” uz postojeće osnovne komande, kroz lokalni `controlKeys` u [sceni](../scenes/physics-vehicle/Main.js). Ponašanje kočnice i dodele tastera nisu menjani. Pregled u igri i projektni testovi nisu izvršeni za ovu dopunu.
- **Automatska ispravka opisa:** u [Čamcu](../scenes/camac/Main.js) dodat je „Space — shoot”, a iz uputstva uklonjen nevažeći „↓ or S — backward”. Postojeći `options` i komande su očuvani; menja se samo lokalni `controlKeys`. Proverena je sintaksa; igra i projektni testovi nisu pokrenuti.


<a id="ui-06"></a>
### UI-06 · Poruke, izveštaj i gašenje UI-ja · 0.5 / 1 / 1.5 p · Agent

- **Šta:** u [UI](../ui/UI.js) zameniti tekstualno prepoznavanje tajmera jednim aktivnim otkazivim tajmerom: nova poruka otkazuje prethodni, end ga gasi, callback ne menja ugašeni prikaz. U [Report](../ui/Report.js) ukloniti odloženi prepend i vezati papir sinhrono za već napravljeni konkretan startni kontejner; očuvati kucanje i audio. Zaštititi nove javne upise i handlere ugašenog UI-ja, uz očuvano čišćenje vlasnikovog DOM-a i drawnBy. Ne uvoditi novi cache/reset API, temu ili hijerarhiju klasa.
- **Referenca:** [UI-M1 i UI-R1](#ui-js-defects), [clear/draw](../ui/UI.js#L14), [Report](../ui/Report.js#L40), [kasni end test](../tests/unit/Scene.test.js#L258).
- **Gotovo kada:** ciljane provere pripremljene u postojećim UI/screens/Scene testovima pokrivaju isti tekst u t=0/t=2 i A/B/A, tri sekunde poslednjeg zahteva, end pre isteka, prestanak report-a i promenu scene pre njegovog dodavanja, kasni upis/dupli end i očuvanu novu scenu. Jedan aktivan tajmer, bez dopisivanja starog report-a. Uz dozvolu te provere prolaze; eventualno neizvršenje zabeleženo za UI-04. Prozor, zvuk i pravila skrivanja/odbacivanja poruka ostaju kao T-3.
- **Zamke:** otkazivanje kucanja nije otkazivanje dodavanja papira; erase zaštita nije dozvola za kasni draw. UI zvukove i dalje gasi audio sesija, ne praviti drugog vlasnika.
- **Spolja/zavisnost:** završeni UI-00; radi se prvi, bez čekanja UI-01. Za ova dva potvrđena propusta ne treba nova odluka o izgledu.

<a id="ui-07"></a>
### UI-07 · Događaji, tastatura i fokus · 0.75 / 1.5 / 2.5 p · Agent

- **Šta:** u Keyboard/Input/Touch i lokalnim handlerima sprečiti prikupljanje gameplay komandi sa UI meta ili dok odgovarajući gameplay nije dozvoljen. Ne otkazivati native aktivaciju dugmadi ni strelice Volume-a. Keyup, pointerup/cancel i reset moraju očistiti prethodno držanje i kad se fokus promenio; CapsLock osvežavati iz stvarnih keyboard događaja. Touch prati pritiske po pointerId i resetuje ih na napuštanju taba/fokusa; otpuštanje jednog od dva dodira istog dugmeta ne briše drugi.
- **Postojeće kontrole:** Controls/kamera koriste click za pojedinačnu akciju; fokusirani touch taster koristi keydown/keyup za istu držanu radnju, bez dupliranja sa globalnom tastaturom. Prozori dobijaju semantiku, ograničenje fokusa na aktivan blokirajući ekran i povratak na canvas pri start/continue; pozadinske komande tada ne rade. Esc zadržava postojeće ponašanje; novo značenje nije deo ove popravke i čeka kasniji PD-4. Poruka nije blokirajući modal. Sačuvati trusted audio/pointer-lock put, Ustanak runde i disableEvents dekoraciju.
- **Lokalno:** Neretva/Otpisani proveravaju stanje i metu, koordinate gađanja vezuju za događaj koji ga pokreće; Dark city/Capoeira ne tretiraju session.active kao dozvolu tokom pauze. Nove komande/dugmad nisu deo ovog koraka.
- **Referenca:** nalazi 1, 2, 4, 5, 7, 9 u [analizi](#ui-00-analysis); [Keyboard](../core/io/Keyboard.js), [Touch](../core/io/Touch.js), [UI handleri](../ui/UI.js#L64), [faza sesije](../core/runtime/GameSession.js#L34), per-game profili i [postojeće provere](TESTING.md#ui-verification-limits).
- **Gotovo kada:** pripremljeni testovi kroz stvarne handlere proveravaju klik na UI bez gameplay efekta, pauzu/ready/finished, UI keydown sa očuvanim native ponašanjem, pravilno otpuštanje posle promene fokusa, dva dodira, blur/visibility i ugašenu scenu. Browser scenariji su pripremljeni za Tab/Shift+Tab/Enter/Space, Volume strelice, fokus kroz sve postojeće prozore i pointer lock. Dozvoljene ciljane provere prolaze; native/browser dokazi koji čekaju jasno idu UI-04. Tastatura i postojeće touch akcije imaju istu semantiku pre/posle izvan navedenih propusta.
- **Zamke:** ne blokirati keyup samo zato što je keydown sada na drugoj meti; ne pretvoriti held fire u click fire; ne zahtevati novi touch pause element pre odluke PD-3.
- **Spolja/zavisnost:** UI-06; odobrenje treba samo ako se otkrije neophodna nova kontrola/tekst, tada prebaciti taj deo u UI-08/PD-2. Browser ne pokretati bez dozvole.

<a id="ui-02"></a>
### UI-02 · Zajedničke ikonice komandi i HUD-a · 0.75 / 1.25 / 2 p · Agent

- **Odobrena oznaka naplate:** katalog čuva putanje GIF-a i mirnog PNG-a iz [UI vodiča](UI.md#potvrđena-oznaka-naplate). UI bira animaciju za dostupno dugme, a mirni prikaz za disabled stanje ili smanjeno kretanje; oba ostaju u boji, sa pikselizovanim ivicama i tamnim obrisom. Na disabled dugmetu oznaku naplate prigušiti zajedno sa natpisom. Resursi su sačuvani, ali katalog i potrošači još nisu povezani. Ne uvoziti Coin/Three.js u UI ili katalog radi prikaza.
- **Šta:** sprovesti T-2 i odobreni katalog iz UI-01 u `core/io/icons.js`: tekstualni simbol ili putanja slike po značenju radnje/pokazatelja. UI sloj određuje markup, dimenzije i pristupačne nazive; donji katalog ne uvozi UI/igre. Uskladiti Touch default-e, centralnu dugmad i lokalne izbore u scenes/core/core3d bez menjanja buttonDict ključeva, redosleda ili tastature.
- **HUD odluka vlasnika (2026-11-20):** isti izvor daje gorivo, bombe, municiju, živote i druge postojeće pokazatelje. Municija je sličica metka, ne 🔫. Kluz trenutno koristi [Bullet.src](../scenes/franjo-kluz/Bullet.js#L14) i lokalni prikaz `items/granata.gif`; prebaciti HUD na katalog, a ne učiniti UI zavisnim od klase projektila. Isti 💣 u Kluzu i Visu potiče iz kataloga; ne dodavati pokazatelj igri koja ga nema.
- **Referenca:** [Touch](../core/io/Touch.js#L65), [Warplane](../core3d/aircraft/Warplane.js#L16), [Vis HUD](../scenes/vis/Main.js#L111), aktuelni [Kluz HUD](../scenes/franjo-kluz/Main.js), [granice uvoza](../eslint.config.mjs#L168).
- **Gotovo kada:** svi potrošači odobrene iste radnje/pokazatelja koriste isti izvor ili imaju odobren izuzetak. Ponašajne provere proveravaju stvaran render simbola/slike i izbora po značenju, default prazne vrednosti, odsutne/nepoznate ključeve, redosled i zadržanu aktivaciju. Ista putanja metka ne zahteva kopiranje slike. Uz dozvolu ciljane provere/lint prolaze; pregled u browseru ostaje UI-03/UI-04.
- **Zamke:** attack nije uvek pucanje; Kluz special nije tastaturni V. Ne uvoziti ui/icons u core/io i ne deliti veličine projektila sa HUD dimenzijama.
- **Spolja/zavisnost:** odobren UI-01/PD-2 i završeni UI-07. 💥 za pucanje, 👊 za nenaoružani napad, ✨ za magiju, sličica metka za municiju, odobreni novčić prema stanju dugmeta i ostali dosledni postojeći simboli ne pitaju se ponovo.

<a id="ui-03"></a>
### UI-03 · Prozori, opisi i raspored HUD-a · 0.75 / 1.5 / 2.5 p · Agent

- **Šta:** sprovesti odobrene stilove/raspored iz UI-01 kroz postojeće šablone, male deljene prikaze i CSS. Obuhvatiti sve vrste prozora, svih sedam custom startova, Ustanak rundu, HUD izvan #ui, Controls, poruke i greške rutera bez aktivne scene. Igra poseduje sadržaj, podatke i akcije; tema se postavlja pre stvaranja elemenata. Svaka tema mora dosledno obuhvatiti prozore, dugmad, HUD i kontrole, uz zajedničko ponašanje komponenti. Ne svoditi sve igre na jednu temu; tema igre je podrazumevana kada nema korisnikovog globalnog izbora; jednom izabrana korisnikova tema ima prednost i pri prelasku na druge igre.
- **Opisi:** koristiti proverene per-game sposobnosti i odobrene tekstove PD-2, uključujući javne alternativne tastere i držanje/puštanje. [Levi Shift za trčanje je namerno skriven](UI.md#skrivena-precica-za-trcanje): u opisu ostaje samo CapsLock. [PageUp/PageDown ostaju skrivene alternative za Q/E](UI.md#skrivene-precice-za-bocno-kretanje). Ne menjati postojeće binding-e. Ne obećavati nepostojeću komandu niti menjati binding radi opisa. Alt slika izvodi se iz odobrenog naziva izbora. Esc opisuje postojeće ponašanje; njegova promena čeka PD-4.
- **Referenca:** [popis i profili](#ui-00-analysis), [UI šabloni](../ui/UI.js#L99), [styles](../ui/styles.js), [CSS](../ui/style.css#L238), [runda](../scenes/ustanak/Main.js#L226), [greške](../scenes/main.js#L12), [HTML reference](../tests/unit/screens.test.js#L19).
- **Gotovo kada:** sve odobrene lokalne varijante sprovedene ili evidentirane kao izuzetak; očekivanja HTML/klasa ažurirana samo uz odobrenu razliku. Uz dozvolu snimci pre/posle u istom stanju obuhvataju sve menjane varijante i stilove, na 1280×800, 320×568, 390×844 i 844×390 gde su podržani. Izmereni su prelivanje, dostupnost dugmadi i preklapanja modal/HUD/touch/kamera; vlasnik je pregledao snimke ovog koraka. Dokaz slika/merenja i izvršene ciljane provere zabeleženi su. Posle vizuelnih izmena ponoviti pogođene scenarije već sprovedenog UI-05, da raspored ne pokvari početak i naplatu.
- **Zamke:** min-width 320px i z-index iz izvora nisu dokaz da prikaz staje na ekran; shared health bar nije uvek u #ui. Stare reference ne presnimavati grupno da bi testovi prošli.
- **Spolja/zavisnost:** UI-02 i UI-07, potvrđen PD-1 i preostali predlog PD-2; browser dozvola i vlasnikov pregled snimaka jesu uslovi zatvaranja ovog koraka.

<a id="ui-09"></a>
### UI-09 · Izbor teme u Settings · 0.5 / 1 / 2 p · Agent

- **Odluka vlasnika:** izbor stila u Settings ostaje potvrđen, ali je P2 i radi se posle osnovnog paketa UI-04. Nije uslov za ispravku ulaza, naplate ili koherentnosti postojećih tema. Igra definiše podrazumevani stil; korisnikov izbor važi za sve igre i ima prednost. Ne uvoditi jednu obaveznu temu za sve igre.
- **Birač:** potvrđena padajuća lista **UI style** ispod Volume, opcije redom **Predefined, Simple, RPG, White**. Predefined prati `uiStyle` konkretne igre; Simple/RPG/White biraju `simple`/`rpg`/`white`. Predefined nije ključ nove teme i ne prosleđuje se direktno u styleClasses. Sačuvati i taj izbor, tako da se kasnije nove igre ponovo otvaraju sa svojim podrazumevanim stilom.
- **Šta:** dodati ovaj odobren globalni birač u postojeća podešavanja; izabrana tema važi za aktivnu i svaku sledeću igru. Sva podešavanja se čuvaju između poseta u istom browseru; novu temu učitati iz zajedničkih podešavanja pre prikaza elemenata. Upis teme mora sačuvati Volume i druga polja, a nepoznata/nevažeća tema vraća podrazumevani stil igre bez odbacivanja ostalih važećih podešavanja. Osvežiti aktivni prozor, dugmad, HUD, Controls, health bar, kameru i druge postojeće potrošače teme; ne menjati podatke ili fazu partije, ne restartovati scenu i ne naplaćivati promenu. Očuvati trenutni fokus i vrednosti ostalih podešavanja. Nije dovoljno promeniti globalni currentStyle ako već napravljeni DOM ostaje u starim klasama.
- **Referenca:** [stilovi](../ui/styles.js), [Settings](../ui/UI.js#L126), [čuvanje podešavanja](../ui/settings.js), [stalni health bar](../core3d/actor/behaviors/PlayerView.js), [kamera](../core3d/actor/ChaseCamera.js), [Controls](../ui/Controls.js) i [analiza UI.js](#ui-js-analysis).
- **Gotovo kada:** za svaku ponuđenu temu promena iz Settings daje dosledan aktivni UI bez mešanja starih i novih elemenata, gubitka HUD podataka, promene partije ili dvostrukih listenera. Pripremljene provere pokrivaju promenu tokom pauze, povratak u igru i sledeći prozor; prelaz na drugu igru zadržava korisnikovu temu uprkos njenom podrazumevanom stilu; reload i nova poseta vraćaju sačuvani izbor, uključujući Predefined koji prati odgovarajuću temu svake igre; oštećena/nepoznata vrednost i nedostupno skladište imaju bezbedan fallback prema pravilu podešavanja. Provere potvrđuju i da čuvanje jednog podešavanja ne briše ostala. Uz dozvolu izvršiti ciljane provere i browser pregled ovog dodatka; neizvršene provere ostaju izričita otvorena obaveza UI-09 i ne prenose se na ranije završen UI-04. Cena i valute ne zavise od teme.
- **Spolja/zavisnost:** UI-03/UI-07 i završen osnovni paket UI-04. Prikaz, nazivi, globalni opseg i čuvanje već su potvrđeni. Ovaj kasniji dodatak mora sprovesti sopstvene ciljane i browser provere iz kriterijuma iznad; zatvoren osnovni paket nije dokaz provere birača.

<a id="ui-08"></a>
### UI-08 · Dopune touch komandi · 0.5 / 1 / 2 p · conditional · Agent

- **Okidač:** vlasnik u PD-3 odobri konkretne nove kontrole za ranije nedostupne radnje ili pristup pauzi. Bez toga ovaj korak se ne izvršava, ne ulazi u zbir i ne služi da se prikrije otvoreno ograničenje.
- **Šta:** samo za odobrene igre/radnje priključiti touch ekvivalente istom značenju kao tastatura: npr. leteći skok Sorceress ili kočnica/brzina/pauza, ako su izričito izabrani. Ne izvoditi sve sposobnosti isključivo iz animDict; podrška je eksplicitna, ali bez univerzalne prerade svih kontrolera. Za igre bez dogovorene touch podrške zadržati dokumentovano ograničenje.
- **Referenca:** profili G/V/Z/T/U/F i nalazi 4/5 u [analizi](#ui-00-analysis); [Touch](../core/io/Touch.js), [Input](../core/io/Input.js), [sposobnost skoka](../core3d/actor/Actor.js#L179).
- **Gotovo kada:** svaka odobrena radnja ima isti gameplay efekat i pravilo držanja kao postojeći uređaji, jasnu oznaku i dostupno mesto u dogovorenim dimenzijama; nema preklapanja, višestrukih okidanja ni zaglavljenog ulaza. Ciljane i browser provere izvršene uz dozvolu, ili precizno prenete u završnu proveru tog dodatka gde nisu uslov vlasnikovog pregleda.
- **Spolja/zavisnost:** kasniji PD-3, UI-07 i UI-03; pre aktiviranja precizirati obim/procenu, dopuniti mašinski raspored i predvideti proveru dodatka. Ne blokira završetak osnovnog paketa; postojeća ograničenja podrške ostaju navedena.

<a id="ui-05"></a>
### UI-05 · Start, ponovna igra i novčić · 0.75 / 1.5 / 2.5 p · Agent

- **Potvrđen prikaz naplate:** na svakom naplativom Start/izbor/Play again dugmetu desno od postojećeg naziva koristiti [zlatan novčić i odnos dostupno/potrebno](UI.md#potvrđena-oznaka-naplate), bez dodatka „1 coin” ili zvezde. Dostupno dugme prikazuje rotaciju, disabled mirni PNG; uz smanjeno kretanje PNG ostaje i na dostupnom dugmetu. U oba stanja zadržati boju, pikselizovane ivice i tamni obris; na disabled dugmetu novčić i broj prigušiti zajedno sa ostalim sadržajem. Natpis i ikonica ostaju u jednom redu bez odsecanja/prelivanja; besplatna partija i Continue ne dobijaju oznaku. Ne tražiti ovo odobrenje ponovo. Za nulu novčića potvrđen je native disabled svih naplativih početaka, bez poruke, obaveštenja ili dodatnog prozora; izgled dugmeta i valute mora sam objasniti da novčić nedostaje. Poruke za blokirano čuvanje podataka i neuspešan povraćaj potvrđene su u UI vodiču; nedostupno stanje ne prikazuje se kao nula.
- **Provera nule:** disabled za Start, svaki naplativi izbor i Play again, bez aktivacije mišem ili tastaturom i bez tekstualne poruke o manjku novčića. Besplatna partija, Continue i Main menu ostaju dostupni. Promena salda ili dnevni reset vraćaju dostupnost u istom prozoru. U UI-03 posebno pregledati da izgled u svakoj temi jasno prenosi nedostatak novčića, a ne samo da dugme ne reaguje.
- **Usaglašen prikaz naplate:** [stalni pregled](../ui.html) prikazuje [dogovor iz UI vodiča i pouke iz dorada](UI.md#potvrđena-oznaka-naplate), uključujući odnos dostupno/potrebno. Izgled je usaglašen; povezivanje sa stvarnom naplatom ostaje posao ovog koraka. Trajna pravila i razlog izbora čuvaju se u vodiču, bez ponovnog otvaranja ovog izbora dizajna.
- **Dokaz i granice provere:** [TESTING](TESTING.md#ui-verification-limits) beleži proverene širine, teme, raspored, stanje dugmeta, stvarnu rotaciju/mirovanje, smanjeno kretanje i konačno prigušivanje. Pregled ne dokazuje stvarnu naplatu ili ispravnost ulaza u igri; UI-05 ostaje TODO.
- **Šta:** sprovesti [potvrđeno pravilo](DOCS.md#ulaz-u-igre-i-novčići) i T-1/T-6/T-7. Kartica/direktan link/reload prvo učitavaju scenu bez naplate; posle init-a zabeležiti requiresCoin pre clearIntro. Besplatna igra kreće bez coin provere i radi i kada džep ili njegovo skladište nisu dostupni. Greška pri pravljenju/čitanju džepa ne ruši zajednički ulaz u besplatnu scenu.
- **Naplativa partija:** jedan početni prozor. Start/izbor pokreće jedan serijalizovan pokušaj sa stabilnim identifikatorom navigacije, scene i odabrane opcije. Prvo pripremiti izbor/model/slike bez pokretanja gameplay-a, ponovo proveriti važenje, jednom pozvati spend, pa pokrenuti istu pripremljenu partiju. Posle svakog await proveriti važenje. Neuspeh/otkazivanje posle spend zahteva refund tog receipt-a tačno jednom; neuspeh pre spend ne troši. Stare direktne pozive start-a iz custom handlera prevesti na isti ugovor, bez obilaska naplate.
- **Replay:** sačuvati stabilan identifikator poslednjeg uspešnog izbora za tu igru/režim. Nova instanca se pripremi za isti izbor; jedan klik Play again vodi novom spend-u i početku bez ponovnog biranja. Za besplatnu igru nema spend/refund ni novog prozora. Ne zaključivati cenu iz očišćenog intro-a i ne deliti stanje izbora između različitih igara.
- **UI i oporavak:** prikazati samo odobrene cenu/poruke PD-2 u istom startnom prozoru; bez dodatnog coin dialog-a i bez nove neodobrene oznake besplatno. Tokom pokušaja onemogućiti dvostruku aktivaciju i posle greške omogućiti ponovni pokušaj. Ako refund ne uspe zbog coin backend-a, zadržati nerešen receipt i prikazati odobrenu grešku; ne prijaviti uspešan povraćaj niti izgubiti obavezu pri novom pokušaju. Bez novčića/nedostupnog coin skladišta naplativa partija ne kreće; pri promeni stanja džepa/fokusa/vidljivosti/dana dugme se osvežava u istom prozoru. Sačuvati lokalni i produkcioni džep i postojeću politiku novog dana/refund-a.
- **Rana proba u ovom koraku:** pre zamene naplate proveriti put jednog standardnog starta, FPS pointer lock/audio i po jednog asinhronog izbora. Trusted audio/pointer-lock zahtev mora ostati u odgovarajućem korisničkom gestu; priprema i transakcija ne smeju tiho ostaviti plaćenu neigrivu partiju. Proba u browseru zahteva dozvolu. Ako ispliva ograničenje koje zahteva dodatni korisnički klik ili novi UI, taj deo predati vlasniku kao konkretan problem pre promene ugovora; ne menjati cilj broja klikova samostalno.
- **Referenca:** [Scene.start/clearIntro](../core/Scene.js#L102), [manager](../scenes/SceneManager.js#L16), [ruter](../scenes/main.js#L43), [džep](../ui/DailyCoins.js#L40), [Avatar](../scenes/avatar/Main.js#L86), [Warplane](../scenes/warplane/Main.js#L70), [Vis izbor](../scenes/vis/Avionce.js#L63), [režimi](../scenes/tenkici/Main.js#L39), [UI ograničenja](#ui-js-analysis).
- **Gotovo kada:** pripremljeni unit/integracioni testovi pokrivaju standardni start, svaki od sedam custom startova i replay sa sačuvanim izborom; jedan spend po uspešnoj naplativoj partiji, nula za besplatnu/karticu/neuspelo pripremanje, jedan refund za svako prekidanje posle naplate. Dvoklik, paralelna promena rute, neuspeh modela, neuspeh/refund oporavak, nedostupan džep, nula novčića i dnevni reset imaju proveru. Uz dozvolu ciljane provere i rana browser proba prolaze; smoke flow/navigation/arcade i konačni broj klikova proveriti u UI-04. Uklonjeni coin dialog ne ostavlja slušaoce/stilove.
- **Spolja/zavisnost:** UI-06/UI-07 i potrebni odobreni tekstovi PD-2; radi se pre opšteg vizuelnog refaktora i birača teme. Koristiti usaglašeni prikaz iz stalnog pregleda, bez čekanja kataloga UI-02. Browser proba je obavezna pre zatvaranja ovog koraka ili mora biti izričito preuzeta/odložena od vlasnika. Besplatno znači nezavisnost od coin backend-a; nepovezane kvarove drugih skladišta ne predstavljati kao uspeh.

<a id="ui-04"></a>
### UI-04 · Provera osnovnog paketa · 0.5 / 1 / 1.5 p · Agent

- **Šta:** zatvoriti mapu nalaza i odobreni popis na konačnoj radnoj kopiji, pregledati diff prema zatečenom stanju. Uz dozvolu prvo ciljane provere preostalih koraka; zatim redom `npm run lint`, `npm test`, `npm run check`, `npm run smoke -- --workers=1`. Lint koristi --fix: pregledati automatske izmene i ponoviti pogođene provere samo ako su menjale kod. Jedan browser u datom trenutku; ne menjati globalni broj radnika radi ove serije.
- **Integracija:** proveriti primenljive [scenarije analize](#ui-execution-checks), UI-M1/UI-R1 i promene naplate. Obuhvatiti prirodne ishode, svaku opciju starta, native input/fokus/Volume, postojeće touch kontrole i layout kroz stvarne potrošače. Ne proveravati neizgrađeni birač kao da postoji; UI-09 kasnije proverava promenu teme na aktivnom DOM-u. Nove touch akcije i drugačiji Esc nisu uslov ovog paketa, a njihovo odsustvo ostaje dokumentovano ograničenje.
- **Referenca:** [TESTING](TESTING.md#ui-verification-limits), [flow](../tests/smoke/flow.spec.js), [navigation](../tests/smoke/navigation.spec.js), [loading](../tests/smoke/loading.spec.js), [phone](../tests/smoke/phone.spec.js), [styles](../tests/smoke/styles.spec.js), [arcade](../tests/smoke/arcade.spec.js). Postojeći phone skup nije pregled svih igara; dopuniti samo ponašanja zahvaćena promenama.
- **Gotovo kada:** UI-06/UI-07, potrebni deo UI-01, UI-05, UI-02 i UI-03 su završeni i nema regresija uvedenih tim izmenama. Za svaki nalaz osnovnog paketa postoji ispravka i dokaz ili izričita odluka vlasnika o preuzimanju/odlaganju provere. Navesti stvarno izvršene komande/scenarije i radnu kopiju; „nije pokrenuto” nije prolaz. UI-09, UI-08 i PD-4 ne postaju Done završetkom ovog koraka; njihove kasnije provere ostaju obaveza tih dodataka.
- **Trajno znanje:** uskladiti DOCS sa potvrđenim odlukama, ARHITEKTURA sa stvarnim ugovorima, TESTING sa stvarnim dokazima/ograničenjima; ne kopirati inventar iz koda. Završetak osnovnog paketa nije završetak UI-09 ili drugih odloženih obaveza. Plan i raspored ukloniti tek posle zatvaranja svih preostalih obaveza ili njihovog izričitog preuzimanja, prenosa korisnog znanja i popravke dolaznih linkova prema [pravilu brisanja](DOCS.md#kako-zapisujemo-znanje).
- **Spolja/zavisnost:** UI-06/UI-07, potrebni UI-01, UI-05, UI-02 i UI-03; posebno odobrenje za ceo skup i smoke. Bez njega priprema je moguća, a završna provera ostaje otvorena. UI-09 i neaktivirani UI-08 nisu prethodnici ovog osnovnog paketa.

## Otvorene odluke i preostale nepoznanice

**Vlasnik:** PD-1 i prikaz naplate su rešeni. PD-2 ima prednost samo za nove tekstove neophodne narednoj izmeni; to ne blokira UI-06/UI-07. PD-3 i promena prozorskog Esc-a iz PD-4 su P2 i mogu da sačekaju, uz postojeće ponašanje i dokumentovana ograničenja. Izbor teme ostaje odobren kao kasniji UI-09. Dozvole za konkretne provere traže se sa poznatim obimom/opterećenjem i nisu dizajnerske dileme.

**Izvršilac, kroz provere:** stvarna geometrija/čitljivost i ponašanje native fokusa; pointer lock/audio preko pripreme i naplate; dostupnost coin backend-a bez blokiranja besplatnog ulaza. To se utvrđuje izvorom i probom, ne prebacuje se vlasniku kao pitanje o implementaciji. Ako proba pokaže da je potreban nov UI ili promena broja klikova, predstaviti konkretan nalaz.

## Rizici

| Rizik | Posledica | Ublažavanje i korak |
|---|---|---|
| Novi izvor ikonica u pogrešnom sloju | Zavisnost core/io od UI-ja i pad lint-a | T-2/UI-02: čisti katalog ispod UI, markup ostaje u UI |
| Jednaki tekstovi i odloženi Report | Nestaje nova poruka ili stara scena dopisuje novi ekran | T-3/UI-06: otkazivanje tajmera, sinhroni kontejner, ciljane provere |
| UI/pozadina dele input/fokus | Klik gađa metu, tasteri blokiraju Volume ili ostanu pritisnuti | UI-07: faza/meta, native aktivacija, otpuštanje i reset po pointerId |
| Asinhroni start troši ili ponavlja pogrešnu partiju | Naplata bez igre, dvostruki spend ili izgubljen izbor | T-6/T-7/UI-05: stabilan pokušaj/izbor, priprema pre spend, jedan refund, rana proba gestova |
| Nedostupno coin skladište | Cela arkada blokira i besplatne scene | UI-05: izolovana nedostupnost džepa, nezavisna besplatna putanja |
| Neizmereni ekran / nepotpun phone skup | Preklapanja ili nedostupne komande ostanu neprimećeni | UI-03/UI-04 i PD-3; emulaciju razlikovati od fizičkog uređaja |
| Promenjen izbor, stare klase ostanu u DOM-u | Mešaju se dve teme u istoj igri | UI-03 prvo usklađuje teme; UI-09 proverava sve postojeće potrošače i njihovo osvežavanje |
| Popis zastari tokom rada na Kluzu | Prepisan HUD ili pogrešni nalazi o municiji/bombama | Rečitati aktuelni izvor pre koraka, osvežiti samo zahvaćene dokaze; bez vraćanja tuđeg rada |

## Notes

<a id="ui-00-analysis"></a>
### 1. Analiza UI-00 — 2026-11-20, pregled izvora

**Dokazi i granice:** svih 39 scena sa `Main.js`, 37 kartica menija i dve dodatne direktne putanje pregledane su u izvoru, zajedno sa zajedničkim UI-jem i stvarnim potrošačima ulaza. Osnova: `d68b74500b18101da8d1171352d87589bba990a5` i zatečene nezavršene izmene Franje Kluza. Nisu pokretani igra, browser, projektni testovi, lint ni check; nema snimaka ni izmerenog rasporeda/kontrasta. Izgled ispod znači definiciju iz HTML/CSS-a, ne vizuelnu potvrdu.

**Popis:** 20 scena ima start (13 standardni, sedam prilagođeni), 19 nema; među ovih 19 je dekoracija `lookat-cursor`, ne igriva partija. Stilovi: 30 simple, osam rpg, jedan white. Odluka da igre bez starta budu besplatne je potvrđena; sadašnji ruter je još ne sprovodi. Konačni izgled i tekstovi ostaju otvoreni; tehnička pravila i obrada nalaza navedeni su u tekućem planu.

#### Prozori, tokovi i izgled

| Stanje | Sadržaj i upotreba iz izvora | Primena i dokaz |
|---|---|---|
| Ulazak / novčić | Kartica ima INSERT COIN dugme; sama slika/kartica nema handler početka. Direktan link i reload otvaraju native dialog: BACK pa INSERT COIN; prazan džep i nedostupno skladište imaju svoje poruke | Sve rute danas, uključujući scene bez starta: [klik](../scenes/main.js#L119), [dialog](../ui/Arcade.js#L54), [poruke](../ui/Arcade.js#L137) |
| Učitavanje | loader.gif u centru, bez dugmadi. Čeka init i slike, nacrta scenu, zatim prikaže start ili automatski pokrene | [Spinner](../core3d/loaders.js#L157), [redosled](../scenes/SceneManager.js#L39). Avatar, Warplane i Vis dodatno učitavaju odabrani lik/avion posle izbora |
| Standardni start | Opcioni papirni izveštaj, uvod i 🔥 Start mission; Moon landing koristi Start. Nema Main menu. Vertikalno, razmak 8px | [prikaz](../ui/UI.js#L99), [izveštaj](../ui/Report.js#L3); potrošači u pregledu scena |
| Prilagođeni start | Avatar: tri slike/opisa; Warplane: pet slika; Vis: četiri slike/naziva; Tenkici/Ustanak: dva režima; RPG/Graveyard: naslov, tekst i Start | Sedam lokalnih implementacija u pregledu scena; većina nema flex-column kao standardni start. Njihov sadržaj nije zamenljiv bez odluke |
| Pauza | Game paused; ☰ Main menu → ⚙️ Settings → ↻ Play again → 🔥 Continue, vertikalno. Esc tokom igre ili PausePolicy je otvara | Sve osim dekoracije: [prikaz](../ui/UI.js#L112), [policy](../core/PausePolicy.js#L3). FPS prati gubitak pointer lock-a, ostale scene skrivanje taba. Sam blur resetuje tastaturu, ne pauzira običnu scenu |
| Podešavanja | Settings; Main menu, Volume range 0–100 korak 5, ← Back. Jačina je zajednička igrama; otvaranje ne nastavlja gameplay | [prikaz](../ui/UI.js#L126), [primena i čuvanje](../ui/settings.js#L30) |
| Runda | Naslov, rezultat, Main menu → Next round; simple-container, bg-olive dugmad | Samo Ustanak 1P/2P; dva dobijena kruga završavaju meč. [prikaz](../scenes/ustanak/Main.js#L226), [reset](../scenes/ustanak/Main.js#L237) |
| Pobeda / poraz | 🎖️ Pobeda!/naslov ili ☠️ Game over, poruka; Main menu → Play again. Mešani srpski i engleski tekstovi | [pobeda](../ui/UI.js#L171), [poraz](../ui/UI.js#L163). Prirodni uslovi zavise od scene; zajednički renderer nije dokaz da svaka igra ima prirodan kraj |
| Greška | Crveni naslov i Main menu; nema donje potvrde jer nema nastavka | [ruter](../scenes/main.js#L43): nepoznat hash, neuspešno učitavanje i runtime greška; uvek simple stil, bez zavisnosti od aktivne scene |
| HUD / poruke | HUD u #ui, prozori u #modal, poruke odvojeno. Modal skriva postojeću poruku; novu odbacuje. Standardna poruka traje 3s zidnog vremena | [slojevi](../ui/UI.js#L87), [poruke](../ui/UI.js#L190). Ustanak najavu poteza piše direktno, a trajanje meri gameplay satom |

[Osnova CSS-a](../ui/style.css#L7): spacing 8px, ivica kontrola 16px, radius 4px, Press Start 2P/Courier, tekst 0.8em i višestruka tamna senka. Simple ima siv teksturni okvir, maslinastosivi tekst i crnu providnu podlogu; White ima belu spoljnu liniju; RPG teksturni okvir, sivu podlogu i žuto/narandžaste naslove. Papirni izveštaj ima zaseban font, širinu do 420px i min-height 260px. Ovo ne ocenjuje izmereni kontrast ili čitljivost emodžija.

[Prozor](../ui/style.css#L238): absolute na 50%/50%, translate(-50%,-50%), min-width 320px, max-width 540px, z-index 1; nema zajedničko ograničenje visine ni sopstveni scroll. Sam Vis izbor ima max-height 55vh i scroll. Dugmad: padding 12px/16px; RPG najmanje 160×60px, kamera 152×52px. Hover stilovi postoje; zajednički fokus nije posebno stilizovan, pa ne tvrdimo da browser ne prikazuje svoj fokus.

[Raspored HUD-a](../ui/style.css#L364): levo gore 8px, a ispod 500px vrh 40px; desno gore 8px. Opisi su dole levo, kamera/desni igrač dole desno na 8px. Progress je visok 22px, najmanje 210px širok; .progress je 96% ispod 500px, inače 220px. [Touch](../core/io/Touch.js#L1) koristi 60×60px strelice dole levo u mreži 3×2 sa razmakom 4px i kružne akcije dole desno sa razmakom 16px, z-index 9. Pravilo `.button-container ~ .bottom-right` pomera kameru samo pri odgovarajućem DOM redosledu, ne štiti opšte HUD i prozore. Touch ne preuzima RPG teksture.

#### Mapa ulaza i opisa

[Izvor tastera](../core/io/keys.js#L5) koristi fizički `event.code`, ne lokalizovani znak. Smerovi spajaju WASD i strelice; Q/E imaju i PgUp/PgDn; run je levi Shift dok se drži ili CapsLock stanje osveženo na keyup; Space je jump, C attack2, V special; attack je podrazumevano Enter. Remapiranja nema u podešavanjima. [Opisi](../ui/Controls.js#L4) su odvojeni: base prikazuje smerove i Esc; avatar dodaje CapsLock/Space; thirdPerson i Enter; fps dodaje Q/E i Mouse. Zato centralni keys ne garantuje potpunost uputstva.

| Profil | Radnja i semantika | Opis / touch / dokaz |
|---|---|---|
| M | Držanje WASD/strelica; Bunker pomera bočno, Ranjenik A/D rotira a W/S ide napred/nazad. Enter poziva prazan shoot | base; touch strelice. [Player2D](../core/actor/Player2D.js#L17), [Ranjenik](../core/actor/derived/WoundedSoldier.js#L6) |
| A | 3D kretanje/rotacija, Shift/CapsLock run, Q/E/PgUp/PgDn strafe; Space skok ili let prema avataru | Avatar/LED: base + Space, Planets: avatarControls; touch jump iz animDict, nema run/strafe. [sposobnosti](../core3d/actor/Avatar.js#L15), [kretanje](../core3d/actor/behaviors/KinematicMovement.js#L45) |
| G | Ista 3D osnova; Enter attack, C attack2, V special zavise od lika; Space traži ableToJump. Barbarian Enter/C/V i skok; Sorceress Enter/C i leteći skok; Witch Enter/C/V; Demon Enter/V i skok; Golem Enter/C; Partisan Enter i skok. Worker/ResistanceFighter nemaju jump klip | Touch uzima poznate ključeve animDict; ne zaključuje sposobnost iz jumpStyle. [kreiranje](../core3d/actor/Player.js#L22), [uslov](../core3d/actor/Actor.js#L179), [V iz idle](../core3d/actor/states/IdleState.js#L36). LOOP ponavlja napad na kraju animacije dok je ulaz držan; Witch koristi ONCE |
| F | FPS kretanje kao G; miš pogled, levi klik napad, Space skok; pointer lock | Shift i PageUp/PageDown su namerno skriveni po odluci vlasnika; fpsControls prikazuje CapsLock i Q/E; Airport skriva Esc. Nema joysticka ni touch akcija. [FPSPlayer](../core3d/actor/FPSPlayer.js#L8) |
| V | WASD/strelice gas/rikverc/skretanje, Space kočnica dok se drži; bez pucanja | Tank navodi Space break; Physics vehicle sada ima base + Space brake (naknadno odobrena dopuna). Touch nema kočnicu jer nema buttonDict. [Vehicle](../core3d/physics/Vehicle.js#L169) |
| B | A/D/levo/desno okreću čamac, W/gore ubrzava; Down ništa; Space ponavlja pucanje uz cooldown | Naknadno ispravljeno uputstvo: base bez Down opisa, dodat Space shoot. Touch strelice + 💥, i na desktopu. [Boat](../scenes/camac/Boat.js#L12), [prazan Down](../core/actor/TopDownPlayerBoat.js#L13) |
| C | A/D/levo/desno zakreću top; pointerdown puni, click na igralište ispaljuje | Mouse down/up opis; touch strelice i slobodno igralište. [punjenje](../core3d/actor/derived/Cannon.js#L55), [ispaljivanje](../scenes/cannon/Main.js#L47); stvaran okidač je click, ne globalni pointerup |
| T | Levi: A/D vožnja, W/S cev, Space ispaljuje posle otpuštanja; desni Tenkici 2P: strelice i Enter | tankLeft/RightControls ne objašnjava otpuštanje ni Esc; nema Touch adaptera. [levi](../scenes/tenkici/TenkLevo.js#L34), [desni](../scenes/tenkici/TenkDesno.js#L36), [okidanje](../scenes/tenkici/Tenk.js#L91) |
| U | Potezi; W/S ugao, držanje Space puni, otpuštanje puca; oba čoveka koriste iste tastere. Esc pauza | Samo W up/S down/Space shoot; prva najava objašnjava puštanje; nema toucha. [potezi](../scenes/ustanak/Main.js#L154), [top](../scenes/ustanak/Top.js#L145) |
| I | WASD/strelice; Space drži paljbu, C luping/V bomba jednom po novom pritisku | Opis odgovara ulazima; touch 💥/➰/💣. [ulazi](../scenes/vis/Avionce.js#L20), [ivice pritiska](../scenes/vis/Avionce.js#L105) |
| K | Smerovi menjaju gas/visinu; Space mitraljez dok se drži; Enter bomba na novi pritisak | base + Machine gun/Drop bomb; touch 💥/💣, special ovde nije V. [bomba](../scenes/franjo-kluz/Potez.js#L31), [obrada](../scenes/franjo-kluz/Potez.js#L110) |
| W | Smerovi kretanje aviona; Space ponavlja bacanje uz čekanje između projektila | Space attack i 💣 attack; nije isti napad kao Vis. [Warplane](../core3d/aircraft/Warplane.js#L16) |
| J | Levo/desno ili A/D bočni potisak, dole/S vertikalni potisak; gore/W bez radnje; držanje troši gorivo | Poseban opis bez Esc; touch četiri strelice, uključujući beskorisnu gornju. [Lander](../scenes/moon-landing/Lander.js#L64) |
| Z | Smerovi dirigibl, PgUp/PgDn brzina; pointerdown na dugmetu menja kameru | Opis odgovara, ali bez Esc; touch nema brzinu. [Airship](../core3d/aircraft/Airship.js#L152), [kamera](../core3d/actor/ChaseCamera.js#L75) |
| O | OrbitControls: levi miš obrtanje, srednji/točkić približavanje, desni pomeranje; jedan prst obrtanje, dva približavanje/pomeranje, osim lokalnih ograničenja; bez keyboard kretanja igrača | Neke scene ipak imaju base opis. [konfiguracija](../core3d/helpers.js#L9); [lokalni miš](../libs/three/examples/jsm/controls/OrbitControls.js#L99), [touch](../libs/three/examples/jsm/controls/OrbitControls.js#L102); gestovi nisu izvršeni u browseru |
| P | Mousemove nišanjenje i click gađanje, bez tastaturne zamene | Neretva bez opisa, Otpisani ima base; koordinate ne prati touchmove. [koordinate](../core/io/mouse.js#L32), lokalni handleClick |
| D / L / N | D pointerdown menja grad; L pointermove usmerava glavu; N nema komandu sadržaja | Dark ima poruku, Lookat je dekoracija bez pauze, Flying space ipak nasleđuje base; Main izvori ispod |


Modeli i izvori konkretnih sposobnosti: [Barbarian](../core3d/actor/derived/fantasy/Barbarian.js#L6), [Sorceress](../core3d/actor/derived/fantasy/Sorceress.js#L7), [Witch](../core3d/actor/derived/fantasy/Witch.js#L5), [Demon](../core3d/actor/derived/fantasy/Demon.js#L5), [Golem](../core3d/actor/derived/fantasy/Golem.js#L5), [Partisan](../core3d/actor/derived/ww2/Partisan.js#L5), [Worker](../core3d/actor/derived/ww2/Worker.js#L5), [ResistanceFighter](../core3d/actor/derived/ww2/ResistanceFighter.js#L5).

**Ruke i raspored:** WASD leva ili strelice desna; Space palac, C/V uz WASD, Enter desno. Tenkici 2P deli dve grupe između ljudi; Ustanak 2P deli istu grupu po potezima. Q/E i Pg alternative dodatno daju strafe. Ovo ne meri udobnost ni istovremene tastere/ghosting; fizička tastatura i njen jezički raspored ostaju za upotrebu uživo.

#### Pregled svake scene

Svi redovi su analiza izvora; nijedan nije potvrđen u browseru. Profil gore daje stvarne komande, a kolona opis beleži njihov prikaz. Zajednički pauza/podešavanja/greška tok važi svuda osim dekorativnog disableEvents. „Nema lokalnog ishoda” ne isključuje testni poziv zajedničkog defeat. Zdravlje i kamera preko igrača navode se odvojeno od sceneUI.

| Scena i izvor | Start / stil | Profil / opis komandi | HUD / lokalni ishod | Posebnosti |
|---|---|---|---|---|
| [3d-tank](../scenes/3d-tank/Main.js#L23) | standard + izveštaj / simple | V; base + Space break | blokovi i vreme; pobeda | Nema pucanja tenka |
| [avatar](../scenes/avatar/Main.js#L45) | izbor tri avatara / rpg | A; base + Space | poeni, coins left, zdravlje; pobeda/poraz | STONE/DISCO/LAVA; poruke o novčićima i lavi |
| [avatar-planets](../scenes/avatar-planets/Main.js#L12) | nema / simple | A; avatarControls | nema HUD-a ni lokalnog ishoda | DISCO let; opis Space jump |
| [bunker](../scenes/bunker/Main.js#L15) | standard / simple | M; base | vreme; pobeda/poraz | Dolazak do bunkera; nema oružja na Enter |
| [camac](../scenes/camac/Main.js#L14) | nema / simple | B; base bez Down + Space shoot | nema scene HUD-a; pobeda/poraz | Borba i iskrcavanje postoje i bez startnog prozora |
| [cannon](../scenes/cannon/Main.js#L17) | standard / rpg | C; lokalni Mouse down/up | blokovi, municija, snaga; pobeda/poraz | Opis ne prikazuje Esc |
| [capoeira-girl](../scenes/capoeira-girl/Main.js#L11) | nema / simple | G; opis isključen | zdravlje; nema lokalnog ishoda | Kicks panel: osam udaraca, Full version; lokalni CSS |
| [city-colorful](../scenes/city-colorful/Main.js#L11) | nema / simple | O; base | nema HUD-a ni lokalnog ishoda | OrbitControls/autorotacija, opis ne opisuje kameru |
| [dark-city](../scenes/dark-city/Main.js#L11) | nema / simple | D; opis isključen | poruka; nema lokalnog ishoda | Click to morph city |
| [demon-forest](../scenes/demon-forest/Main.js#L10) | nema / simple | G; base + Space | zdravlje; nema lokalnog ishoda | Enter i V nisu u opisu |
| [drvar](../scenes/drvar/Main.js#L28) | nema / simple | O; opis isključen | nema HUD-a ni lokalnog ishoda | Ograničeno orbit obrtanje |
| [flying-through-space](../scenes/flying-through-space/Main.js#L5) | nema / simple | N; base | nema HUD-a ni lokalnog ishoda | Animirana prezentacija bez igrača, ipak dobija opis smerova |
| [follow](../scenes/follow/Main.js#L14) | standard / rpg | G+O; base | pratioci, vreme, zdravlje; pobeda/poraz | Opis ne navodi napade/skok/run; OrbitControls za pregled |
| [fps-airport](../scenes/fps-airport/Main.js#L24) | standard + izveštaj / simple | F; fps bez Esc | poeni, avioni, zdravlje i FPS prikaz; pobeda/poraz | Pointer lock; razlog skrivanja Esc nije zapisan |
| [fps-base](../scenes/fps-base/Main.js#L21) | standard + izveštaj / simple | F; fps | poeni, neprijatelji, zdravlje i FPS prikaz; pobeda/poraz | Pointer lock, Esc u opisu |
| [franjo-kluz](../scenes/franjo-kluz/Main.js#L31) | standard iz init / simple | K; base + Space/Enter | municija i bombe gore levo; pobeda/poraz | Aktuelni HUD koristi sliku metka iz Bullet.src i 💣; poruka o aerodromu; pre izmene proveriti radnu kopiju |
| [graffiti-city](../scenes/graffiti-city/Main.js#L88) | nema / simple | G; thirdPerson | nema HUD-a ni lokalnog ishoda | Worker bez jump klipa, opis ipak navodi Space jump |
| [graffiti-city-maze](../scenes/graffiti-city-maze/Main.js#L78) | nema / simple | G; thirdPerson | nema HUD-a ni lokalnog ishoda | Bez kartice u meniju; isti Worker i opis |
| [graveyard-survival](../scenes/graveyard-survival/Main.js#L33) | prilagođeni Start / rpg | G; thirdPerson | zombiji, vreme, zdravlje; pobeda/poraz | C nije u opisu; Sorceress nema touch jump |
| [led-city](../scenes/led-city/Main.js#L13) | nema / simple | A; base + Space | nema HUD-a ni lokalnog ishoda | Run nije opisan |
| [liberated-city](../scenes/liberated-city/Main.js#L63) | nema / simple | G; thirdPerson | nema HUD-a ni lokalnog ishoda | ResistanceFighter bez jump klipa, opis ga navodi |
| [locomotive](../scenes/locomotive/Main.js#L13) | nema / simple | O; base | nema HUD-a ni lokalnog ishoda | OrbitControls, opis ne opisuje kameru |
| [lookat-cursor](../scenes/lookat-cursor/Main.js#L28) | nema / simple | L; opis isključen | nema HUD-a ni lokalnog ishoda | 250×250 dekoracija menija; disableEvents; i direktna ruta |
| [minas-tirith](../scenes/minas-tirith/Main.js#L15) | nema / simple | G; base | zdravlje; nema lokalnog ishoda | Golem ima Enter/C koji nisu opisani |
| [moon-landing](../scenes/moon-landing/Main.js#L19) | standard Start / white | J; lokalni potisak | poeni, gorivo; pobeda/poraz | Gore prazan opis i nema radnju |
| [neretva](../scenes/neretva/Main.js#L12) | standard / simple | P; opis isključen | poeni, vreme, zdravlje; pobeda/poraz | Klik nema filter faze ni UI mete |
| [otpisani](../scenes/otpisani/Main.js#L10) | standard / simple | P; base | lokalni poeni i zdravlje; poraz | Opis smerova ne opisuje gađanje |
| [physics-vehicle](../scenes/physics-vehicle/Main.js#L14) | nema / simple | V; base + Space brake | nema HUD-a; poraz pri prevrtanju | Naknadno dodat odobren opis kočnice; browser provera čeka |
| [ranjenik](../scenes/ranjenik/Main.js#L12) | standard / simple | M; base | nema HUD-a; pobeda/poraz | Rotacija i vožnja; prelaz između dve pozadine |
| [rpg-fantasy](../scenes/rpg-fantasy/Main.js#L28) | prilagođeni Start / rpg | G; thirdPerson | poeni, orci, zdravlje, kamera; pobeda/poraz | C/V nisu opisani; Start koristi game-title |
| [ruins](../scenes/ruins/Main.js#L11) | nema / rpg | G; base | zdravlje; nema lokalnog ishoda | Witch Enter/C/V nisu opisani |
| [spomenici](../scenes/spomenici/Main.js#L12) | nema / simple | G; thirdPerson | zdravlje; nema lokalnog ishoda | Partisan, razgledanje bez lokalnih uslova kraja |
| [tenkici](../scenes/tenkici/Main.js#L24) | izbor 1P/2P / simple | T; tankLeft + desni u 2P | dva zdravlja; pobeda/poraz | Desni opis dole desno samo u 2P; nema touch adapter |
| [to-trieste](../scenes/to-trieste/Main.js#L20) | standard / simple | T; tankLeft | lokalni poeni i zdravlje; pobeda/poraz | Samo levi tenk; nema touch adapter |
| [ustanak](../scenes/ustanak/Main.js#L36) | izbor računar/2P / simple | U; W/S/Space | dva zdravlja, snaga, rezultat; runda i pobeda/poraz | Oba ljudska poteza ista grupa tastera; posebne najave poteza |
| [vis](../scenes/vis/Main.js#L36) | izbor četiri aviona / simple | I; base + Space/C/V | poeni, srca, bombe, lupinzi, boss bar; pobeda/poraz | Slike imaju alt; sve lokalne sposobnosti posebno |
| [walls](../scenes/walls/Main.js#L11) | standard / rpg | G; avatarControls | vreme i zdravlje; pobeda | Enter/C nisu u opisu; Sorceress bez touch jump |
| [warplane](../scenes/warplane/Main.js#L40) | izbor pet aviona / simple | W; base + Space attack | poeni, vreme; pobeda/poraz | Slike bez alt; model se učitava tek po izboru |
| [zeppelin](../scenes/zeppelin/Main.js#L24) | nema / rpg | Z; lokalni smerovi/Pg | kamera; nema scene HUD-a ni lokalnog ishoda | Touch nema promenu brzine, opis nema Esc |

#### Nalazi izvora — dokaz za planirane korake

1. **Visok značaj — tasteri igre presreću UI.** [Keyboard](../core/io/Keyboard.js#L4) otkazuje Enter/Space/strelice/Page tastere bez obzira na target, uključujući dugmad i Volume range; singleton sluša i pre početka igre. [Controls](../ui/Controls.js#L82) ima samo pointerup, [kamera](../core3d/actor/ChaseCamera.js#L82) samo pointerdown, Touch samo pointer događaje. Potvrđeno je odsustvo njihovog tastaturnog click puta; konkretno ponašanje native dugmeta/range-a proveriti sa Tab/Enter/Space/strelicama. Pogađa zajednički UI i pristup samo tastaturom.
2. **Visok značaj — direktni događaji nisu zaključani modalom ili pauzom.** [Neretva](../scenes/neretva/Main.js#L46) nema proveru sesije ni UI mete; [Otpisani](../scenes/otpisani/Main.js#L40) filtrira button, ali ne input ni paused/ready stanje. Dark city i Capoeira proveravaju [active](../core/runtime/GameSession.js#L34), što znači samo „nije disposed”. Kod dopušta poziv handlera izvan running faze; stvarni pogodak i vidljiv efekat zavise od stanja/koordinata i zahtevaju browser. Cannon je drugačiji: filtrira UI mete i stanje petlje/ishod.
3. **Srednji značaj — netačni/nepotpuni opisi.** Camac je naknadno dobio Space shoot i izostavljen je nefunkcionalni Down iz uputstva (bez browser provere); Physics vehicle je naknadno dobio odobren opis kočnice (bez browser provere); RPG C/V, Ruins/Minas napade, Follow/Walls Enter/C. Levi Shift je namerno skriven po [odluci vlasnika](UI.md#skrivena-precica-za-trcanje), pa njegov izostanak iz opisa nije propust; PageUp/PageDown su takođe namerno skriveni po [odluci vlasnika](UI.md#skrivene-precice-za-bocno-kretanje), uz javni Q/E opis. Worker i ResistanceFighter bez jump klipa imaju ANIM_JUMP, a opis obećava Space jump. Dokazi su profili i per-game izvori; razdvojiti ulaz koji kontroler čita od korisne sposobnosti konkretnog lika.
4. **Srednji značaj — touch nije ekvivalent tastature.** [Input](../core/io/Input.js#L9) bira tastaturu prema hasMouse, joystick prema isTouchScreen. [Akcije](../core/io/Touch.js#L90) ne zavise od useJoystick i zato mogu ostati na desktopu. Nema run/strafe, kočnice vozila ni brzine Zeppelina. Sorceress ima leteći skok, ali nema jump u animDict pa touch dugme izostaje. Prazna vrednost daje default simbol, ne skriva dugme. Tenkici/Ustanak/To Trieste nemaju touch adapter, FPS isključuje joystick.
5. **Srednji značaj — touch nema zajednički pristup pauzi.** [Esc](../core/Scene.js#L159) i PausePolicy su ulaz u pauzu; Touch nema pause dugme, a opisi su podrazumevano skriveni na touch uređajima. Treba proveriti kako korisnik dolazi do podešavanja/replay-a/menija. Sakrivena coarse/no-hover kartica nije zabrana direktne rute. Ovo nije predlog novog dugmeta bez razgovora.
6. **Srednji značaj — Esc nije svuda isto što i Main menu.** Tokom igre otvara pauzu; tokom pauze petlja ne obrađuje ulaz. [UI handler](../ui/UI.js#L64) nema Escape, [meni](../scenes/main.js#L123) je click akcija. Komentar i tekst pravila ne dokazuju stvarnu ekvivalentnost. Native dialog ima zaseban cancel. Potrebno razjasniti nameru u razgovoru.
7. **Srednji značaj — modalnost i fokus nisu zajednički.** Samo Arcade ima native dialog/showModal. [Drugi prozori](../ui/UI.js#L87) su HTML bez dialog uloge, inert pozadine, premeštanja fokusa na dugme ili focus trap-a; start/continue fokusiraju canvas. Stvaran Tab redosled i pristup pozadini nisu provereni. Ne izvodi se odluka o biblioteci ili preradi.
8. **Srednji značaj — uski ekrani su neprovereni.** Min-width prozora 320px, nema opšteg max-height; izveštaj troši dodatnu visinu. Progress min-width 210px, touch z9 naspram prozora z1; više donjih i gornjih elemenata može se preklopiti. Samo Vis ima svoj scroll. Ovo su rizici CSS-a, ne izmerena preklapanja.
9. **Srednji značaj — reset ulaza se razlikuje.** [Keyboard](../core/io/Keyboard.js#L56) briše pritiske na blur/visibility, ali privatno CapsLock stanje osvežava sledeći keyup. Touch ima pointerup/leave/cancel, nema blur/visibility reset ni evidenciju pointerId. Povratak iz taba i dva dodira istog dugmeta traže stvaran pregled; nije potvrđeno zaglavljivanje na uređaju.
10. **Srednji značaj — naplata i kasno učitavanje.** Ruter još naplaćuje sve rute pre učitavanja; replay ponavlja ulaz i kod scena sa startom prikazuje ga opet. [Warplane](../scenes/warplane/Main.js#L70) i [Avatar](../scenes/avatar/Main.js#L86) tek po izboru učitavaju model, Vis takođe čeka selectAircraft. Dakle, „učitano pre Start-a” nije garancija da posle naplate nema greške učitavanja. Zaštita od naplate neuspele/nevažeće partije ostaje uslov UI-05; ovde se ne bira rešenje niti menja odluka vlasnika.
11. **Niži značaj — ikonice i oznake imaju više značenja.** Default attack 🗡️, pucanje/udarac 💥, Warplane 💣; bomba Vis V, Kluz Enter. Start/Continue 🔥, replay ↻, menu ☰. Različito značenje nije samo kopija simbola. Avatar/Warplane slike za izbor nemaju alt, Vis ima. Jezici i Start mission/Start/Press to START nisu ujednačeni; nalaz ne odobrava novi tekst.
12. **Niži značaj — poruke i ishodi imaju različit životni ciklus.** Standardni zidni timer teče i dok je postojeća poruka skrivena pauzom, a nova tokom modala se odbacuje. Ustanak koristi gameplay sat. Scenama bez prirodnog ishoda ne treba prećutno dodati kraj samo zato što zajednički renderer postoji.

<a id="ui-execution-checks"></a>
#### Nepotvrđeno izvršavanjem

Pregled izvora UI-00 je završen. Sledeći izvršni scenariji ostaju obaveze odgovarajućih koraka i UI-04; nisu pokrenuti niti se predstavljaju kao prolazni. Browser/test dozvola ostaje zasebna od završene analize.

- Sve primenljive scene: prirodan početak/ishod, pauza/nastavak/podešavanja/menu/replay, konzola i mreža; dekoracija kao deo menija i posebna direktna putanja. Forsirani testni defeat ne dokazuje prirodan ishod.
- Svaka opcija svih sedam prilagođenih startova: tri avatara, pet Warplane modela, četiri Vis aviona, Tenkici/Ustanak 1P/2P, oba prilagođena Start-a. Kluz proveriti na konačnoj radnoj kopiji.
- Planirane dimenzije: 1280×800, 320×568, 390×844 i 844×390; promena veličine i orijentacije u toku. To nisu izvršena merenja. Posebno izveštaj, dupli health bar, 2P opisi, izbori, kamera uz touch, prelivanje dugmadi, kontrast i čitljivost simbola.
- Tab/Shift+Tab, Enter/Space na dugmadima, strelice na Volume; Esc na startu/pauzi/podešavanjima/ishodu/grešci. Korišćenje UI-ja ne sme usput gađati; proveriti fizički raspored, alternativne tastere, dve osobe, CapsLock, ponavljanje i blur/tab povratak.
- Touch za sve lokalne profile: dva istovremena smera/akcije, pointercancel, povratak iz taba, pristup pauzi/meniju; Neretva/Otpisani bez prethodnog mousemove. Emulacija nije fizički uređaj niti potvrda ghostinga tastature.
- Ustanak između rundi i posle nastavka; tajmeri poruka u pauzi; brza navigacija i neuspeh modela učitavanog tek po izboru.

[Flow](../tests/smoke/flow.spec.js#L39) forsira poraz i proverava zajednički tok, ne prirodan ishod; [phone](../tests/smoke/phone.spec.js#L13) funkcionalno pokriva Warplane/Moon landing/Cannon. [Keys test](../tests/unit/keys.test.js#L87) čuva postojeći tekst, ne dokazuje da je potpun; [Touch test](../tests/unit/touch.test.js#L5) proverava kameru/razmak, ne sve akcije i reset. Nijedna od tih provera nije pokrenuta u UI-00.

**Preostale odluke:** PD-2–PD-4 na vrhu plana; PD-1 je potvrđen, a utvrđene tehničke činjenice ne otvaraju se ponovo kao pitanja vlasniku. UI-01 čeka te konkretne odluke.

**Otisci radne kopije za paralelno menjanu igru:**

- `scenes/franjo-kluz/Main.js` SHA-256 `9b89341aa978a5f289e275c0cd5cd3e5112afda5af0948ee4c518bbc38374300`.
- `scenes/franjo-kluz/Potez.js` SHA-256 `7a609dc9ed7460e6f3d714a4fa0918fdac6b3b19aa5c096a866d26e80cf1ab55`.

<a id="ui-js-analysis"></a>
### 2. Posebna analiza UI.js — 2026-11-20

**Obim:** [ceo UI.js](../ui/UI.js#L1), direktni pozivaoci u Scene/SceneManager/ruteru/Ustanku, vezani Report/styles/settings i postojeći testovi. Analiza izvora, bez menjanja produkcionog koda i bez izvršavanja testova ili browsera. Revizija kao u analizi UI-00; otisak samog UI.js ispod identifikuje pregledanu verziju. Analiza ne odobrava novi izgled niti potvrđuje ispravku; njeni potvrđeni propusti sada imaju sprovođenje u UI-06.

#### Uloga i granice

UI.js je adapter između scene i zajedničkog DOM-a: čuva lokalno stanje prikaza, sastavlja HTML, priključuje događaje i pravi poruke/opise/zvukove. **Ne odlučuje kada je igra pobedila, ne pokreće petlju sam, ne naplaćuje i ne učitava scenu.** Start/Continue vraća kroz callback sceni; Main menu/Play again obrađuje ruter, a posebne izbore sama igra. Nije dovoljan pregled samo ove datoteke da bi se dokazao kompletan klik od dugmeta do partije.

| Deo | Odgovornost / podatak | Veza i bitno ograničenje |
|---|---|---|
| mainMenuButton | Zajednički HTML dugmeta sa id menu | [helper](../ui/UI.js#L12) samo crta; [ruter](../scenes/main.js#L43) obavlja navigaciju. Komentar o Esc nije njegova implementacija |
| draw / erase / drawnBy | #ui i #modal imaju zabeleženog poslednjeg UI vlasnika; erase briše samo svoj sadržaj | [vlasništvo](../ui/UI.js#L14) štiti sledeću scenu od kasnog end stare. Ne proverava prava na svaki novi upis; direktni upisi rutera ne menjaju tu mapu |
| constructor | Postavlja globalni stil, čuva scene/intro/customStartScreen/callbacks; pravi tri zvuka, message element i opcioni Controls | [konstruktor](../ui/UI.js#L28). #ui/#modal traže se jednom pri importu; vezanost za projektnu stranicu je postojeća arhitektonska odluka, ne SSR kvar |
| handleScreenClick | Delegira start/continue; settings/settings-back zamenjuju HTML | [handler](../ui/UI.js#L64); listener se dodaje samo ako postoji onStart ili onContinue. Scene ih daje za obične scene, disableEvents ne; sam UI bez oba callback-a nema ni navigaciju Settings kroz click |
| handleScreenInput | volume pretvara procente u 0–1 i predaje setVolume | [handler](../ui/UI.js#L72), [settings](../ui/settings.js#L30); bez prisilnog rendera pri svakom pomeranju slidera. Uslov je id, ne provera vlasništva ili vrste elementa |
| clear | Uklanja svoj HUD i skriva ekran | [clear](../ui/UI.js#L76); ne resetuje cachedSceneUI. U produkcionom kodu poziva se iz end, ne koristi se za nastavak iste igre |
| clearIntro | Briše intro tekst, skriva ekran i zaustavlja kucanje report-a | [clearIntro](../ui/UI.js#L81); ne briše customStartScreen ni reportText, nije opšti reset instance |
| showScreen / hideScreen | screen ime, HTML u #modal, vidljivost poruke | [prikaz](../ui/UI.js#L87); nema promene sesije, provere dozvoljenog prelaza, upravljanja fokusom ili zaštite ended na samom upisu |
| startScreen / escModal / settingsScreen / endScreen | Prave HTML sa trenutnim klasama; ne čitaju input niti pokreću igru | [šabloni](../ui/UI.js#L99). customStartScreen dobija klase umesto standardnog šablona; intro/outro/tekstovi su HTML, ne automatski escapovan plain text |
| renderStartScreen | Prikazuje start; opciono pravi i vezuje Report uz audio sesiju | [metod](../ui/UI.js#L150); očekuje id start-screen kada postoji reportText. Nije zaštićen od višestrukog pravljenja report-a na istoj instanci |
| showPauseScreen | Otvara pauza šablon | [prikaz](../ui/UI.js#L159); stvarnu pauzu pre toga radi Scene.pause |
| showDefeatScreen / showVictoryScreen | Pušta odgovarajući zvuk, pravi outro HTML i prikazuje end | [poraz](../ui/UI.js#L163), [pobeda](../ui/UI.js#L171); prvu odluku o ishodu čuva Scene kroz proveru outro, zatim finish sesije |
| scoreUI | Vraća HTML primarnog/sekundarnog brojača u gornjem levom uglu | [šablon](../ui/UI.js#L179); ne poseduje bodove; nula sekundarnog brojača ostaje prikazana kada postoji subtext |
| showMessage | Prikazuje HTML poruku ako nije ended i nema aktivnog ekrana; raspoređuje nestanak | [metod](../ui/UI.js#L190); zidni timeout 3s, identitet poruke je sam tekst |
| end | ended=true, uklanja dva svoja listenera, briše svoj sadržaj, uklanja message, zaustavlja report i Controls | [gašenje](../ui/UI.js#L206); ne otkazuje message timeout. UI zvukove u stvarnom toku gasi SceneAudio pre UI.end, pa njihovo odsustvo stop poziva ovde nije samo po sebi curenje |
| render | Svaki frame zove sceneUI(t); samo promenjeni HTML upisuje u #ui | [render](../ui/UI.js#L216); sprečava nepotrebnu DOM zamenu, ali nije granularno ažuriranje. Danas HUD nema sopstvene interaktivne inpute koje bi trebalo čuvati |

#### Stanje i tok događaja

| Tok | Vlasnik i redosled | Šta UI stanje stvarno znači |
|---|---|---|
| Priprema | Scene pravi UI; init može postaviti intro; SceneManager čeka resurse i odlučuje da li ima start | [hasStartScreen](../core/Scene.js#L84) zavisi od trenutnog intro/customStartScreen, ne od nepromenljive osobine igre |
| Početak | Klik → UI onStart ili lokalni izbor → Scene.start → petlja/sesija/audio → clearIntro → fokus canvas/pointer lock | [Scene.start](../core/Scene.js#L102); posle ovoga standardni intro je prazan. Zato hasStartScreen posle početka nije pouzdana oznaka cene/originalnog toka igre za UI-05 |
| Pauza i Settings | Scene.pause zaustavlja simulaciju i otvara UI; Settings ostaje screen='pause'; Back vraća pauza šablon | [prelazi](../ui/UI.js#L68). screen ne razlikuje pause od settings; komentar koji nabraja start/pause/end ne pokriva ni round koji Ustanak koristi |
| Nastavak | Continue → onContinue → Scene.unpause → UI.hideScreen → fokus canvas | [nastavak](../core/Scene.js#L145); hideScreen sam ne nastavlja petlju. Ustanak unpause po potrebi vraća rezultat runde |
| Ishod | Scene.victory/defeat proverava outro, UI iscrtava ishod, Scene.finish završava gameplay | [ishod](../core/Scene.js#L214); outro je istovremeno HTML i logički marker koji koriste igre. Sam UI.showVictoryScreen ne završava partiju |
| Poruka uz prozor | showScreen skriva postojeću poruku; showMessage tokom ekrana vraća se bez čuvanja; hideScreen otkriva preostalu | Skrivena poruka nije u redu čekanja. Timeout može isteći dok je skrivena; poruka zatražena za vreme pauze nikada nije primljena |
| Promena scene | Stara scena se gasi pre stvaranja nove; zaštita drawnBy važi i ako stari end stigne ponovo posle nove scene | [manager](../scenes/SceneManager.js#L39), [postojeći test](../tests/unit/Scene.test.js#L258); odloženi novi upisi moraju imati sopstvenu zaštitu |

**Stil i markup:** šabloni ne čuvaju sopstvenu kopiju stila; čitaju globalni currentStyleClasses. To odgovara pravilu jedne aktivne scene, ali kasni poziv stare instance nije nezavisan od nove teme. Intro/outro/showMessage namerno primaju HTML (postojeći tekstovi koriste br/ul); nije nađen spoljašnji nepouzdan tekst koji ovde uvodi potvrđenu XSS putanju. Ne proglašavati innerHTML sam po sebi bezbednosnim nalazom niti ga menjati u textContent bez provere potrošača.

<a id="ui-js-defects"></a>
#### Potvrđeni propusti iz izvora

1. **UI-M1 — ista poruka može biti uklonjena prerano.** [Provera tajmera](../ui/UI.js#L200) poredi tekst, ne konkretan zahtev. Iz koda sledi sled: poruka A u t=0, nova A u t=2; stari timeout u t=3 vidi isti tekst i briše novu poruku posle samo jedne sekunde. Isto važi za A → B → A pre isteka prvog tajmera. Poziv sa drugačijim tekstom je zaštićen; ponovljeni tekst nije. [Avatar lava](../scenes/avatar/Main.js#L127) poziva isti tekst iz update-a, pa ovo nije samo nepostojeći API scenario. Izvedeno iz koda, nije izvršeno. Minimalni kriterijum buduće provere: novi isti tekst i A/B/A imaju puna svoja tri sekunda od poslednjeg zahteva; završetak stare poruke ne menja novu.
2. **UI-R1 — zaustavljen Report zadržava odloženo dodavanje u DOM.** UI.renderStartScreen pravi Report koji [raspoređuje](../ui/Report.js#L40) prepend kroz setTimeout(1ms), tražeći kontejner tek pri izvršenju. [stop](../ui/Report.js#L103) gasi interval kucanja i audio, ali ne i taj timeout. Ako se start ukloni ili igra promeni pre callback-a, on može dobiti null i baciti grešku ili dodati stari papir u novi element sa istim id-em. Propust otkazivanja je potvrđen u vezanom modulu; reprodukcija vidljive posledice u browseru zavisi od tajminga. [Postojeći test](../tests/unit/UI.test.js#L89) čak čeka odloženo dodavanje posle stop, ali ne proverava promenu vlasnika. Minimalni kriterijum: kraj ili promena scene pre dodavanja ne piše u novi/uklonjeni kontejner i ne baca grešku.

Oba propusta imaju konkretno tehničko rešenje i kriterijume u UI-06/T-3. Njihovo izvršenje čeka nalog za korak, ne novu odluku o tajmerima ili izgledu; nijedan još nije ispravljen.

#### Ograničenja API-ja, bez potvrđene trenutne regresije

- **Cache posle clear:** clear ne resetuje cachedSceneUI; kada bi ista instanca posle toga ponovo renderovala isti HTML, HUD bi ostao prazan. Pretraga produkcionih pozivalaca nalazi clear samo kroz end, pa to nije prijavljen kvar današnjeg toka. Izdvojeno kao uslov ako se clear u budućnosti koristi za reset partije.
- **Gašenje nije opšta zabrana upisa:** samo showMessage proverava ended; showScreen/render/ishodi mogu pisati i posle end ako ih neko pozove. drawnBy štiti brisanje, ne uskrsavanje starog UI-ja. SceneManager i pojedini async izbori imaju svoje zaštite; nije utvrđen konkretan sadašnji pozivalac koji ovim putem prepisuje novu scenu.
- **Ponovljeni start nije slobodna operacija:** renderStartScreen ne zaustavlja prethodni Report pre pravljenja novog. Sada SceneManager prikazuje start jednom po instanci; reset/replay unutar iste instance tražio bi nov ugovor i proveru, nije automatski podržan; UI-05 zato pravi novu instancu i prenosi izbor kao podatak.
- **Callbacks i naplata:** UI ne čeka promise callback-a, ne zaključava Start i nema sopstveno busy/error stanje. Današnji standardni Scene.start je sinhron, posebni async izbori sami imaju choosing zaštite. To nije trenutna greška standardnog starta, a UI-05 zato uvodi pripremu i serijalizovan pokušaj izvan UI prikaza (T-1/T-6/T-7).
- **Report/custom start:** reportText zahteva element id=start-screen; customStartScreen ga ne dobija automatski. Danas report koriste standardni startovi; nije nađen postojeći spoj reportText sa prilagođenim šablonom bez tog id-a.

#### Postojeće zaštite koje treba sačuvati

- HUD i centralni prozor su odvojeni; redovan render HUD-a ne prepisuje pauzu/ishod, a nepromenjeni HUD ne menja DOM. [Postojeći test](../tests/unit/screens.test.js#L27) proverava tu granicu.
- drawnBy i pripadnost message elementa instanci štite novu scenu od brisanja starog UI-ja. Scene test pokriva i dupli kasni end; to nije razlog da se generalno tvrdi da su svi odloženi poslovi bezbedni.
- Listeneri se čuvaju kao stabilne metode i end uklanja svoje reference. [Test](../tests/unit/Scene.test.js#L284) proverava da start/continue više ne upravljaju ugašenom scenom.
- Zvukove poseduje sesija preko ui.sounds/audioChildren; [Scene.end](../core/Scene.js#L120) gasi audio pre UI-ja. Report zvuk može pre starta, pobeda/poraz posle finish, prema eksplicitnim audio pravilima.
- Nova poruka ne prekriva modal ili ishod; showMessage posle end se odbacuje. Ove zaštite ostaju validne uprkos UI-M1.

#### Pokrivenost i neizvršene provere

| Oblast | Šta postojeći izvori testova proveravaju | Šta ostaje nepokriveno ovim dokazom |
|---|---|---|
| Poruke | Različiti tekstovi, skrivanje iza pauze, neprekrivanje ishoda, stari timer ne briše novi modal, uklanjanje elementa | Isti tekst dvaput, A/B/A, timer istekao tokom pauze, trošak ponavljanja iz frame-a |
| Gašenje | stop report-a, uklanjanje listenera, kasni/dupli end, nova scena zadržava HUD/modal/canvas | Stvarni Report callback posle uklanjanja njegovog starta; kasni novi upis ugašenog UI-ja |
| Šabloni i stil | HTML i redosled dugmadi, tri teme, podrazumevana tema i prelaz između tema, bez fullscreen dugmeta | Stvarne dimenzije, fokus, kontrast, lokalni custom start i svaka opcija izbora |
| Podešavanja | Synthetic click/input menja i čuva volume, clamp i neispravan sadržaj skladišta | Native Tab/Enter/Space i range strelice uz globalni keyboard; stvarno odbijanje pristupa localStorage svojstvu |
| Integracija | Scene upravlja startom/nastavkom/ishodom, testni defeat i browser navigacioni scenariji postoje | Plaćanje na Start nije implementirano; nema dokaza prirodnog ishoda iz samo forsiranog testnog poziva |

Čitani su [UI testovi](../tests/unit/UI.test.js#L13), [screens](../tests/unit/screens.test.js#L18), [styles](../tests/unit/styles.test.js#L39), [Scene testovi](../tests/unit/Scene.test.js#L258) i pomoćni captureScreens. Nisu izvršeni. Ciljani budući regresioni scenariji su UI-M1 i UI-R1 iznad; ostale granice proveravati tek ako se konkretan API/tok menja. Za fokus i native tastere potreban je browser uz dozvolu.

**Otisak UI.js:** SHA-256 `a54c016eb9068dfaf80792b8b2af91eef2e9aca4d12fd40005d15430ee45d1cb`.
