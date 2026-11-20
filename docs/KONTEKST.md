# Konteksti igara

Ovde čuvamo dogovorenu temu, istorijski okvir i zamišljeni tok malih igara. „Nivo” u razgovoru može značiti celu malu igru; „etapa” označava pojedinačni deo unutar nje. Kada razlika utiče na posao, razjasniti značenje pre izmene.

Za svaku igru dodati kratak odeljak tek kada je kontekst dogovoren. Istorijske činjenice sa izvorima pripadaju [ISTORIJA](ISTORIJA.md), tehnički obrasci [ARHITEKTURA](ARHITEKTURA.md), a poslovi i statusi razvojnim planovima; ovde se ne prepisuju implementacija i podešavanja balansa.

## Prihvaćen art projekta

Vlasnik je 14. 11. 2026. potvrdio da je sav postojeći art u `assets` istorijski prihvaćen. Pri izboru i korišćenju tog arta ne tražiti ponovnu istorijsku proveru ili odobrenje. Koristiti ga kao prihvaćenu osnovu za igre; starije istraživačke napomene ispod ne otvaraju ponovo njegovo prihvatanje.

Za pripremu konačne grafike važi [projektno pravilo za umetnost](DOCS.md#pravilo-za-umetnost). Prioritet: model, slika, pogled, rezolucija, poreklo i priprema za igru. Profili zahtevaju izdvajanje pozadine. Prava korišćenja proveriti pre objavljivanja.

**Prikaz partizana — zahtev vlasnika:** koristiti prepoznatljivu partizanku ili triglavku, ne generičku okruglu kapu ili beretku. U sitnom prikazu odozgo kapa se čita kao izdužena maslinastozelena kapa po sredini glave, sa suženim krajevima, pregibom i kosom sa obe strane; prednja zvezda se iz tog ugla ne vidi. Ovo je pravilo izbora grafike projekta, ne tvrdnja da su istorijski svi partizani nosili istu kapu.

## To Trieste!

- **Tema:** partizanski tenk napreduje prema Trstu.
- **Istorijski okvir:** završne operacije 1945; [polazište za istraživanje](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst).
- **Zamišljeni tok:** nekoliko povezanih etapa, sa dolaskom tenka do Trsta na kraju.
- **Za razradu:** broj etapa, polazna tačka, trasa, pojedinačni događaji, ciljevi i radnja. Sastav protivnika i opreme vezati za provereni kontekst svake etape.

## Franjo Kluz

- **Žanr i cilj:** horizontalna arkadna pucačina u avionu Potez 25; avion leti samo napred, napada mitraljezom i bombama, a misija se završava sletanjem na pistu. Promašena pista gubi misiju; uništeni protivnici nisu uslov.
- **Istorijski okvir:** Franjo Kluz je 23. maja 1942. preleteo iz vazduhoplovstva NDH partizanima kod Prijedora ([izvori](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz)); igra nije stroga simulacija. Protivnici su nemačka pešadija, kamioni, tenk, oklopni voz, laka PVO i lovci Bf 109 po izboru vlasnika; oklopni voz kod Kozare nije potvrđen, ali ostaje. Potez u oznakama NDH je partizanski crtež sa šahovnicom umesto zvezde i trobojke, prema [oznakama iz izvora](ISTORIJA.md#kozara-majjul-1942--polazište-za-igru-franjo-kluz).
- **Prva misija, prelazak:** Kluz u Potezu sa oznakama NDH probija se kroz neprijatelje do partizanskog aerodroma. Zbunjeni protivnici vide svoj avion i do pola puta ne pucaju prvi. Ako avion napadne, uzvraćaju svi koji to vide na ekranu, kao i oni koji uđu na ekran dok borba traje; kad je oko njih mirno, i dalje vide svoj avion i ćute. Na pola puta diže se uzbuna za vazdušni napad i svi otvaraju vatru. Posle sletanja partizani mu menjaju oznake.
- **Druga misija:** Kluz u partizanskom Potezu poleće sa tog aerodroma, napada kolone na putevima pod vatrom sa zemlje i sleće na kraju puta.
- **Treća misija, vazdušni napad:** omaž napadu na partizanski aerodrom jula 1942, ne simulacija. Potez stoji na pisti uz sirenu i mora da poleti pre nego što ga Ju 87 ([DiveBomber](../core/actor/aircraft/DiveBomber.js)) bombarduju na zemlji; napadač koji nije oboren vraća se, a sletanje je pobeda tek kad su svi oboreni. Napadači su u `raids` u [missions.js](../scenes/franjo-kluz/missions.js), a pravila u sceni.
- **Art i animacije:** sedam PNG listova za pešadiju, vozila i plamen pucnja povezano je sa Kluzom preko postojećeg Sprite-a i lokalnog crtanja, uz stare sudarne dimenzije. Vojnici pokazuju stvarni hitac i pad sa zadržanim završnim kadrom; mirujuća vozila animiraju motor, a uništena nastavljaju postojeći požar. Plamen PVO prati vrh i ugao cevi; cev i propeler proveravaju vidljivost po kameri preko lokalnog WorldPart-a. [Animirani pregled](../assets/images/armies/sources/franjo-kluz/preview.html), [ugovor kadrova](../assets/images/armies/sources/franjo-kluz/sprites.json), [izvornici i imagegen promptovi](../assets/images/armies/sources/franjo-kluz/manifest.json). Nova integracija čeka ciljane izvršne provere i vlasnikovo odobrenje u igri prema [FK-13](PLAN-KLUZ.md#fk-13).
- **Mirni i uzbunjeni vojnici:** mirni stoje ili patroliraju sa puškom na ramenu, bez nišanjenja; sirena ili napad aviona koji vide prekida mirno ponašanje i odmah prelaze na nišanjenje i pucanje uvis. Za oba vojnika pripremljeni su dodatni klipovi `rest`, `walk` i `fireUp`, uz nepromenjene prethodne redove i oslonac na tlu. Prvi kadar `fireUp` služi kao držana nišanska poza; `muzzle` u ugovoru kadrova označava vrh cevi u toj pozi. Ova dopuna je art i generisani podatak; ponašanje ugrađuje Claude, a nije dokazano ovom pripremom.

## Neretva

- **Žanr i cilj:** stacionarna arkadna pucačina sa nišanjenjem mišem i odbranom ranjenika; ekran se ne pomera. Bez ograničenja municije i punjenja.
- **Dogovoreni redosled:** prvi ekran protiv Nemaca, drugi protiv četnika; njihove pozadine vezati za izabrani položaj i vreme.
- **Likovni ton:** protivnici su odrasli, prekaljeni vojnici sa ozbiljnim, pretećim izrazima i uverljivim proporcijama u piksel stilu; bez dečjih, simpatičnih lica ili karikaturalno velikih očiju.
- **Likovni zahtev:** četnički likovi imaju guste, jasno vidljive brade i brkove, čitljive i u daljem planu. Brada mora polaziti sa obraza i brade lica, ne izgledati kao marama na vratu. To je izbor prikaza ove igre, ne tvrdnja da je svaki istorijski četnik bio bradat.
- **Protivnici:** vlasnik želi četnike kao protivnike; italijanske i ustaške etape su kandidati za razradu. Odvojiti frakciju od borbene uloge: strelac ili mitraljezac nisu osobine cele frakcije. Broj etapa, redosled, njihove pozadine i tačne jedinice još nisu izabrani; postojeći nemački rov nije dokaz istorijskog sastava svih budućih etapa.
- **Za razradu:** konkretne lokacije, datumi, jedinice, borbene uloge, trajanje etapa i prelaz između njih. [Istorijsko polazište](ISTORIJA.md#neretva--polazište-za-izbor-protivnika) odvaja potvrđeno učešće od tek zamišljenog prizora. Italijani i ustaše ostaju mogućnost za kasnije, van ove dve etape.

## Ustanak

Po jedan nepokretan top sa posadom i zastavom na obe strane; levi sastav i raspored ostaju sačuvani. Nišanjenje nema tajmer: W/S menja ugao, držanje Space puni ograničenu snagu, puštanje ispaljuje. Samo aktivni igrač upravlja svojim topom i posadom; potez se menja tek posle završetka leta, eksplozije i štete. Zdravlje pripada topu; posada i zastava su dekoracija, a samostalno opaljivanje strelca nema štetu ni uticaj na poteze. AI koristi istu fiziku i koriguje početne promašaje.

Vetar i razaranje terena prihvaćeni su bez dodatnog UI-ja i mogu se nezavisno isključiti u konfiguraciji objekata radi poređenja. Dim pokazuje vetar; zastave ostaju okrenute ka sredini prema [pravilu animacije](ANIMACIJA-POZADINE.md). Đule useca plitak nepravilan krater (oko 120 px širok, oko 24 px dubok) u prednji sloj zemlje, kao u Worms-u: kroz rupu se vidi tamni zid, ivica je oprljena, a udar u rupu je produbljuje do dna sloja. Đulad padaju u stvarni oblik rupe, a borci i topovi padaju gravitacijom do novog tla, ceo top bez naginjanja; nova runda vraća ceo sloj. Sloj prekriva dno ulice u selu i gradu. Hitac iz cevi koja je ostala ispod tla eksplodira na njenom vrhu i raskopa zemlju ispred topa; to je namerno ostavljeno, kao u Worms-u. Vlasnik je posle partije prihvatio teren (2026-11-20).

Za punjenje je prihvaćen samo zvuk mehanizma, bez dodatnog metalnog udarca; za požar snimak velikog požara zgrade. Prihvaćeni snimci i njihovo poreklo su uz [deljene zvukove](../assets/sounds/SOURCES.md). Glavna jačina je zajednički `config.volume`, bez posebnih podešavanja po igri; pauza utišava zvukove scene. Trajni ugovor je u [arhitekturi](ARHITEKTURA.md), a otvoreni slušni nalazi i neizvršene provere u [uputstvu za provere](TESTING.md#global-audio-migration-verification-limits).

U 1P slušalac ostaje levi igrač/top i tokom računarevog poteza; prati njegov tačan položaj, uključujući spuštanje sa terenom. U 2P slušalac prelazi na sledećeg igrača tek pri stvarnoj smeni poteza, posle razrešenja granate i odložene štete. Zaglađuju se jačina i panorama, ne položaj između igrača; leva/desna strana ostaju strane sveta. Nova runda postavlja početnog igrača pre prvog zvuka, pauza zamrzava prelaz, a kraj meča zadržava poslednjeg slušaoca. Ovo je ugovor ponašanja, ne potvrda da je trenutni miks čujan.

**Okvir (vlasnik):** Trinaestojulski ustanak u Crnoj Gori 1941. Levo su ustanici/partizani, desno italijanska artiljerija sa posadom i zastavom. Pre precrtavanja proveriti topove, uniforme i oznake za taj period; konkretna bitka još nije izabrana.

Meč traje do dve dobijene runde, najviše tri. Strane naizmenično otvaraju runde; između njih igrač bira nastavak, rezultat ostaje, a topovi i nišanjenje kreću iz početka. U 2P ishod imenuje pobedničkog igrača; protiv računara poraz znači gubitak meča.

Ambijenti redom: kamenita brda, bombardovano i spaljeno kameno selo, razrušeni grad iz Tenkića. Menjaju se između rundi; položaji jedinica i tlo za granate ostaju usklađeni. U prvoj rundi gori bunker, drugu čine nagorele kuće, urušeni krovovi i živa zgarišta sa dimom širom sela, a treću gradske ruševine. Bunker se prikazuje samo u prvoj; sva seoska žarišta imaju animiranu vatru i dim, koji nastavljaju i posle ishoda. U selu su iza topova svetli, mirni zidovi i čist put; okolne ruševine i planine ostaju oštre i detaljne.

**Šta to znači za igru:** italijanski protivnik i zastava odgovaraju; tri ambijenta (brda, kameno selo, razrušen grad) uklapaju se u crnogorski teren i spaljena sela leta 1941. Nije potvrđeno da su ustanici imali top u dvoboju sa italijanskom artiljerijom: zarobljena oruđa i mesto takve borbe treba tražiti u vojnim istorijama napada na Berane i Kolašin (npr. Zoran Lakić). Do tada je partizanski top pretpostavka igre, a avioni nad bojištem su italijanski. Činjenice i izvori: [Crna Gora, jul 1941](ISTORIJA.md#crna-gora-jul-1941--polazište-za-igru-ustanak).

**Precrtavanje likova:** svaki lik kopirati iz njegovog originala: lice, kapu, odeću, proporcije i pozu, kroz sve kadrove animacije. Redosled sleva na snimku početne stranice: zastavnik Savo, posada topa, strelac. Zastavnik i posada zadržavaju prethodni izgled sa brkovima; strelac, treći desno, nema brkove ni bradu. Referenca rasporeda: [snimak Ustanka](../assets/images/scenes/uprising.webp). Ne dodavati zajedničke osobine svim partizanima. Pre zamene porediti svaki lik sa njegovim originalom u stvarnoj veličini prikaza.

**Ustanak — prihvaćen završni art:** vlasnik je prihvatio borce i njihove animacije, uz postojeće topove i zastave. Dodatno precrtavanje zastava i animiranje topova nije izvedeno; odbačeni SVG prototip nije konačni art. Ovo je odluka o prihvatanju prikaza, ne dokaz izvršenih tehničkih provera.

[Italijanski artiljerac](../assets/images/armies/game-ready/artiljerija/italijanska-posada-sprites.png) i [italijanski zastavnik](../assets/images/armies/game-ready/vojnici/zastavnici-sprites.png): providni AI atlasi prema postojećem artu; zastavnik koristi drugi red zajedničkog atlasa. Oznake zastava ostaju iz prihvaćenih resursa.

Partizanski atlasi ponovo generisani ugrađenim imagegen alatom uz pojedinačne originale kao reference: [posada](../assets/images/armies/game-ready/artiljerija/partizanska-posada-sprites.png) prema [originalu posade](../assets/images/armies/partizani/artiljerija/posada-01.png), [strelac](../assets/images/armies/game-ready/vojnici/partizanski-strelac-sprites.png) prema [originalu strelca](../assets/images/armies/partizani/vojnici/partizan-30.png), [zastavnik](../assets/images/armies/game-ready/vojnici/partizanski-zastavnik-sprites.png) prema [Savu](../assets/images/armies/partizani/vojnici/savo.png). Zahtev: identično lice, kapa, odeća, proporcije i poza, uključujući prisustvo ili odsustvo brkova na svakom originalu; samo minimalne promene za animaciju, providna pozadina. Atlasi imaju 16, osam i četiri kadra. Vlasnik je označio prva dva borca sleva kao dobra: zastavnika i posadu. Vraćen je prethodni zastavnik; strelac, treći desno, ponovo je nacrtan bez brkova prema originalu i snimku početne stranice. Vlasnik je potvrdio da su izgled i animacije boraca završeni. Proverena providnost uglova; browser nije pokretan od strane agenta.

[Kameno selo za Ustanak](../assets/images/background/crnogorsko-selo-1941-pixel.png): AI pozadina 1586×992, nacrtana ugrađenim imagegen alatom prema [gradu iz Tenkića](../assets/images/background/razrusen-grad-ww2-pixel.png) kao stilskom uzoru. Prikazuje bombardovano i spaljeno selo, uz očuvane svetle mirne površine iza topova. Naslikani dim i plamen uklonjeni su iz osnovne slike radi zasebne animacije. Ilustrativan ambijent za dogovoreni okvir Crne Gore 1941, bez identifikacije konkretnog sela ili bombardovanja.

## Vis

Vertikalna arkadna pucačina o partizanskom letu do Visa, sa sopstvenim izgledom i sadržajem. Zamišljeni tok su tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis; ovo opisuje koncept, ne stanje implementacije.

**Okvir (vlasnik):** Vis 1944, kada su na ostrvu bili Vrhovni štab NOVJ i aerodrom sa britanskim i partizanskim avionima.

**Šta to znači za igru:** Spitfire sa crvenom zvezdom odgovara jugoslovenskoj eskadrili tek od leta 1944, a stalno na Visu od oktobra; pre toga su na ostrvu britanski avioni. Protivnik je Luftwaffe nad Jadranom; tipove nemačkih aviona u igri još treba potvrditi za taj prostor i period. Za ime i zadatak nivoa ne tvrditi tačan datum koji izvori ne potvrđuju. Činjenice i izvori: [Vis 1944](ISTORIJA.md#vis-1944--polazište-za-igru-vis).

[Jak-1b](../assets/images/armies/partizani/avioni/yak-1b-realistic.png) i [Il-2](../assets/images/armies/partizani/avioni/il-2-realistic.png): providne AI slike 300×255 prema fotografijama maketa [Arma Hobby / Radosław Burski](https://armahobbynews.pl/en/blog/2022/03/31/yak-1b-70028-gallery-radoslaw-burski/) i [Tamiya 61113](https://tamiya.com/english/products/61113/index.html). Jak je kompaktan lovac, Il-2 oklopljeni dvosedi jurišnik. Vizuelne interpretacije sovjetskih šema, bez tvrdnje da prikazuju konkretan istorijski primerak. Dodati u izbor Visa kao sovjetska podrška; ne predstavljati ih kao sastav eskadrila na Visu. Kontekst jugoslovenskih pilota: [preobuka na Jak-1b od decembra 1944](https://www.odbrana.mod.gov.rs/odbrana/98/098%20Odbrana.pdf), [borbena upotreba Il-2 od januara 1945](https://www.odbrana.mod.gov.rs/odbrana/78/078%20Odbrana.pdf).

[Breguet 19](../assets/images/armies/partizani/avioni/breguet-19-realistic.png): 300×200, providni PNG, odozgo. AI interpretacija u stilu profesionalne makete prema AV-001 i fotografiji iz POT-001; maslinasta boja, bele krilne površine sa petokrakama, otvorene kabine i stalni stajni trap prema referencama. Šema oznaka nije nezavisno istorijski potvrđena. U Visu je dodatni istorijski izbor iz 1942, ne tvrdnja da je pripadao eskadrilama na Visu 1944.

## Čamac

- **Žanr:** arkadna plovidba sa pogledom odozgo i horizontalnim praćenjem plovila.
- **Cilj prve etape:** dolazak do kraja trase pokreće automatsku završnu animaciju bez obzira na visinu čamca u kadru, kao sletanje u igri Vis: upravljanje i borba prestaju, čamac se poravnava, miruje tokom iskrcavanja partizana i sledi pobeda. Pristanište je zamišljeno mesto za potrebe igre, bez tvrdnje da predstavlja potvrđenu istorijsku lokaciju.
- **Borbeno ponašanje:** obalski mitraljez počinje rafal čim uđe u kadar, uz predah između rafala. Uništena posada ostaje oborena, sa spuštenim oružjem i plamenom iznad nje. Uništeni neprijateljski čamac postepeno tone; dok je na površini, olupina sprečava prolazak kroz nju bez dodatne štete igraču.
- **Posada:** partizani su vidljivi u čamcu tokom plovidbe i iskrcavaju se iz svojih mesta; koriste mali piksel art, različite uniforme i uglove okrenutosti, prema [pravilu prikaza partizana](#prihvaćen-art-projekta).
- **Istorijski okvir:** desant na Šoltu u maju 1944; [istorijski izvori](ISTORIJA.md#pregled-kategorije-bitaka-novj). Izbor operacije je dogovoren; konkretno plovilo i sastav protivnika tek treba proveriti.
- **Osnovno kretanje:** početni položaj čamca u kadru ujedno je njegova krajnja desna pozicija. Prvi potisak ne pomera ga udesno u kadru; po puštanju tokom plovidbe može polako otići ulevo, a novi potisak vraća ga samo do početnog položaja. Kamera prati svet i ovo pomeranje u kadru, bez promene fizičke brzine čamca.
- **Početak i povratak:** početni čamac i kadar miruju bez potiska. Povratak ulevo dozvoljen je samo do početne pozicije; kamera ne prikazuje prostor pre početka trase.
- **Osnova izbora kamere:** [Itay Keren — Scroll Back](https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers), praćenje igrača i prostor ispred njega.
- **Izbor protivnika:** prvi kopneni protivnik je nemački mitraljeski položaj; prvi pomorski protivnik je S-čamac na povratnom pravcu prema Visu, sa S 30 kao konkretnom referencom. Minobacač 81 mm je potvrđen dodatni kandidat, ne nalog za uvođenje još jedne vrste protivnika. Tačan zadatak i ponašanje protivnika ostaju dizajn igre, odvojen od činjenica iz izvora. Za igru je izabrana interpretacija tipa sa dva topa; to nije potvrda tačnog rasporeda i modernizacije pojedinačnog S 30 u noći 10/11. maja. Torpeda nisu deo trenutne paljbe u igri. [Sastav iz izvora](ISTORIJA.md#šolta-911-maj-1944--sastav-za-igru-čamca).
- **Art:** [indeks prikaza](../assets/images/armies/index.csv) sadrži postojeći čamac i nemačku pešadiju odozgo, dok su britanski desantni čamci bočni. Postojeći `camac.png` ostaje prihvaćena grafička osnova, bez identifikacije kao istorijski potvrđenog modela iz operacije. [S-čamac](../assets/images/armies/game-ready/brodovi/schnellboot-s30.svg) je zaseban lokalni crtež tipa S 30 odozgo, sa uskim trupom, zatvorenim niskim kormilarskim prostorom, parom prednjih torpednih cevi i palubnim postoljima; cevi topova crta i okreće igra. Bez oznaka koje bi tvrdile da je rekonstruisan konkretan brod. [Mitraljesko gnezdo](../assets/images/armies/game-ready/polozaji/mitraljesko-gnezdo-odozgo.svg) je lokalni prikaz odozgo sa vrećama, posadom i odvojenom pokretnom cevi u igri; ne tvrdi konkretan MG model ili tačnu lokaciju položaja na Šolti. Bočne desantne slike ne koristiti za gornji pogled.
- **Za razradu:** plovilo, radnja i ciljevi u okviru izabrane operacije; postojeći rečni prizor prilagoditi morskoj obali, ostrvima i kanalima tek kroz dogovorene razvojne stavke.

## Tenkići

**Okvir (vlasnik):** Tenkovski duel na Sremskom frontu početkom 1945.

**Šta to znači za igru:** okvir daje stvaran tenkovski sukob, ali ne potvrđuje sadašnje crteže. Partizanski tenk nalik zarobljenom Pantheru i nemački Tiger I nisu vezani za ovaj front; naoružanje 2. tenkovske brigade (sovjetski T-34/85 se pretpostavlja) i tipovi nemačkih tenkova moraju se potvrditi pre novog crteža, najverovatnije u studiji „Sremski front 1944–1945“ (Pajović, Uzelac, Džlebdžić, 1979). Ravničarsko bojište sa rovovima zamenilo bi razrušen grad. Činjenice i izvori: [Sremski front, 1945](ISTORIJA.md#sremski-front-početak-1945--polazište-za-igru-tenkići).

**Više nivoa (odluka vlasnika):** Tenk duel može imati više nivoa, svaki u drugoj bici sa svojim tenkovima i bojištem; Sremski front je prvi. Kandidati za ostale, još neprovereni: Mostar, Knin ili Lika 1944–45 (1. tenkovska brigada NOVJ, M3 Stuart), Beograd oktobar 1944 (sovjetski T-34 uz partizane, u gradu, uz preklapanje sa Otpisanima), zaplenjeni nemački tenkovi u NOVJ (sadašnji partizanski crtež, ako se nađe izvor) i Trst/Rijeka maj 1945 (preklapanje sa Pohodom na Trst).

## Otpisani

**Okvir (vlasnik):** Igra je „Povratak otpisanih“, ilegalci u Beogradu 1944, u borbama za oslobođenje grada. Serija je igrani film, ne istorijski izvor; istorijski okvir je Beogradska operacija.

**Šta to znači za igru:** protivnik su nemačke jedinice koje brane Beograd; borba ulicu po ulicu odgovara poslednjim danima operacije. Uloga ilegalaca kao u seriji je umetnički okvir igre i ne treba je predstavljati kao istorijsku tvrdnju; za stvarnu ulogu beogradske ilegale u oktobru 1944. naći poseban izvor. Muzika iz serije ostaje neprostorni sloj kao i do sada. Činjenice i izvori: [Beograd, oktobar 1944](ISTORIJA.md#beograd-oktobar-1944--polazište-za-igru-otpisani).

## Bunker

**Okvir (vlasnik):** Igra je bitka za Krupanj 1941, a Žikica Jovanović Španac je bombaš koji napada bunker.

**Šta to znači za igru:** Rađevina i Krupanj su Žikicin kraj i prostor njegovog odreda, pa okvir odgovara. Izvori koje sam proverio ne opisuju sam napad na krupanjski garnizon: Žikičina uloga bombaša, bunker i sastav posade (Nemci ili žandarmi) još nisu potvrđeni. Proveriti u zborniku „Ustanak naroda Jugoslavije 1941“ ili u istoriji Valjevskog odreda pre tvrdnje o nemačkom bunkeru, koju sada iznosi uvod igre. Činjenice i izvori: [Krupanj, 1941](ISTORIJA.md#krupanj-1941--polazište-za-igru-bunker).

## Ranjenik

**Okvir (vlasnik):** Junak je ranjeni borac koji je preživeo bitku na Sutjesci 1943.

**Šta to znači za igru:** ranjenik koji puzi iz obruča i krije se od patrole odgovara sudbini ranjenika iz pivskih pećina i probojnih dana sredinom juna 1943. Sastav patrole (nemačka, a ne italijanska, bugarska ili ustaška) i opremu još treba potvrditi za mesto i dan; nemački govor patrole je zato pretpostavka igre. Tok Centralne bolnice proveriti u monografiji o bitci (Vojnoistorijski institut) pre tvrdnje o tačnom mestu. Činjenice i izvori: [Sutjeska 1943](ISTORIJA.md#sutjeska-1943--polazište-za-igru-ranjenik).
