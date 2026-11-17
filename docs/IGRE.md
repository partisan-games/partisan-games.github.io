# Konteksti igara

Ovde čuvamo dogovorenu temu, istorijski okvir i zamišljeni tok malih igara. „Nivo” u razgovoru može značiti celu malu igru; „etapa” označava pojedinačni deo unutar nje. Kada razlika utiče na posao, razjasniti značenje pre izmene.

Za svaku igru dodati kratak odeljak tek kada je kontekst dogovoren. Istorijske činjenice i izvori pripadaju [ISTORIJA](ISTORIJA.md), tehnički obrasci [ARHITEKTURA](ARHITEKTURA.md), a poslovi i statusi razvojnim planovima; ovde se ne prepisuju implementacija i podešavanja balansa.

## To Trieste!

- **Tema:** partizanski tenk napreduje prema Trstu.
- **Istorijski okvir:** završne operacije 1945; [polazište za istraživanje](ISTORIJA.md#istorijsko-polazište-za-pohod-na-trst).
- **Zamišljeni tok:** nekoliko povezanih etapa, sa dolaskom tenka do Trsta na kraju.
- **Za razradu:** broj etapa, polazna tačka, trasa, pojedinačni događaji, ciljevi i radnja. Sastav protivnika i opreme vezati za provereni kontekst svake etape.

## Neretva

- **Žanr i cilj:** stacionarna arkadna pucačina sa nišanjenjem mišem i odbranom ranjenika; ekran se ne pomera. Bez ograničenja municije i punjenja.
- **Dogovoreni redosled:** prvi ekran protiv Nemaca, drugi protiv četnika; njihove pozadine vezati za izabrani položaj i vreme.
- **Likovni ton:** protivnici su odrasli, prekaljeni vojnici sa ozbiljnim, pretećim izrazima i uverljivim proporcijama u piksel stilu; bez dečjih, simpatičnih lica ili karikaturalno velikih očiju.
- **Za razradu:** konkretne lokacije, datumi, jedinice, borbene uloge, trajanje etapa i prelaz između njih. [Istorijsko polazište](ISTORIJA.md#neretva--polazište-za-izbor-protivnika) odvaja potvrđeno učešće od tek zamišljenog prizora. Italijani i ustaše ostaju mogućnost za kasnije, van ove dve etape.

## Ustanak

Po jedan nepokretan top sa posadom i zastavom na obe strane; levi sastav i raspored ostaju sačuvani. Nišanjenje nema tajmer: W/S menja ugao, držanje Space puni ograničenu snagu, puštanje ispaljuje. Samo aktivni igrač upravlja svojim topom i posadom; potez se menja tek posle završetka leta, eksplozije i štete. Zdravlje pripada topu; posada i zastava su dekoracija, a samostalno opaljivanje strelca nema štetu ni uticaj na poteze. AI koristi istu fiziku i koriguje početne promašaje.

Vetar i razaranje terena prihvaćeni su bez dodatnog UI-ja i mogu se nezavisno isključiti u konfiguraciji objekata radi poređenja. Dim pokazuje vetar; zastave ostaju okrenute ka sredini prema [pravilu animacije](ANIMACIJA-POZADINE.md). Teren ostavlja plitke kratere koji se produbljuju ponovljenim udarima, a jedinice prate tlo pod osloncem; nova runda vraća ravno tlo. Ovo opisuje prihvaćenu verziju, ne predloženi zasebni Worms teren.

Za punjenje je prihvaćen samo zvuk mehanizma, bez dodatnog metalnog udarca; za požar snimak velikog požara zgrade. Prihvaćeni snimci i njihovo poreklo su uz [deljene zvukove](../assets/sounds/SOURCES.md). Glavna jačina je zajednički `config.volume`, bez posebnih podešavanja po igri; pauza utišava zvukove scene. Dalji razvoj prostornog zvuka vodi [globalni plan](PLAN-ZVUK.md).

Dogovoreni okvir: ustanak u Crnoj Gori 1941. Levo su ustanici/partizani, desno italijanska artiljerija sa posadom i zastavom. Pre precrtavanja proveriti topove, uniforme i oznake za taj period; konkretna bitka još nije izabrana.

Meč traje do dve dobijene runde, najviše tri. Strane naizmenično otvaraju runde; između njih igrač bira nastavak, rezultat ostaje, a topovi i nišanjenje kreću iz početka. U 2P ishod imenuje pobedničkog igrača; protiv računara poraz znači gubitak meča.

Ambijenti redom: kamenita brda, bombardovano i spaljeno kameno selo, razrušeni grad iz Tenkića. Menjaju se između rundi; položaji jedinica i tlo za granate ostaju usklađeni. U prvoj rundi gori bunker, drugu čine nagorele kuće, urušeni krovovi i živa zgarišta sa dimom širom sela, a treću gradske ruševine. Bunker se prikazuje samo u prvoj; sva seoska žarišta imaju animiranu vatru i dim, koji nastavljaju i posle ishoda. U selu su iza topova svetli, mirni zidovi i čist put; okolne ruševine i planine ostaju oštre i detaljne.

## Vis

Vertikalna arkadna pucačina o partizanskom letu do Visa, sa sopstvenim izgledom i sadržajem. Zamišljeni tok su tri etape: posle prve dve sletanje na aerodrom, posle treće na Vis; ovo opisuje koncept, ne stanje implementacije.

## Čamac

- **Žanr:** arkadna plovidba sa pogledom odozgo i horizontalnim praćenjem plovila.
- **Cilj prve etape:** dolazak do kraja trase pokreće automatsku završnu animaciju bez obzira na visinu čamca u kadru, kao sletanje u igri Vis: upravljanje i borba prestaju, čamac se poravnava, miruje tokom iskrcavanja partizana i sledi pobeda. Pristanište je zamišljeno mesto za potrebe igre, bez tvrdnje da predstavlja potvrđenu istorijsku lokaciju.
- **Borbeno ponašanje:** obalski mitraljez počinje rafal čim uđe u kadar, uz predah između rafala. Uništena posada ostaje oborena, sa spuštenim oružjem i plamenom iznad nje. Uništeni neprijateljski čamac postepeno tone; dok je na površini, olupina sprečava prolazak kroz nju bez dodatne štete igraču.
- **Posada:** partizani su vidljivi u čamcu tokom plovidbe i iskrcavaju se iz svojih mesta; koriste mali piksel art, različite uniforme i uglove okrenutosti, prema [pravilu prikaza partizana](ISTORIJA.md#prihvaćen-art-projekta).
- **Istorijski okvir:** desant na Šoltu u maju 1944; [istorijski izvori](ISTORIJA.md#pregled-kategorije-bitaka-novj). Izbor operacije je dogovoren; konkretno plovilo i sastav protivnika tek treba proveriti.
- **Osnovno kretanje:** početni položaj čamca u kadru ujedno je njegova krajnja desna pozicija. Prvi potisak ne pomera ga udesno u kadru; po puštanju tokom plovidbe može polako otići ulevo, a novi potisak vraća ga samo do početnog položaja. Kamera prati svet i ovo pomeranje u kadru, bez promene fizičke brzine čamca.
- **Početak i povratak:** početni čamac i kadar miruju bez potiska. Povratak ulevo dozvoljen je samo do početne pozicije; kamera ne prikazuje prostor pre početka trase.
- **Osnova izbora kamere:** [Itay Keren — Scroll Back](https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers), praćenje igrača i prostor ispred njega.
- **Za razradu:** plovilo, radnja i ciljevi u okviru izabrane operacije; postojeći rečni prizor prilagoditi morskoj obali, ostrvima i kanalima tek kroz dogovorene razvojne stavke.
