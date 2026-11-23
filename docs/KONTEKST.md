# Konteksti igara

Ovde čuvamo dogovorenu temu, istorijski okvir i zamišljeni tok malih igara. „Nivo” u razgovoru može značiti celu malu igru; „etapa” označava pojedinačni deo unutar nje. Kada razlika utiče na posao, razjasniti značenje pre izmene.

Za svaku igru dodati kratak odeljak tek kada je kontekst dogovoren. Istorijske činjenice sa izvorima pripadaju [ISTORIJA](ISTORIJA.md), tehnički obrasci [ARHITEKTURA](ARHITEKTURA.md), a poslovi i statusi jedinstvenom [PLAN-u](PLAN.md); ovde se ne prepisuju implementacija i podešavanja balansa.

## Prihvaćen art projekta

Vlasnik je 14. 11. 2026. potvrdio da je sav postojeći art u `assets` istorijski prihvaćen. Pri izboru i korišćenju tog arta ne tražiti ponovnu istorijsku proveru ili odobrenje. Koristiti ga kao prihvaćenu osnovu za igre; starije istraživačke napomene ispod ne otvaraju ponovo njegovo prihvatanje.

Za pripremu konačne grafike važi [projektno pravilo za umetnost](DOCS.md#pravilo-za-umetnost). Prioritet: model, slika, pogled, rezolucija, poreklo i priprema za igru. Profili zahtevaju izdvajanje pozadine. Prava korišćenja proveriti pre objavljivanja.

**Prikaz partizana — zahtev vlasnika:** koristiti prepoznatljivu partizanku ili triglavku, ne generičku okruglu kapu ili beretku. U sitnom prikazu odozgo kapa se čita kao izdužena maslinastozelena kapa po sredini glave, sa suženim krajevima, pregibom i kosom sa obe strane; prednja zvezda se iz tog ugla ne vidi. Ovo je pravilo izbora grafike projekta, ne tvrdnja da su istorijski svi partizani nosili istu kapu.

## To Trieste!

- **Tema:** partizanski tenk napreduje prema Trstu.
- **Istorijski okvir:** završne operacije 1945; [polazište za istraživanje](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst).
- **Zamišljeni tok:** četiri etape redom trase: Lika, Senj i primorje, Rijeka (obavezna), Trst (odluka vlasnika).

## Franjo Kluz

- **Žanr i cilj:** horizontalna arkadna pucačina u avionu Potez 25; avion leti samo napred, napada mitraljezom i bombama, a misija se završava sletanjem na pistu. Promašena pista gubi misiju; uništeni protivnici nisu uslov.
- **Istorijski okvir:** Franjo Kluz je 23. maja 1942. preleteo iz vazduhoplovstva NDH partizanima kod Prijedora ([izvori](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz)); igra nije stroga simulacija. Protivnici su nemačka pešadija, kamioni, tenk, oklopni voz, laka PVO i lovci Bf 109 po izboru vlasnika; oklopni voz kod Kozare nije potvrđen, ali ostaje. Potez u oznakama NDH je partizanski crtež sa šahovnicom umesto zvezde i trobojke, prema [oznakama iz izvora](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz).
- **Prva misija, prelazak:** Kluz u Potezu sa oznakama NDH probija se kroz neprijatelje do partizanskog aerodroma. Zbunjeni protivnici vide svoj avion i do pola puta ne pucaju prvi. Ako avion napadne, uzvraćaju svi koji to vide na ekranu, kao i oni koji uđu na ekran dok borba traje; kad je oko njih mirno, i dalje vide svoj avion i ćute. Na pola puta diže se uzbuna za vazdušni napad i svi otvaraju vatru. Posle sletanja partizani mu menjaju oznake.
- **Druga misija:** Kluz u partizanskom Potezu poleće sa tog aerodroma, napada kolone na putevima pod vatrom sa zemlje i sleće na kraju puta.
- **Treća misija, vazdušni napad:** omaž napadu na partizanski aerodrom u Lušci Palanci 6. jula 1942, ne simulacija. Potez stoji na pisti uz sirenu i mora da poleti pre nego što ga Ju 87 ([DiveBomber](../core/gameplay/bodies/aircraft/DiveBomber.js)) bombarduju na zemlji; napadač koji nije oboren vraća se, a sletanje je pobeda tek kad su svi oboreni. Ruševina pored piste ovde nema sudar, da ne smeta poletanju (odluka vlasnika). Napadači su u `raids` u [missions.js](../scenes/franjo-kluz/missions.js), a pravila u sceni.
- **Igrivost (odluke vlasnika):** avion se ne okreće, pa promašena pista gubi misiju; sletanje je namerno lako. Municija je ograničena za ceo let, bez goriva i usputnog sletanja. Oklop izdrži više metaka, a bomba uništava svaki cilj; oboren lovac pada goreći i na tlu uništava sve u krugu bombe. Lovci prolaze iznad ili ispod aviona umesto da ga udare; sudar sa živim neprijateljem ruši oba, a olupina oborenog aviona samo teško ošteti Potez. Osmatrač sam gađa lovce iza aviona, a taster za pucanje pokreće samo prednji mitraljez (odluka vlasnika, 2026-11-22). Misije se igraju redom bez ekrana izbora, sledeća ne troši novi žeton, a nova igra počinje prvom. Tačne vrednosti su u [Potez](../core/gameplay/bodies/aircraft/Potez.js), [sceni](../scenes/franjo-kluz/Main.js) i [missions](../scenes/franjo-kluz/missions.js).

- **Prihvaćen art Poteza:** obe oznake dele isti model u piksel stilu posade; vlasnik ga je odobrio u igri. Posada i pokretni delovi ostaju odvojeni. Za dalji rad koristiti [sastavljeni avion](../assets/images/armies/sources/franjo-kluz/potez-crew/preview.html), ne vraćati stari ravniji stil; glave posade porediti sa drugim vojnicima u veličini igre.

## Neretva

- **Žanr i cilj:** stacionarna arkadna pucačina sa nišanjenjem mišem i odbranom ranjenika; ekran se ne pomera. Bez ograničenja municije i punjenja.
- **Dogovoreni redosled:** prvi ekran protiv Nemaca, drugi protiv četnika; njihove pozadine vezati za izabrani položaj i vreme.
- **Napad iz vazduha (vlasnikov nalog da se nivoi obogate novim akterima, 2026-11-22):** dok Nemci drže rovove, povremeno dolazi Ju 87 ([AirAttack](../scenes/neretva/AirAttack.js)), obrušava se na branioce ispred rovova i baca bombu koja im smanjuje snagu. Igrač ga može oboriti klikom, što se računa kao pogodak. Luftwaffe je napadala prelaz preko Neretve; konkretan napad nije rekonstruisan.
- **Likovni ton:** protivnici su odrasli, prekaljeni vojnici sa ozbiljnim, pretećim izrazima i uverljivim proporcijama u piksel stilu; bez dečjih, simpatičnih lica ili karikaturalno velikih očiju.
- **Likovni zahtev:** četnički likovi imaju guste, jasno vidljive brade i brkove, čitljive i u daljem planu. Brada mora polaziti sa obraza i brade lica, ne izgledati kao marama na vratu. To je izbor prikaza ove igre, ne tvrdnja da je svaki istorijski četnik bio bradat.
- **Protivnici:** Nemci i četnici u dve dogovorene etape; frakcija se odvaja od borbene uloge. Dodatne etape i izbor njihovih mesta vodi [PLAN](PLAN.md#igre).

## Battle for Jablanica

Partizani koriste prihvaćen model zaplenjenog topa; ne otvarati ponovnu istorijsku proveru tog modela bez novog razloga. Moguću kampanju i kolonu kamiona vodi [PLAN](PLAN.md#igre).

- **Tema i cilj:** partizanska posada teškim topom razara italijansko utvrđenje dok branioci uzvraćaju vatru. Igrač je usred šireg napada: saborci sa oba boka pucaju ka utvrđenju, ali ne stoje u liniji vatre topa.
- **Istorijski okvir:** napadi NOVJ na uporišta italijanske 154. pešadijske divizije „Murge” u dolinama Rame i Neretve tokom februara 1943. Sadašnja etapa je Jablanica, 20–22. februar; [činjenice i izvori](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).
- **Prizor Jablanice:** top i stara austrijska kasarna nalaze se na istoj obali Neretve. Utvrđeni kompleks počinje čitav, na uzvišenoj terasi, sa sivim blokovima, puškarnicama i zaobljenim utvrđenim delom prema ratnoj fotografiji; tek ga igračevi pogoci pretvaraju u hrpu pojedinačnih blokova. Italijanski branioci su unutar utvrđenja i mogu da pucaju samo kroz otvore; pali mitraljezac može biti zamenjen preživelim vojnikom.
- **Predaja:** kada manje od polovine prvobitnih branilaca ostane živo, obe strane prekidaju vatru dok se italijanska zastava spušta i bela zastava podiže; tek tada preživeli nude predaju. Prihvatanje završava etapu pobedom, a odbijanje nastavlja borbu sa belom zastavom na jarbolu dok ne pogine poslednji branilac. To je pravilo igre. Istorijski izvor predaju Jablanice vezuje za pogodak skladišta municije, ne za utvrđeni procenat gubitaka.
- **Likovni i borbeni ton:** zimska hercegovačka klisura, magla, slab sneg, garež i fizički rekviziti stvaraju osećaj duge borbe. Utvrđenje u početku deluje stameno; precizan pogodak može ubiti vojnika ili mitraljesca, dok neprecizno granatiranje postepeno razara zaklon. Italijanske uniforme, M33 šlemovi, lica i oznake razlikuju vojnike bez pretvaranja prikaza u RPG statistiku.

## Ustanak

Po jedan nepokretan top sa posadom i zastavom na obe strane; levi sastav i raspored ostaju sačuvani. Nišanjenje nema tajmer: W/S menja ugao, držanje Space puni ograničenu snagu, puštanje ispaljuje. Samo aktivni igrač upravlja svojim topom i posadom; potez se menja tek posle završetka leta, eksplozije i štete. Zdravlje pripada topu; posada i zastava su dekoracija, a samostalno opaljivanje strelca nema štetu ni uticaj na poteze. AI koristi istu fiziku i koriguje početne promašaje.

Vetar i razaranje terena prihvaćeni su bez dodatnog UI-ja. Ponovljeni udari produbljuju rupe, borci i topovi prate novo tlo, a hitac iz ukopane cevi eksplodira na njenom otvoru; to je namerno ponašanje po uzoru na Worms. Zastave ostaju okrenute ka sredini prema [pravilu animacije](ANIMACIJA-POZADINE.md).

Za punjenje je prihvaćen samo zvuk mehanizma bez dodatnog metalnog udara, a za požar snimak velikog požara zgrade. Poreklo je uz [zvukove](../assets/sounds/SOURCES.md), a zajednički ugovor u [arhitekturi](ARHITEKTURA.md#zvuk).

U 1P slušalac ostaje levi igrač/top i tokom računarevog poteza; prati njegov tačan položaj, uključujući spuštanje sa terenom. U 2P slušalac prelazi na sledećeg igrača tek pri stvarnoj smeni poteza, posle razrešenja granate i odložene štete. Zaglađuju se jačina i panorama, ne položaj između igrača; leva/desna strana ostaju strane sveta. Nova runda postavlja početnog igrača pre prvog zvuka, pauza zamrzava prelaz, a kraj meča zadržava poslednjeg slušaoca. Ovo je ugovor ponašanja, ne potvrda da je trenutni miks čujan.

**Okvir (vlasnik):** Trinaestojulski ustanak u Crnoj Gori 1941. Levo su ustanici/partizani, desno italijanska artiljerija sa posadom i zastavom. Pre precrtavanja proveriti topove, uniforme i oznake za taj period; konkretna bitka još nije izabrana; pozadine Ustanka su mesta tog ustanka, sa Grahovom kao obaveznim ([pravila pozadina](ART.md#pravila-pripreme-i-predaje-pozadina)).

Meč traje do dve dobijene runde, najviše tri. Strane naizmenično otvaraju runde; između njih igrač bira nastavak, rezultat ostaje, a topovi i nišanjenje kreću iz početka. U 2P ishod imenuje pobedničkog igrača; protiv računara poraz znači gubitak meča.

Ambijenti redom, po putu Save Kovačevića 1941: Grahovo, Vilusi, okolina Nikšića. Svaka runda se bije na sledećem mestu, a niz se nastavlja i u sledećem meču; tlo slike pada na fizičko tlo jedinica i granata. Bunker se prikazuje samo u prvoj rundi meča; žarište svake slike ima živu vatru i dim, koji nastavljaju i posle ishoda.

**Kontekst i granice:** italijanski protivnik i zastava odgovaraju; tri mesta ustanka uklapaju se u crnogorski teren i spaljena sela leta 1941. Nije potvrđeno da su ustanici imali top u dvoboju sa italijanskom artiljerijom: zarobljena oruđa i mesto takve borbe treba tražiti u vojnim istorijama napada na Berane i Kolašin (npr. Zoran Lakić). Partizanski top ostaje pretpostavka igre, a avioni nad bojištem su italijanski. Činjenice i izvori: [Crna Gora, jul 1941](ISTORIJA.md#crna-gora-jul-1941--polazište-za-igru-ustanak).

**Identitet boraca Ustanka:** čuvati lice, kapu, odeću i proporcije pojedinačnog originala. Zastavnik Savo i posada imaju brkove; strelac nema brkove ni bradu. Ne prenositi zajedničke osobine na sve partizane; [referenca](../assets/images/scenes/uprising.webp).

**Prihvaćen prikaz Ustanka:** borci, njihove animacije, topovi i zastave ostaju osnova; prihvatanje prikaza ne dokazuje tehničke provere kasnijih izmena.

## Vis

Vertikalna arkadna pucačina o partizanskom letu do Visa, sa sopstvenim izgledom i sadržajem. Zamišljeni tok su tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis; ovo opisuje koncept, ne stanje implementacije.

**Okvir (vlasnik):** Vis 1944, kada su na ostrvu bili Vrhovni štab NOVJ i aerodrom sa britanskim i partizanskim avionima.

**Kontekst i granice:** Spitfire sa crvenom zvezdom odgovara jugoslovenskoj eskadrili tek od leta 1944, a stalno na Visu od oktobra; pre toga su na ostrvu britanski avioni. Protivnik je Luftwaffe nad Jadranom; istorijsko učešće pojedinačnih nemačkih tipova u tom prostoru i periodu nije potvrđeno ovim kontekstom. Za ime i zadatak nivoa ne tvrditi tačan datum koji izvori ne potvrđuju. Činjenice i izvori: [Vis 1944](ISTORIJA.md#vis-1944--polazište-za-igru-vis).

[Jak-1b](../assets/images/armies/partizani/avioni/yak-1b-realistic.png) i [Il-2](../assets/images/armies/partizani/avioni/il-2-realistic.png): providne AI slike 300×255 prema fotografijama maketa [Arma Hobby / Radosław Burski](https://armahobbynews.pl/en/blog/2022/03/31/yak-1b-70028-gallery-radoslaw-burski/) i [Tamiya 61113](https://tamiya.com/english/products/61113/index.html). Jak je kompaktan lovac, Il-2 oklopljeni dvosedi jurišnik. Vizuelne interpretacije sovjetskih šema, bez tvrdnje da prikazuju konkretan istorijski primerak. Sovjetska podrška je odvojena od sastava eskadrila na Visu; preostali izbori su u [PLAN-u](PLAN.md#igre). Kontekst jugoslovenskih pilota: [preobuka na Jak-1b od decembra 1944](https://www.odbrana.mod.gov.rs/odbrana/98/098%20Odbrana.pdf), [borbena upotreba Il-2 od januara 1945](https://www.odbrana.mod.gov.rs/odbrana/78/078%20Odbrana.pdf).

[Breguet 19](../assets/images/armies/partizani/avioni/breguet-19-realistic.png): 300×200, providni PNG, odozgo. AI interpretacija u stilu profesionalne makete prema AV-001 i fotografiji iz POT-001; maslinasta boja, bele krilne površine sa petokrakama, otvorene kabine i stalni stajni trap prema referencama. Šema oznaka nije nezavisno istorijski potvrđena. U Visu je dodatni istorijski izbor iz 1942, ne tvrdnja da je pripadao eskadrilama na Visu 1944.

## Čamac

- **Naziv igre:** Partisan Navy (odobreno od vlasnika, 2026-11-22); tehnička adresa ostaje `camac`.

- **Žanr:** arkadna plovidba sa pogledom odozgo i horizontalnim praćenjem plovila.
- **Cilj prve etape:** dolazak do kraja trase pokreće automatsku završnu animaciju bez obzira na visinu čamca u kadru, kao sletanje u igri Vis: upravljanje i borba prestaju, čamac se poravnava, miruje tokom iskrcavanja partizana i sledi pobeda. Pristanište je zamišljeno mesto za potrebe igre, bez tvrdnje da predstavlja potvrđenu istorijsku lokaciju.
- **Borbeno ponašanje:** obalski mitraljez počinje rafal čim uđe u kadar, uz predah između rafala. Uništena posada ostaje oborena, sa spuštenim oružjem i plamenom iznad nje. Uništeni neprijateljski čamac postepeno tone; dok je na površini, olupina sprečava prolazak kroz nju bez dodatne štete igraču.
- **Posada:** partizani su vidljivi u čamcu tokom plovidbe u sve tri etape i iskrcavaju se iz svojih mesta na Šolti; posle bitke svi se vraćaju na Vis, niko ne ostaje na Šolti (odluka vlasnika, 2026-11-22); koriste mali piksel art, različite uniforme i uglove okrenutosti, prema [pravilu prikaza partizana](#prihvaćen-art-projekta).
- **Istorijski okvir:** desant na Šoltu u maju 1944; [istorijski izvori](ISTORIJA.md#pregled-kategorije-bitaka-novj). Izbor operacije je dogovoren; konkretno plovilo i sastav protivnika tek treba proveriti.
- **Osnovno kretanje:** početni položaj čamca u kadru ujedno je njegova krajnja desna pozicija. Prvi potisak ne pomera ga udesno u kadru; po puštanju tokom plovidbe može polako otići ulevo, a novi potisak vraća ga samo do početnog položaja. Kamera prati svet i ovo pomeranje u kadru, bez promene fizičke brzine čamca.
- **Početak i povratak:** početni čamac i kadar miruju bez potiska. Povratak ulevo dozvoljen je samo do početne pozicije; kamera ne prikazuje prostor pre početka trase.
- **Osnova izbora kamere:** [Itay Keren — Scroll Back](https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers), praćenje igrača i prostor ispred njega.
- **Izbor protivnika:** prvi kopneni protivnik je nemački mitraljeski položaj; prvi pomorski protivnik je S-čamac na povratnom pravcu prema Visu, sa S 30 kao konkretnom referencom. Minobacač 81 mm je potvrđen dodatni kandidat, ne nalog za uvođenje još jedne vrste protivnika. Tačan zadatak i ponašanje protivnika ostaju dizajn igre, odvojen od činjenica iz izvora. Za igru je izabrana interpretacija tipa sa dva topa; to nije potvrda tačnog rasporeda i modernizacije pojedinačnog S 30 u noći 10/11. maja. Torpeda nisu deo trenutne paljbe u igri. [Sastav iz izvora](ISTORIJA.md#šolta-911-maj-1944--sastav-za-igru-čamca).
- **Art:** [indeks prikaza](../assets/images/armies/index.csv) sadrži postojeći čamac i nemačku pešadiju odozgo, dok su britanski desantni čamci bočni. Postojeći `camac.png` ostaje prihvaćena grafička osnova, bez identifikacije kao istorijski potvrđenog modela iz operacije. [S-čamac](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg) je zaseban lokalni crtež tipa S 30 odozgo, sa uskim trupom, zatvorenim niskim kormilarskim prostorom, parom prednjih torpednih cevi i palubnim postoljima; cevi topova crta i okreće igra. Bez oznaka koje bi tvrdile da je rekonstruisan konkretan brod. [Mitraljesko gnezdo](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg) je lokalni prikaz odozgo sa vrećama, posadom i odvojenom pokretnom cevi u igri; ne tvrdi konkretan MG model ili tačnu lokaciju položaja na Šolti. Bočne desantne slike ne koristiti za gornji pogled.
- **Etape (odluka vlasnika):** noćno isplovljavanje sa Visa, desant na Šoltu, povratak na Vis pod napadom S-čamaca.

## Tenkići

**Okvir (vlasnik):** Tenkovski duel na Sremskom frontu početkom 1945.

**Kontekst i granice:** okvir daje stvaran tenkovski sukob, ali ne potvrđuje sadašnje crteže. Partizanski tenk nalik zarobljenom Pantheru i nemački Tiger I nisu vezani za ovaj front; naoružanje 2. tenkovske brigade (sovjetski T-34/85 se pretpostavlja) i tipovi nemačkih tenkova moraju se potvrditi pre novog crteža, najverovatnije u studiji „Sremski front 1944–1945“ (Pajović, Uzelac, Džlebdžić, 1979). Ravničarsko bojište sa rovovima zamenilo bi razrušen grad. Činjenice i izvori: [Sremski front, 1945](ISTORIJA.md#sremski-front-početak-1945--polazište-za-igru-tenkići).

**Više nivoa (odluka vlasnika, 2026-11-22):** meč ide do dve pobede, najviše tri runde, kao u Ustanku. Bojišta se smenjuju redom: Sremski front, jesen 1944 → Batina, novembar 1944 → proboj Sremskog fronta, april 1945, pa ispočetka, i kroz naredne mečeve. Grad, Bihać, Drvar i Užice nisu deo ove igre. Igrač zadržava isti partizanski tenk; protivnik jača od bojišta do bojišta: na Sremskom frontu 1944. je M15/42, kod Batine StuG III, a u proboju 1945. Tigar I, najjači, iako tamo nije istorijski potvrđen (odluka vlasnika, 2026-11-23), uz [granice istorijske potvrde](ISTORIJA.md#protivnički-oklop-po-bojištima-u-tenkićima).

## Otpisani

**Okvir (vlasnik):** Igra je „Povratak otpisanih“, ilegalci u Beogradu 1944, u borbama za oslobođenje grada. Serija je igrani film, ne istorijski izvor; istorijski okvir je Beogradska operacija.

**Kontekst i granice:** protivnik su nemačke jedinice koje brane Beograd; borba ulicu po ulicu odgovara poslednjim danima operacije. Uloga ilegalaca kao u seriji je umetnički okvir igre i ne treba je predstavljati kao istorijsku tvrdnju; stvarna uloga beogradske ilegale u oktobru 1944. zahteva zaseban istorijski dokaz. Muzika iz serije ostaje neprostorni sloj kao i do sada. Činjenice i izvori: [Beograd, oktobar 1944](ISTORIJA.md#beograd-oktobar-1944--polazište-za-igru-otpisani).

## Liberated City

**Okvir (vlasnik, 2026-11-22):** Igra je obilazak Bihaća krajem 1942, posle oslobođenja grada, u vreme Prvog zasedanja AVNOJ-a.

**Kontekst i granice:** parole i plakati po gradu treba da odgovaraju slobodnoj teritoriji u kasnu jesen 1942. Natpisi o dolasku Crvene armije, poput „CRVENA ARMIJA DOLAZI” i plakata RED_ARMY_IS_HERE, pripadaju 1944. i u tom okviru su anahroni; o njihovoj sudbini odlučuje vlasnik. Činjenice i izvori: [Bihać, kraj 1942](ISTORIJA.md#bihać-kraj-1942--polazište-za-igru-liberated-city).

## Bunker

**Okvir (vlasnik):** Igra je bitka za Krupanj 1941, a Žikica Jovanović Španac je bombaš koji napada bunker.

**Kontekst i granice:** Žikicin noćni prilaz bolnici početkom septembra 1941, po kiši, preko otvorenog prostora uz Likodru. Vizuelni cilj je prepoznatljiva bolnica Nikole Spasića, a ne izmišljena ruševna kasarna; naziv igre ostaje Bunker. Kadar izdvaja završni prilaz, dok su kapela i okolna brda van njega; nije geodetska rekonstrukcija celog kompleksa. Postojeće mine ostaju arkadna prepreka bez potvrde minskog polja na ovom mestu. Činjenice, savremene fotografske reference i granice pretpostavki: [Krupanj, 1941](ISTORIJA.md#krupanj-1941--polazište-za-igru-bunker).

## Ranjenik

**Okvir (vlasnik):** Junak je ranjeni borac koji je preživeo bitku na Sutjesci 1943.

**Kontekst i granice:** ranjenik koji puzi iz obruča i krije se od patrole odgovara sudbini ranjenika iz pivskih pećina i probojnih dana sredinom juna 1943. Sastav patrole i oprema nisu potvrđeni za tačno mesto i dan; nemački govor patrole je zato pretpostavka igre. Činjenice i izvori: [Sutjeska 1943](ISTORIJA.md#sutjeska-1943--polazište-za-igru-ranjenik).

## Potvrđena grupa pozadina za Ustanak i Tenkiće

Na početku svake runde prikazuju se mesto i provereni period na engleskom (odluka vlasnika, 2026-11-22), kratko u postojećem prostoru za poruke; Ustanak ih spaja sa najavom prvog poteza. [Istorijska provera perioda](ISTORIJA.md#periodi-za-natpise-bojišta) prethodi izmeni natpisa, a zajednički opis bojišta u [BattleBackground](../scenes/tenkici/BattleBackground.js) čuva engleski tekst koji koriste obe igre. Trajanje najave prati vreme igre i miruje u pauzi.

Vlasnik je potvrdio šest ambijenata za sadašnje nivoe: Tenkići — Sremski front, jesen 1944 → Batina, novembar 1944 → proboj Sremskog fronta, april 1945; Ustanak — Grahovo → Vilusi → okolina Nikšića, 1941. Za Batinu je vlasnik izabrao [animiranu verziju](ART.md#batina-izabrana-animirana-pozadina), ugrađenu u Tenkiće; obrisane alternative ne vraćati. [Resursi](ART.md#šest-ambijenata-sadašnjih-nivoa) su ugrađeni u obe igre; preostali pregledi su u [PLAN-u](PLAN.md#art). Izbor pejzaža ne potvrđuje da se na svakom mestu vodio prikazani artiljerijski dvoboj.

## Avatar

Zadržati postojeći rasuti, nasumični raspored kocki po širini i visini. Vlasnik je 2026-11-22 odbacio pravilnu mrežu sa povezanom putanjom; sprečavanje preklapanja i nedostižnih novčića ne sme menjati taj izgled.

Raspored ne sme sadržati preklopljene kocke ni novčiće zarobljene u njima. Novčići stoje samo na kockama do kojih avatar može da doskoči, a pokretna platforma gura avatara koji joj je na putu; to ne menja rasuti izgled nivoa.

## Proširenje sastava igara

**Ograničenja vlasnika, 2026-11-22:** Bunker ne dobija nove aktere; Ustanak i Tenkići ostaju fino podešeni dvoboji. Za Ranjenika nema smislenog postojećeg arta odozgo. Otpisani zadržavaju realističan crno-beli stil, bez pikselnih aktera. Vis se igra 1944, pa italijanski Re.2005 nije izabran (vlasnik). Novi kandidati čekaju izričit izbor vlasnika u [planu ideja](PLAN.md#igre).
