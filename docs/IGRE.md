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
