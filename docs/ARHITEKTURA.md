# Arhitektura

Odgovornosti, ugovori i bitna ograničenja zajedničkog 2D/3D engine-a. Otvorene migracije su u [planu arhitekture](PLAN.md#arhitektura), provere u [TESTING](TESTING.md), a pravila arta i UI-ja u njihovim vodičima.

## Odgovornosti

| Deo | Odgovornost |
|---|---|
| [Runtime](../core/runtime/) | Sesija, satovi, opseg resursa i raspoređivanje simulacije. |
| [Gameplay](../core/gameplay/) | Pravila aktera, zdravlja i oružja, nezavisna od DOM-a, slike i scene. |
| [Sudari](../core/collision/) | Geometrija i prvi dodir duž putanje. |
| [2D prikaz](../core/actor/) | Sprite objekti, animacije, efekti i prikaz tela na platnu. |
| [3D osnova](../core3d/) | Modeli, animacije, prikaz i fizički adapteri. |
| [UI](../ui/) | Meniji, komande i prikaz stanja igre. |
| [Scene](../scenes/) | Sastavljanje nivoa, ulaz, protivnici, bodovanje i uslovi ishoda. |

Smer zavisnosti od nižeg ka višem je `runtime` → `gameplay/collision` → `io` → `ui` → `core` → `core3d` → `scenes`; dozvoljene uvoze štiti [lint](../eslint.config.mjs). Čista pravila ne zavise od prikaza, a 2D osnova ne zavisi od 3D koda. Engine koristi zajedničku stranicu i jednu aktivnu igru; prenosivost na proizvoljan HTML nije cilj.

Opšta komponenta ostaje u zajedničkom kodu i kada ima samo jednog korisnika. U sceni ostaju pravila konkretne igre. Prednost imaju mali saradnici sa uskim zavisnostima i poznatim ugovorom, prema [vodiču za kompoziciju](COMPOSITION.md); zajedničku apstrakciju ne uvoditi na osnovu prividne sličnosti.

## Gradivni blokovi

Akter čine telo, prikaz i upravljač koje sastavlja scena:

- **Telo** poseduje položaj, stanje, zdravlje, oružje i sudare. Zna šta ume; ne bira ulogu u nivou. Zavisnosti dobija kroz opcije, bez globalne scene, ulaza ili slike.
- **Prikaz** čita telo i poseduje sliku/model, animaciju, efekte i zvuk. Reaguje na stanje i brojače događaja; ne upisuje rezultate borbe u telo i ne traži pretplate na događaje tela.
- **Upravljač** bira komande igrača ili AI-ja preko javnog ugovora tela. Odluke o timu, metama, uzbuni, misiji i ishodu pripadaju sceni.
- **Scena** poseduje svet, projekciju, kameru, uređaje ulaza i UI. Daje akterima satove, mete i upite o okolini. Ne pravi paralelnu kopiju njihove logike.

Tela i prikazi organizuju se po vrsti aktera, upravljači zasebno; katalog aktera ne mora pratiti podelu klasa. Isti nezavisni akter može dobiti 2D i 3D prikaz. Blok se razvija kroz konkretan nivo, art, samostalan pregled i proveru, pa se dovršava zajednički ugovor. Smislena sposobnost dobija telo, prikaz i zvuk kada je zatraži igra ili odabrana ideja; ne dodavati neupotrebljene sposobnosti samo radi popunjavanja matrice.

Scenografija poput rova nije deo figure koju zaklanja. Oružje i stvarni delovi aktera jesu njegovi saradnici. Odvajanje koda ne dopunjava nedostajući crtež; ugovor pripreme je u [ART](ART.md).

### Standardna stanja aktera

| Stanje | Ugovor |
|---|---|
| `idle` | Živ akter ne izvodi zadato kretanje ili napad. Ne zaustavlja automatski fiziku i inerciju. |
| `move` | Izvodi kretanje svoje vrste: hod, vožnju, plovidbu ili let. |
| `attack` | Izvodi napad svoje vrste; kretanje može trajati istovremeno. |
| `dead` | Nepovratno je borbeno onesposobljen; nova instanca ili izričit reset vraćaju život. |

Kretanje, stav i radnja oružja ostaju odvojeni podaci. `walk`, `drive`, `fire` i slični nazivi mogu opisivati klip ili vrstu pokreta, a ne paralelna osnovna stanja. Nišanjenje samo po sebi ne ispaljuje projektil. Završen napad vraća `move` ako se akter i dalje kreće, inače `idle`.

Smrt ima prvenstvo: jednom prekida nove napade, upravljanje i punjenje. Pad, potonuće, već ispaljeni projektili i završni efekti mogu se dovršiti; `dead` nije isto što i uklonjen objekat. Dodatne radnje, poput nišanjenja, punjenja i reakcije na pogodak, imaju sopstveno vreme i pravila prekida. Ponavljanje istog stanja ne restartuje njegov sat.

Svaki akter izričito navodi podržana stanja. Nepodržana radnja odbija se bez lažne promene i animacije kada ne pripada ulozi, na primer napad nenaoružanog civila. Nedostajući kod ili art potrebne sposobnosti nije opravdanje za lažno proglašenu podršku. Podrška obuhvata stvarno ponašanje, odgovarajući prikaz i zvuk, gde ga radnja proizvodi.

Sva tela koriste ova imena direktno, bez prevodioca starih imena; novo telo ih preuzima od početka.

### Mere, projekcija i pogodak

[Telo](../core/gameplay/bodies/Body.js) koristi metre, sekunde i radijane, osu Y nagore i položaj u središtu svog sudarnog okvira. [Projekcija](../core/actor/projection.js) prevodi telo u bočni prikaz ili pogled odozgo; scena poseduje razmeru, telo i prikaz je ne izvode iz veličine prozora. Prihvaćena odstupanja veličine crteža ne ispravljaju se usputnom promenom sudara. Gravitaciju daje svet, a posebno ponašanje leta ili faktor gravitacije određuje dogovor igre.

Pogodak odlučuje telo/geometrija, ne nacrtani piksel ili mesh. Oblik mora pratiti orijentaciju, ogledanje i oslonac prikaza; fizika i crtež terena čitaju isti izvor podataka. Brzi projektil proverava ceo pomeraj i najraniji dodir, uključujući poluprečnik i zaklon. Nišan i projektil polaze iz položaja oružja, uz brzinu izvora i preticanje mete gde to model igre traži.

Kod 3D borbe telo koristi svetski položaj i upite scene za prepreke. Delovi modela imaju stvarnog vlasnika štete. Vozilo koje vodi Ammo zadržava fizički svet kao autoritet nad položajem; [adapter mete](../core3d/actor/characters/meshTarget.js) povezuje ga sa borbom, bez drugog vlasnika simulacije.

## Stanje, vreme i život objekta

[Sesija](../core/runtime/GameSession.js) razdvaja vreme borbe i vreme prikaza. Pauza čuva stanje i satove; posle ishoda završni efekti mogu trajati, a nova borba ne može. Spremno oružje nije samo po sebi dozvola za napad. Odloženi posao pripada sesiji ili životu objekta koji ga je pokrenuo, pa se ne prenosi na recikliranu instancu ili novu scenu.

[Svet](../core/World.js) poseduje ažuriranje aktera i saradnika; objekat koji je u svetu ne ažurira se još i ručno. Grafički roditelj, vlasnik simulacije i vlasnik gašenja mogu biti različiti. Jednokratni ulaz ne ponavlja se u više fizičkih podkoraka. Akumulator vremena i interpolacija imaju po jednog vlasnika; prikazani interpolirani položaj ne vraća se u autoritativno telo.

Borbena smrt, dodir tla, poleganje, prestanak blokiranja puta i konačno uklanjanje su različite faze. Trenje se računa prema terenu, a ne pomerenom ekranu. Završni oslonac i jednokratnost događaja važe i pri velikom vremenskom koraku. Ponovna upotreba objekta resetuje ceo život, bez starih pogodaka, efekata ili tajmera.

Efekat vezan za pokretni izvor razlikuje pomeraj izvora od sopstvene brzine čestica. Optimizacija i pool ne smeju promeniti putanje, broj, trajanje i redosled preživelih čestica. Rezultat se proverava pri mirovanju i kretanju izvora, bez prikrivanja greške deformacijom efekta.

## Učitavanje i resursi

- Scena je spremna tek kada su resursi učitani, inicijalizovani i prvi stalni prikaz nacrtan. Greška prekida učitavanje umesto beskrajnog čekanja; zakasneli rezultat ugašene scene ne menja novu scenu.
- [Keš modela](../core3d/assets/models.js) deli učitavanje i dopušta ponovni pokušaj posle greške. Otkazivanje jednog korisnika ne poništava resurs drugog. Dekodirana slika nije dokaz da je prvo crtanje jeftino; radni raster bira se prema veličini prikaza.
- Svaki slušalac, tajmer, zvuk, GPU i native resurs ima vlasnika i završnu operaciju. Uklanjanje iz prikaza nije oslobađanje resursa. Klon koji menja deljeni materijal ili geometriju prvo ih izoluje, a zajednički podatak ne oslobađa dok ga drugi koriste. Three.js r160 u senkama pamti teksturu poslednjeg objekta koji baca senku i šalje je ponovo u sledećoj 3D igri; zato je tekstura takvog objekta zajednička za sve ulaske u igru (kao beton tvrđave u Jablanici), a tekstura koju shader dobija kroz `onBeforeCompile` stoji i u `material.uniforms`, da je završetak igre oslobodi.
- Runtime objekte i njihove vlasnike ne stavljati u podatke prototipa koji se kopiraju JSON serijalizacijom. Grafičko roditeljstvo ne dokazuje ni vlasništvo nad memorijom ni redosled ažuriranja.
- [NativeAllocations](../core3d/physics/NativeAllocations.js) poseduje samo nove Ammo objekte sa podržanim destruktorom; reference iz gettera su pozajmljene. Pre oslobađanja odvojiti telo od sveta. Lokalni build ne oslobađa zaseban heightfield heap buffer i nema podržan destruktor za `btVehicleTuning`; ograničenje i posao oko memorije su u [planu](PLAN.md#arhitektura).

## Zvuk

[AudioEngine](../core/io/audio/AudioEngine.js) poseduje aplikacioni audio kontekst i deljeno učitavanje; [SceneAudio](../core/io/audio/SceneAudio.js) vezuje izvore za sesiju. Objekat koji izvodi radnju poseduje njenu deklaraciju zvuka. Import i konstrukcija ne otvaraju kontekst: otključavanje zahteva stvarni korisnički gest, uz mogućnost ponovnog pokušaja.

- Glavna jačina iz zajedničkih podešavanja primenjuje se jednom na izlazu. Profil i snimak imaju jedno mesto; audio osnova nema grananja po imenu igre i ne troši gameplay generator slučajnosti.
- Kratak zvuk je samostalan događaj sa tačkom opaljenja; petlja čuva jednu nameru i fazu kroz pauzu. Gašenje emitera oslobađa njegovu petlju, dok započeti pucanj pripada sesiji do završetka. Pre početka i posle ishoda sviraju samo izričito dozvoljeni izvori.
- Kašnjenje učitavanja i pun budžet ne prave red starih pucnjeva. Nečujna petlja može biti virtuelna i nastaviti bez restarta. [Budžet](../core/io/audio/VoiceBudget.js) važi za sve izvore, uključujući one koji se gase; novi glas ne sme prekoračiti plafon tokom preklapanja.
- Prostorni slušalac je stvarni igrač, ne kamera ili centar ekrana. [Koordinatni adapter](../core/io/audio/AudioCoordinates.js) koristi eksplicitnu razmeru i isti svetski okvir za slušaoca i izvor; 3D položaji uključuju roditeljske transformacije. Nevažeći položaj je greška, bez izmišljene zamene.
- Čujnost i [Dopler](../core/io/audio/Doppler.js) koriste stvarnu geometriju, ne zaglađen položaj. Oblast se čuje od najbliže tačke, uključujući nultu udaljenost unutar nje; izlazak izvora iz kadra sam po sebi ne gasi zvuk. Zaglađuje se izlaz; pauza čuva vreme prelaza, a teleport i promena identiteta resetuju istoriju. Jedna prostorna obrada ne sme dva puta oslabiti udaljenost. Govor, muzika i UI čuvaju osnovni ton.
- Više vlasnika iste fizičke ambijentalne oblasti može deliti jednu petlju; uklanjanje jednog ne prekida ostale. Ne spajati odvojene oblasti preko praznine. Optimizacija izlaza ne preskače tačan položaj ili važne promene.

Numeričke domete, pragove, miks i limite održavaju [profili](../core/io/audio/audioProfiles.js) i kod, a poreklo snimaka [SOURCES](../assets/sounds/SOURCES.md). Rad na sporim uređajima je obavezan zahtev; stvarna slušna provera i potvrda performansi prate [plan](PLAN.md#arhitektura). Prolaz unit testa ne dokazuje konačni miks. Zaklanjanje zvuka zidovima, odjeci i opšte kašnjenje zasebne su opcione mogućnosti, ne zahtevi izvedeni iz slike pozadine.

## UI i ulaz

Vlasništvo nad DOM-om, fokus, granice ulaza i menije održava [UI vodič](UI.md). Blokirajući prozor čuva prirodnu aktivaciju HTML kontrola i sprečava gameplay ulaz, uključujući kontrole koje deluju neposredno iz događaja. Otpuštanje i reset tastera ne zavise od trenutne mete događaja; početak i nastavak vraćaju fokus platnu bez dodatnog klika.

Informativna poruka ne zaustavlja komande ni tok poteza. Dekorativna scena ne preuzima fokus i nema izmišljenog prostornog igrača. Pravila naplate i odobravanja novih UI elemenata ostaju u [DOCS](DOCS.md).

## Obrasci pri nadogradnji

- Najpre utvrditi vlasnika odgovornosti i sve korisnike. Zajednička promena čuva ponašanje drugih potrošača; scena ne zaobilazi ugovor pristupom privatnim poljima i paralelnim kopijama logike. Kada novi blok zameni stari, ukloniti stari tek po prelasku poslednjeg korisnika i cele njihove sudarne grupe.
- Svet, kamera i ekran su odvojene koordinate. Vidljivost delova prati istu kameru kao telo, lokalno podešavanje deljenog renderera vraća se i posle greške, a proceduralni teren zavisi od svetske koordinate.
- Redosled crtanja je izričit za telo, delove i efekte. Deo iza roditelja ne dobija automatski dubinu iza svih drugih objekata; efekat se ne crta dvaput zbog grafičkog roditeljstva.
- Preimenovanje identifikatora radi parser uz proveru dinamičkih stringova i svih potrošača. Dodavanje polja zajedničkoj osnovi zahteva proveru kolizija imena u izvedenim klasama. Getter nije obična vrednost koju `Object.assign` može preneti kao descriptor.
- Parametar balansa i svetska mera imaju jednog vlasnika. Refaktor ne menja redosled slučajnih izbora niti usput podešava fiziku i AI. Ako dizajn propisuje broj pogodaka, ne zameniti ga nasumičnom štetom; ishod formacije zavisi od članova, ne od nestanka sa ekrana.
- Proveravati stvarni događaj, prelaze, granična vremena, različite korake, pauzu, reset i nezavisne instance. Za animacije proveriti kojoj akciji pripada završni događaj i primeniti početnu pozu pre crtanja.

## Katalog za isprobavanje

[Storybook](STORYBOOK.md) je vlasnikov katalog aktera: tip, model i uloga određuju stavku nezavisno od zajedničkog koda. Blok mora moći sam na pozornicu sa svojim zavisnostima i relevantnim radnjama. Zajednička biblioteka može čuvati upotrebljive aktere i module koje nijedna trenutna igra ne koristi.

Blok ima ciljane provere sa lažnim zavisnostima, a scena proverava sastavljanje i svoja pravila. Dokaz birati prema ugovoru: unit test ne potvrđuje vizuelni osećaj, native memoriju ni konačne performanse. Obim i izvršene rezultate održava [TESTING](TESTING.md).
