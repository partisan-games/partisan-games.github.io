# Dokumentacija

Zahtevne operacije, naročito velike testne serije, buildovi i paralelni browseri, zahtevaju posebno izričito odobrenje pre pokretanja. Priprema za komit i ranija dozvola za ciljane testove ne daju tu dozvolu; unapred navesti obim i očekivano opterećenje.

Zajednička osnova za razvoj 2D i 3D igara, sa istorijski zasnovanim sadržajem.

## Gde pripada znanje

| Oblast | Autoritativno mesto | Sadržaj |
|---|---|---|
| Istorija | [Istorijski izvori](ISTORIJA.md) | Činjenice sa izvorima: vojske, periodi, područja, jedinice, vozila, avioni i oružje. |
| Konteksti igara | [KONTEKST](KONTEKST.md) | Okvir, priča, protivnici, prikaz i prihvaćeni art svake igre i njenih etapa. |
| Ugao 2D arta | [Indeks prikaza](../assets/images/armies/index.csv) | Vizuelne oznake za izbor bočnih, gornjih i drugih prikaza, uz same slike. |
| Art i sprite animacije | [ART](ART.md) | Resursi, stanja aktera, priprema, integracija, pozadine i tragovi rata koje raspoređuje agent uz pregled vlasnika. |
| Statistike modela | [STATISTIKE](STATISTIKE.md) | Brzina, masa, oklop, oružje i posada tenkova, vozila, aviona, brodova i topova, kao izvor za njihove vrednosti u kodu. |
| Arhitektura i obrasci | [ARHITEKTURA](ARHITEKTURA.md) | Odgovornosti zajedničkog engine-a, obrasci i bitna ograničenja. |
| UI | [UI](UI.md) | Principi, teme, prozori, HUD, komande i praktična upotreba postojećeg UI-ja. |
| Učenje kompozicije | [Kompozicija umesto nasleđivanja](COMPOSITION.md) | Uporedni primeri i sastavljanje zdravlja i oružja. |
| Provere | [TESTING](TESTING.md) | Komande, pokrivenost i ograničenja provera. |
| Isprobavanje blokova | [Storybook](STORYBOOK.md) | Upotreba storybook-a i dodavanje priča za blokove. |
| Posebna tehnika prikaza | [Animacija pozadine](ANIMACIJA-POZADINE.md) | Konkretno rešenje, neuspešni pristupi i preventivne provere. |
| Otvoreni poslovi i ideje | [PLAN](PLAN.md) | Jedini trajni plan, sa sekcijama za art, arhitekturu, Storybook i igre; čuva se u gitu i ne briše se. |

Pokretanje projekta opisuje [README](../README.md). Istorijske slike i poreklo čuvaju se u [references/ww2-yu](references/ww2-yu/), a merni artefakti se povezuju iz tehničkog opisa.

## Pojmovnik

Vlasnikovi nazivi i ono što znače u kodu. Ovde idu samo pojmovi koji se stvarno koriste u razgovoru, a nisu očigledni iz koda.

| Naziv | U kodu | Gde |
|---|---|---|
| Jablanica, Battle for Jablanica | Postojeća scena `cannon`; javna adresa je `#jablanica` | [Kontekst igre](KONTEKST.md#battle-for-jablanica) |
| Atom, gradivni blok | Samostalan deo od kog sastavljamo igre i svetove; nije naziv posebne klase | [Gradivni blokovi](ARHITEKTURA.md#gradivni-blokovi) |
| Akter, lik | Vojnik, vozilo, avion ili drugi učesnik: telo sa prikazom i dodeljenim upravljačem | [Gradivni blokovi](ARHITEKTURA.md#gradivni-blokovi) |
| Telo, prikaz, upravljač | [Body](../core/gameplay/bodies/Body.js) drži stanje i pravila; sprite/model ga prikazuje; kontroler iz `core/gameplay/controllers/` zadaje radnje | [ARHITEKTURA](ARHITEKTURA.md#gradivni-blokovi) |
| Osnovna stanja | Mirovanje `idle`, kretanje `move`, napad `attack`, smrt/uništenje `dead`; zajednički rečnik svih tela | [Standard stanja](ARHITEKTURA.md#standardna-stanja-aktera) |
| Pad, olupina | Kod [Poteza](../core/gameplay/bodies/aircraft/Potez.js) `falling` obuhvata pad i poleganje; završno `dead` ostavlja olupinu na tlu. Nije isto što i uklanjanje objekta | [Život objekta](ARHITEKTURA.md#stanje-vreme-i-život-objekta) |
| Atlas, sprite tabla; kadar | Slika sa mrežom poza/animacije; kadar je jedno polje, ne cela PNG slika | [Art i sprite animacije](ART.md) |
| Sidrište; linija oslonca | Tačka u kadru vezana za položaj objekta; linija po kojoj čizme, točkovi ili trup naležu na tlo | [Priprema arta](ART.md) |
| Tragovi rata, rekviziti bojišta | Olupine, poginuli i drugi zasebni elementi ambijenta; nisu nužno aktivni akteri niti ostaci nastali tokom partije | [Zasebni rekviziti bojišta](ART.md#zasebni-rekviziti-bojišta) |
| Priča, pozornica | Unos u `storybook/stories/`, `Stage2D`/`Stage3D` | [Storybook](STORYBOOK.md) |
| Avionče | [FighterBomber](../core/gameplay/bodies/aircraft/FighterBomber.js): Spitfire, Hurricane, Breguet 19 i Yak-1b | Vis |
| Kraljica | Bilo koji boss, glavni i najjači protivnik nivoa; u Visu He 111, [AttackPlane](../core/gameplay/bodies/aircraft/AttackPlane.js) vrste `boss` | Vis, Graffiti City |
| Bombaš (Žikica) | [Grenadier](../core/gameplay/bodies/soldiers/Grenadier.js) | Bunker |
| Kuća-bunker | [Bunker](../core/gameplay/bodies/artillery/Bunker.js) sa [mitraljescem](../core/gameplay/bodies/soldiers/MachineGunner.js) u prozoru | Bunker, Do Trsta |
| Okupator | [Occupier](../core/gameplay/bodies/soldiers/Occupier.js), nemački vojnik koji hoda i puca ka gledaocu | Otpisani |
| Nemac/Četnik spreda, ranije „u rovu” | [TrenchSoldier](../core/gameplay/bodies/soldiers/TrenchSoldier.js) sa odgovarajućim prikazom; [rov](../core/objects/Trench.js) je zasebna scenografija | Neretva; stare Storybook adrese ostaju važeće ([granice](STORYBOOK.md#granice-i-odluke)) |
| Partizanski/italijanski top | Isto telo [FieldGun](../core/gameplay/bodies/artillery/FieldGun.js) sa [prikazom topa](../core/actor/artillery/FieldGunSprite.js); [posada](../core/gameplay/bodies/soldiers/CannonCrew.js) je zaseban akter | Ustanak |
| Potez | [Potez](../core/gameplay/bodies/aircraft/Potez.js) | Franjo Kluz |
| Tenkić | [Tank](../core/gameplay/bodies/vehicles/Tank.js) kojim upravlja igrač; isto telo voze i neprijatelji | Tenkići, Do Trsta |
| Kamenko, Balonko, Laveni | Kože `STONE`, `DISCO` i `LAVA` u [Avatar.js](../core3d/actor/characters/Avatar.js) | Avatar |

## Kako zapisujemo znanje

HTML stranice čuvati van `docs`; iz dokumentacije voditi linkove do njih.

Osoba koja vodi projekat i daje naloge agentu u dokumentaciji se naziva vlasnik projekta.

Glavni principi: **bez dupliranja informacija** i **bez podataka koji brzo zastarevaju promenom koda i zahtevaju često ručno ažuriranje**.

Ne čuvati dnevnik vizuelnih dorada ni tekstualno prepričavanje već ugrađenih scena. Zadržati pravila, razloge važnih izbora i veze do pregleda ili izvornih podataka; otvoreni posao pripada planu.

Kanonsko javno ime igre čita se iz njene kartice u [glavnom indeksu](../index.html). Tehnički ID, folder i naziv klase mogu ostati stariji i kraći radi stabilnih adresa; ne koristiti ih kao ime igre u kontekstu, istoriji, planu, Storybook-u ili naslovima provera. Pre preimenovanja razlikovati javni naziv od tehničkih pojmova koji zaista označavaju predmet ili klasu, kao `Cannon.js` za model topa.

Jedna činjenica ili odluka ima jedno autoritativno mesto; ostali dokumenti vode link do njega. Dokumentujemo trajne odluke, razloge, ograničenja i istorijske izvore. Ne prepričavamo implementaciju: spiskovi klasa i metoda, potpisi API-ja, brojevi igara i testova i slični promenljivi podaci ostaju u kodu i alatima koji ih već prikazuju. Pišemo po temi, bez dnevnika završenih koraka i kopiranja celih planova.

Zapis čuvamo samo ako daje trajno znanje koje nije već dostupno na drugom mestu. Uz odluku navesti razlog i bitno ograničenje; uz istorijsku tvrdnju izvor i kontekst. Ako je merenje neophodno za razumevanje ograničenja, povezati dokaz sa datumom/revizijom, bez održavanja prepisa rezultata. Predloge i otvoren posao voditi isključivo u [PLAN](PLAN.md), a ne kao važeću arhitekturu ili TODO u matičnom dokumentu.

Istorijski zapis dodatno prati period, područje, korisnika opreme i varijantu; tehnički zapis prati vlasnika stanja, zavisnosti i životni ciklus. Detaljni obrasci su u odgovarajućim dokumentima. Postojeći art u `assets` ostaje istorijski prihvaćen prema [vlasnikovoj odluci](KONTEKST.md#prihvaćen-art-projekta).

Pre rada pročitati relevantnu istorijsku temu, arhitektonska pravila i ugovor sistema koji se menja. Posle rada ažurirati postojeći zapis; novu datoteku otvarati samo za samostalnu temu koja bi opteretila postojeću. Plan nije dokaz implementacije, a razvojni cilj nije tvrdnja da danas nema tehničkog duga.

Pri zatvaranju stavke iz [PLAN-a](PLAN.md) sačuvati samo korisne potvrđene odluke, nalaze i ograničenja u postojećem autoritativnom dokumentu, bez dupliranja. Potom ukloniti završenu stavku i njene nepotrebne beleške i uskladiti reference. Sam PLAN se nikada ne briše; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju. Nepokrenute provere ne predstavljati kao izvršene.

## Čistoća repozitorijuma

Odluka vlasnika, 2026-11-22: čuvamo ono što služi igri i daljem razvoju; repozitorijum nije arhiva istorije rada. Odbačene pokušaje, stare promptove, sirove odgovore alata, privremene zapisnike i duplikate ne zadržavati samo zato što su nastali tokom rada. Izvornici, skripte pripreme i metapodaci ostaju kada služe postojećem potrošaču ili konkretnoj razvojnoj potrebi; koristan podatak o poreklu ne zahteva zaseban fajl za svaki pokušaj.

Pre uklanjanja proveriti zavisnosti, a posle uskladiti skripte, metapodatke i veze u dokumentaciji. Korisne odluke, uzroke grešaka i ograničenja sažeti u postojećem autoritativnom dokumentu, bez čuvanja celog toka pokušaja. Istorijski izvori koji potkrepljuju sadržaj igre imaju svoju svrhu i nisu isto što i istorija rada agenta.

## Odobravanje UI elemenata

Svaki novi UI element zahteva prethodno izričito odobrenje vlasnika, uključujući brojače, tekstove, indikatore, dugmad i obaveštenja. Nalog za izmenu gameplay-a ili završetak plana sam po sebi ne odobrava dodavanje UI elemenata.

Isto važi za izmenu postojećih UI tekstova: uvoda, poruka, ishoda, natpisa dugmadi i opisa kontrola. Izuzetak je usklađivanje teksta sa promenjenim gameplay-om bez kreativnosti i bez novih termina (npr. uklonjen tenk iz uvoda, „refuel” kad goriva više nema): radi se odmah i javlja vlasniku. Sve ostalo čeka odobrenje; do tada stari tekst ostaje, a predlog se pokazuje vlasniku.

Za uputstva postojećih komandi važi dodatna odluka vlasnika: nedostajuće i netačne opise ispravljati automatski prema stvarnom kodu. Pitanje je potrebno kada dva tastera rade isto, a jedan je već naveden; skrivene prečice i granice ovog odobrenja opisuje [UI vodič](UI.md#komande-tastatura-i-touch).

Pravilo važi za sadržaj igara. Razvojne stranice za pregled, kao [ui.html](../ui.html) i `storybook.html`, nisu igra: agent sam bira njihove kontrole i tekstove, a vlasnik ih pregleda kad su gotove (odluka vlasnika, 2026-11-20).

Ni planirana mogućnost uključivanja/isključivanja opcije ne odobrava checkbox, indikator ili drugo UI rešenje. Pre izmene prikazati konkretan predlog i sačekati izričito odobrenje; do tada pripremiti samo logiku.

Uvodni tekst je kratak i ima formu jasnog vojnog naređenja: mesto i godina, pa zadatak vojnim izrazima, sa ciljem napada i objašnjenjem mesta koje igrač u svetu ne zna (uzor koji je vlasnik odobrio 2026-11-23: „Island of Vis, 1944. Your mission is to carry out a night amphibious assault on German positions on the island of Šolta and return safely to base.”). Uvodni ekran svakog nivoa ima samo dugme za početak (ili izbor načina igre), bez glavnog menija; tako je vlasnik odlučio. Redosled dugmadi na ostalim centralnim ekranima (pauza, podešavanja, runda, kraj, greška) je isti: gornje dugme vraća na glavni meni, a donje potvrđuje ili nastavlja igru. Dugme za glavni meni pravi zajednički `mainMenuButton` iz [UI](../ui/UI.js).

## UI stilovi

Autoritativni opis tema i potvrđenog korisničkog izbora je u [UI vodiču](UI.md#stilovi); odobravanje novih elemenata i tekstova ostaje uređeno pravilom iznad.

## Ulaz u igre i novčići

Odluka vlasnika od 2026-11-22: besplatni su sadržaji u grupama **3D Scenes** i **Animations**, uključujući direktan link i ponovno otvaranje. Scene i animacije gledamo, ne igramo: njihove kartice prikazuju **VIEW**, bez žetona i animacije njegovog ubacivanja; te grupe su označene sa `data-free`. Ako takva scena ima startni prozor, izričito koristi `free`, kao [Walls](../scenes/walls/Main.js). Dimenzija prikaza ne određuje naplatu: **3D Games** zadržavaju žetone prema istom pravilu kao 2D igre.

Odluka vlasnika od 2026-11-20: igre koje nemaju startni prozor ostaju besplatne i kreću odmah po učitavanju, bez dodavanja prozora za novčić ili starta. To važi i za direktan link, reload i ponovnu igru; dostupnost novčića i njihovog skladišta ne sme uslovljavati besplatnu igru.

Za naplative 2D i 3D igre sa startnim prozorom ostaje jedan prozor pre početka: Start ili izbor režima naplaćuje jedan novčić, a kartica u glavnom meniju ne naplaćuje. Kartica ipak zadržava izgled automata sa „INSERT COIN” (odluka vlasnika 2026-11-20); klik na nju samo otvara igru. Play again naplaćuje novu partiju i pokreće je sa istim prethodnim izborom, bez ponavljanja startnog prozora. Preskakanje tog prozora pri replay-u ne menja cenu igre. Cilj je manje klikova, uz jasno prikazanu cenu; konkretni novi natpisi i poruke i dalje traže prethodno odobrenje po pravilu iznad. Ovo je pravilo željenog ponašanja, ne potvrda da ga trenutni kod sprovodi.

## Tasteri

Načelno je Space skok kad lik skače, inače pucanje. Izuzeci su dozvoljeni, npr. kočnica 3D tenka i desni igrač za dvoje (Enter). Tasteri su u [keys.js](../core/io/keys.js).

## Pravilo za umetnost

Art i zvukovi su obavezan deo igre i planiraju se zajedno sa radnjom. Placeholder nije konačan art; pre izrade proveriti odgovarajuće postojeće resurse. Istorijski prihvaćen izvor nije automatski gotov crtež za igru.

Pripremu, kvalitet, poreklo, organizaciju resursa i povezivanje sa svim potrošačima održava [ART](ART.md). Pokretne slojeve i pauzu uređuje [animacija pozadine](ANIMACIJA-POZADINE.md); stilske i istorijske izbore pojedinačne igre njen [kontekst](KONTEKST.md). Ne kopirati te ugovore u svaki dokument.

## Jedan trajni plan

Otvoreni poslovi, nerešeni nalazi, ideje i preostali pregledi vode se isključivo u [PLAN](PLAN.md), po sekcijama. Ne praviti zasebne planove po oblasti ili igri i ne gomilati TODO stavke u matičnim dokumentima ili README-u. Nova oblast dobija sekciju u istom PLAN-u.

PLAN se čuva u gitu, nikada u lokalnom exclude-u, i ostaje i kada je prazan. Završene stavke i nepotrebne beleške uklanjaju se; važne potvrđene odluke prelaze u matičnu dokumentaciju. ID-jevi se ne koriste ponovo. Ne čuvati istoriju završenih poslova.

Statusi otvorenih stavki su `📋 TODO`, `🔄 In progress` i `⛔ Blocked`. Stavku ukloniti kada je dogovorena celina završena i potrebne provere izvršene ili izričito odložene; vlasnikov naknadni pregled nije uslov osim kada ga je tako postavio. Dokazi provera ostaju u TESTING; izvršne provere pokreću se u dozvoljenom obimu.
