# UI: principi i upotreba

Važeća pravila prikaza i veze do implementacije. Otvoreni poslovi su u [PLAN-u](PLAN.md), a postupci i granice provera u [TESTING](TESTING.md#ui-verification-limits).

## Principi

- Tema obuhvata prozore, dugmad, HUD i kontrole; promena teme ne menja značenje komande. Nedoslednost zajedničkog elementa rešava se u njegovom stilu, ne kopijom za jednu igru.
- Scena poseduje fazu, podatke i pravila igre; UI prikazuje stanje i prosleđuje akcije. Crtanje dugmeta nije pokretanje partije, pauza, naplata ili ishod.
- Radnja, tastaturni binding, opis i touch dugme imaju odvojene odgovornosti. Ikonica označava stvarnu sposobnost, ne ime ulaza.
- Svaki DOM element, slušalac i odloženi posao ima vlasnika. Stara scena ne briše i ne dopisuje UI nove scene.
- Nove elemente i tekstove odobravati prema [DOCS](DOCS.md#odobravanje-ui-elemenata). Razvojni pregledi su izuzetak definisan tamo.

## Razvojne igre na naslovnoj

`dev-only` kartice prate `isDev` u [konfiguraciji](../config.js). Vidljivost razvojne kartice i lokalni uslov za razvojne žetone ili alate nisu ista odluka.

## Brzina naslovne

Sve što se dodaje na naslovnu mora biti optimizovano (odluka vlasnika, 2026-11-23): slika kartice je webp širine do 600 px sa upisanim `width` i `height` i `loading="lazy"`, a sadržaj ne sme da pomeri raspored kad stigne font ili kad se pokrene skripta. Link na igru (`#igra`) sakriva naslovnu pre nego što se njene slike preuzmu. Naslovna nema 3D scenu ni dekoraciju koja usporava učitavanje.

### Vraćanje animacije The Germans Advance na naslovnu

Animacija se otvara sa kartice u **Scenes and Animations**. Raniji automatski prikaz ispod naslova sačuvan je u Git zapisu `0e228114ff3958f9aeee018b1ed584fac4fb9afd`. Za vraćanje izdvojiti `.battle-preview` iz `index.html` i `ui/arcade.css`, učitavanje pregleda sa naslovne iz `scenes/main.js` i modul `scenes/bitka/Preview.js` iz tog zapisa. Pregled koristi isti [BattleView](../scenes/bitka/BattleView.js) kao zasebna scena. Pokreće se tek kad uđe u vidljivo polje, pauzira kad izađe iz kadra ili se kartica pregledača sakrije, gasi se pri ulasku u scenu i prikazuje mirnu sliku pri smanjenom kretanju.

## Stilovi

Izvori su [styles](../ui/styles.js) i [CSS](../ui/style.css): `simple` je podrazumevani taman UI, `rpg` ukrašen, a `white` koristi bele okvire. Igra zadaje podrazumevanu temu; korisnikov izbor ima prednost. Postojeći lokalni stilovi nisu razlog za različito ponašanje iste komponente.

### Potvrđeni birač teme

Settings sadrži Volume i **UI style**, redom **Predefined, Simple, RPG, White**. Predefined prati temu igre; ostali izbori važe za sve igre. Izbor se pamti i osvežava već napravljene prozore, HUD, Controls, zdravlje i kameru. Pretplate se uklanjaju pri gašenju vlasnika.

Fokus je vidljiv u stilu igre; dugme dobija fokus kao hover svoje teme. Ne uvoditi različite browserove plavo-bele okvire ili posebnu stilizaciju svake kontrole.

## UI u sceni

[Scene](../core/Scene.js) stvara i povezuje svoj UI; izvedena scena ga podešava kroz opcije umesto da pravi drugu instancu. [SceneManager](../scenes/SceneManager.js) čeka pripremu i prvo crtanje pre startnog prozora. Izbor lika ili aviona može zahtevati dodatno učitavanje.

Uvod je jedna kratka rečenica zadatka. Standardni početak ima samo Start, a prilagođeni izbor može nuditi režime ili aktere; bez Main menu dugmeta. Izveštaj i sam prikaz teksta nisu dokaz da igra ima naplativ početak. Cena se ne izvodi iz promenljivog intro teksta.

## Prozori i prelazi

Pauzu, nastavak i ishod pozivati kroz scenu; samo prikazivanje ili skrivanje prozora ne menja simulaciju. Čuva se prvi ishod. Greška može biti prikazana bez lažne aktivne scene.

Redosled pauze je **Main menu, Settings, Continue, Play again**; ishod ima **Main menu, Play again**, a greška samo meni. Settings vraća na pauzu bez nastavka igre. Esc tokom igre pauzira; u pauzi i drugim centralnim prozorima nema dodatnu akciju.

### Prilagođeni početak

Prilagođeni početak koristi klase trenutne teme i obrađuje samo svoj izbor u dozvoljenoj fazi. Asinhroni izbor sprečava dvostruku aktivaciju i posle čekanja proverava da ista scena i zahtev još važe. Markup, događaje i tačne potpise održavaju [UI](../ui/UI.js) i konkretna scena.

## HUD, pokazatelji i poruke

HUD čita stanje scene; prikaz zdravlja i snage ne poseduje te modele. Lokalni paneli van zajedničkih kontejnera takođe prate temu i čišćenje. Poruka se šalje pri događaju, ne svakog frejma, i ne blokira komande. UI ne pravi red za poruke skrivene centralnim prozorom.

Ista radnja koristi isti simbol u dugmetu i HUD-u. Zajednički [katalog ikonica](../core/io/icons.js) određuje simbole i putanje; prikaz određuje veličinu, obris i dostupnost. Pucanje je 💥, nenaoružani napad 👊, magija ✨, a municija slika metka. Dosledna postojeća upotreba ne traži ponovno odobravanje svakog simbola.

## Komande, tastatura i touch

[Tasteri](../core/io/keys.js), [uputstva](../ui/Controls.js), [Input](../core/io/Input.js) i [Touch](../core/io/Touch.js) imaju odvojene ugovore. Fizički `event.code` nije nužno znak lokalizovane tastature. Ne menjati binding da bi odgovarao pogrešnom opisu.

Jedna radnja je jedan red sa kratkim imenom i javnim tasterima; rukovanje držanjem/punjenjem/otpuštanjem ne opisuje se. Esc se ne navodi. Nedostajuće i netačne opise postojećih komandi ispraviti; kada drugi taster radi isto kao već navedeni, pitati da li ga otkriti. To ne odobrava nove sposobnosti.

<a id="skrivena-precica-za-trcanje"></a>
**Trčanje:** javno se navodi CapsLock; levi Shift ostaje skrivena prečica.

<a id="skrivene-precice-za-bocno-kretanje"></a>
**Bočno kretanje:** javno se navode Q/E; PageUp/PageDown ostaju skrivene alternative. Skrivene tastere ne otkrivati kroz Controls ili nagoveštaje; njihovo izostavljanje nije propust.

Igre su namenjene desktop računaru; provera na telefonu trenutno nije potrebna (odluka vlasnika, 2026-11-23). Touch nije potpuna zamena tastature. Radnja neophodna za upotrebljivost određene igre dobija odgovarajuće dugme kada je ta igra zatraži, uz odobren raspored i simbol. Ne dodavati mobilno dugme pauze: gubitak vidljivosti pauzira, a browserovo vraćanje vodi u meni. Dugme kamere ostaje iznad akcijskih redova; kontrole i centralni prozori ne smeju izlaziti van uskog ekrana.

## Životni ciklus, fokus i odloženi poslovi

HUD, centralni ekran, poruka i lokalni izbori imaju izričitog vlasnika. Brisanje je dopušteno samo vlasniku sadašnjeg prikaza; kasni upis proverava instancu i zahtev. Gašenje je ponovljivo i uklanja tajmere, slušaoce i lokalni DOM.

Pauza petlje sama ne zaustavlja neposredne DOM kontrole. Proveravaju se faza i meta događaja, uz očuvanje prirodne aktivacije HTML dugmadi i podešavanja. Otpuštanje tastera radi i posle promene mete, a modal, gubitak fokusa i vidljivosti resetuju držanje. Centralni ekran dobija fokus i zadržava Tab; Start/Continue vraćaju fokus platnu. Početni izbor nije gameplay klik i mora ostati dostupan u svojoj fazi.

## Podešavanja i ulaz u igru

Sva korisnička podešavanja čuvaju se između poseta, uz proveru vrednosti i očuvanje ostalih podešavanja. Ako skladište ne radi, izbor važi za otvorenu stranicu bez tvrdnje o trajnom čuvanju. Izvor je [settings](../ui/settings.js); pravila naplate su u [DOCS](DOCS.md#ulaz-u-igre-i-novčići).

### Džep i arkadni žetoni

Korisnički nazivi su **džep / pocket** i **arkadni žetoni / tokens**; tehnički ključevi se ne preimenuju zbog terminologije. Greška čitanja nije potvrđeno prazno stanje. Besplatne igre ne zavise od džepa.

Odobrene poruke su „Allow this site to save data to use arcade tokens.” za blokirano čuvanje i „The machine swallowed your token. Try giving it a kick.” za neuspešan povraćaj posle neuspelog početka. Druga poruka ne označava da je povraćaj uspeo niti dodaje novu radnju.

### Potvrđena oznaka naplate

Naplativo dugme desno od natpisa pokazuje samo zlatan žeton sa zvezdom, bez broja cene. Raspoložive žetone pokazuje džep. Aktivna oznaka se kreće, disabled miruje; smanjeno kretanje daje mirnu sliku i na aktivnom dugmetu. Nedostatak žetona daje native disabled stanje, bez dodatne poruke ili prozora, a dostupnost se obnavlja po promeni džepa.

Odobrenje animacije u prozoru ne menja kartice naslovne: naplative kartice zadržavaju prethodni CSS žeton, dok scene i animacije imaju TRY. Resurse i izbor mirne/pokretne varijante održavaju [icons](../core/io/icons.js) i UI; pregled je na [ui.html](../ui.html).

### Pouke za usklađivanje prikaza

Proveravati vidljivi znak, ne samo centar CSS kutije. Oznaka naplate i natpis ostaju u istom redu; disabled stanje prigušuje ceo sadržaj i zaustavlja animaciju, a povratak vraća oboje. Najduži natpis, razmaci i veličine proveravaju se u svim temama i na uskom ekranu. Poreklo resursa samo po sebi ne garantuje uklapanje u UI.

## Provera i održavanje vodiča

Pri promeni proveriti relevantne centralne i lokalne ekrane, tastaturu, podržani touch, brzu promenu i gašenje scene. DOM test nije dokaz native fokusa, pointer lock-a ili čitljivog rasporeda. Tačne implementacione vrednosti ostaju u kodu, izvršene provere u TESTING, a preostali posao u PLAN-u.
