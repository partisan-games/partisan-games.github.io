# UI: principi i upotreba

Vodič kroz postojeći UI i dogovorena pravila njegovog razvoja. Primeri koriste sadašnji API; odobrene mogućnosti koje još ne postoje posebno su označene.

## Principi

- **Tema je celina.** Prozori, dugmad, HUD i kontrole unutar iste teme treba vizuelno da pripadaju zajedno. Isti element mora biti dosledan u svim igrama koje koriste tu temu; promena teme ne menja značenje komande ili ponašanje komponente. Usklađivanje postojećih odstupanja je deo [plana](PLAN-UI.md#ui-03).
- **Igra određuje sadržaj i pravila.** Scena poseduje podatke, fazu partije i uslove pobede/poraza. UI prikazuje te podatke i prosleđuje korisničke akcije. Zajednički prikaz ne zahteva iste brojače, režime ili završetke u svakoj igri.
- **Prikaz nije izvršenje radnje.** Nacrtano dugme samo po sebi ne pokreće igru, ne pauzira i ne naplaćuje. Scena upravlja partijom; ruter navigacijom i ulaskom, a džep transakcijom. Greška mora moći da se prikaže i kada aktivne scene nema.
- **Radnja, taster, opis i touch kontrola su odvojeni.** Provera prati stvarnu sposobnost do svakog podržanog uređaja i prikazanog uputstva. Isti ulaz `attack` može značiti pucanje, udarac ili bombu; ikonica se bira po značenju. Touch `special` ne garantuje tastaturni V.
- **Svaki prikaz ima vlasnika.** DOM, slušaoci, zvukovi i odloženi poslovi pripadaju životu scene/UI-ja. Zakasnela stara scena ne sme izbrisati niti dopisati prikaz nove.
- **Izmene imaju konkretan razlog.** Pre novih elemenata i izmena teksta pratiti [pravilo odobravanja](DOCS.md#odobravanje-ui-elemenata), uključujući tamo navedene izuzetke. Primer iz vodiča nije odobren novi tekst za konkretnu igru.

Arhitektonske granice slojeva su u [ARHITEKTURA](ARHITEKTURA.md#odgovornosti), a pravilo naplate u [DOCS](DOCS.md#ulaz-u-igre-i-novčići).

## Stilovi

Izvor tema je [styles](../ui/styles.js), a izgled i raspored određuje [CSS](../ui/style.css). Scena bira `uiStyle`; ako ga ne navede, koristi se `simple`.

| Ključ | Vizuelni smer | Okvirna tematska namena |
|---|---|---|
| `simple` | Jednostavan taman prozor, sivi okvir i podrazumevana dugmad | WW2 i podrazumevani UI |
| `rpg` | Teksturni okviri, ukrašena dugmad i topliji naslovi | Fantasy i horror |
| `white` | Jednostavan prozor sa belom spoljnom linijom i belim hover okvirom dugmeta | Svemir; postojeći primer je [Space landing](../scenes/moon-landing/Main.js#L25) |

To je okvirna logika podrazumevanih tema, ne automatska klasifikacija svake scene. Postojeći izbor igre ostaje merodavan dok se izričito ne promeni; neki potrošači još imaju lokalne klase ili zaseban CSS.

Danas se stil postavlja pri stvaranju UI-ja, pre opisa komandi, zdravlja i drugih elemenata. Zajednička mapa daje klase za kontejner, dugme, rezultat, opise komandi, zdravlje i kameru; prazna klasa znači da ostaje osnovni CSS. Potrošač uzima ulogu iz `currentStyleClasses()` umesto da unapred pretpostavi RPG ili simple klasu. Sama promena globalnog stila ne ažurira klase već napravljenog DOM-a i nije gotov mehanizam menjanja teme tokom igre.

**Potvrđeno, još nije implementirano:** posle usklađivanja tema korisnik dobija izbor stila u Settings. Njegov izbor važi za sve igre i ima prednost nad podrazumevanim stilom igre. Izbor se pamti prema [pravilu čuvanja podešavanja](#podešavanja-i-ulaz-u-igru). Potvrđen je birač opisan ispod. Izrada i provere su u [UI-09](PLAN-UI.md#ui-09).

### Potvrđeni birač teme

U Settings, ispod Volume, dolazi padajuća lista sa oznakom **UI style**. Redosled i nazivi opcija su **Predefined, Simple, RPG, White**. Predefined prati podrazumevani stil svake igre; ostali izbori važe za sve igre. Simple bira `simple`, RPG `rpg`, a White `white`.

Predefined je izbor načina određivanja teme, ne dodatna vizuelna tema: pre pravljenja UI elemenata razrešava se u stil koji konkretna igra zadaje. Naziv Simple opisuje izgled i ne tvrdi da je baš ta tema uvek podrazumevana. I izbor Predefined čuva se kao korisničko podešavanje. Ovaj birač je odobren, ali još nije implementiran.

## UI u sceni

[Scene](../core/Scene.js#L26) već pravi `this.ui` i povezuje Start/Continue sa životnim ciklusom igre. U izvedenoj sceni prosledi konfiguraciju kroz `super`; ne pravi još jednu UI instancu.

```js
import Scene2D from '/core/Scene2D.js'
import { baseControls } from '/ui/Controls.js'

export default class MissionScene extends Scene2D {
  constructor() {
    super({
      intro: 'Find the way out',
      uiStyle: 'simple',
      controlKeys: baseControls,
    })
  }
}
```

Uvod je kratka rečenica zadatka. Standardni početni ekran ima samo početak igre, a prilagođeni može imati izbor režima/lika/aviona; bez Main menu dugmeta na tom ekranu, prema [projektnom pravilu](DOCS.md#odobravanje-ui-elemenata).

[SceneManager](../scenes/SceneManager.js#L16) posle inicijalizacije i učitavanja slika crta scenu, pa prikazuje start ako postoji `intro` ili `customStartScreen`; inače odmah pokreće scenu. `reportText` sam nije uslov za startni ekran. Izbor lika ili aviona može zatim učitavati dodatne resurse, pa prikazan start nije dokaz da je sve za konkretnu partiju spremno.

`reportText` dodaje papirni izveštaj kroz [Report](../ui/Report.js); očekuje kontejner `id="start-screen"`, koji standardni šablon obezbeđuje. Početak igre briše `intro` kroz `clearIntro()`: `hasStartScreen` zato posle početka nije nepromenljiva osobina igre niti pouzdana oznaka cene partije.

## Prozori i prelazi

Postojeće šablone sastavlja [UI](../ui/UI.js#L99). Poziv igre treba da ide kroz operaciju scene kada operacija menja fazu partije.

| Potreba | Kako se koristi | Bitna granica |
|---|---|---|
| Pauza / nastavak | `this.pause()` / `this.unpause()` | Sami `showPauseScreen()` i `hideScreen()` ne upravljaju simulacijom |
| Pobeda / poraz | `this.victory(text, title)` / `this.defeat(text)` | Scena čuva prvi ishod i završava gameplay; samo crtanje ishoda nije završetak partije |
| Podešavanja | Settings iz pauze | Danas sadrže Volume; Back vraća prikaz pauze, bez nastavka igre |
| Poseban rezultat, npr. runda | `this.ui.showScreen(name, html)` | Igra odvojeno upravlja pravilima te runde i nastavkom |
| Povratak u meni | `mainMenuButton(buttonClass)` | Helper daje markup; `id="menu"` obrađuje [ruter](../scenes/main.js#L123) |
| Ponovna igra | Postojeće `id="igraj-opet"` dugme | Akciju i sadašnju naplatu obrađuje ruter, ne UI šablon |
| Učitavanje / runtime greška | Zajednički put u ruteru | Ne zahteva novu ili lažnu scenu radi iscrtavanja greške |

Na standardnoj pauzi redosled je Main menu, Settings, Play again, Continue; na ishodu Main menu, Play again. Uvod je poseban slučaj bez menija. Opšte pravilo je meni na vrhu i potvrda/nastavak na dnu tamo gde nastavak postoji; ekran greške ima samo meni.

Danas Esc tokom igre otvara pauzu. Zajednički Escape handler koji iz svakog centralnog prozora vraća na meni nije implementiran; namera izraza „kao Esc” iz projektne odluke ostaje otvorena u [PD-4](PLAN-UI.md#otvorene-odluke-i-preostale-nepoznanice). Ne zaključivati ponašanje iz komentara ili samog redosleda dugmadi.

### Prilagođeni početak

`customStartScreen(classes)` vraća HTML i dobija klase trenutne teme. Za standardno dugme sa `id="start"` postojeći UI handler već poziva početak; za posebne izbore scena povezuje svoj događaj. Primer čuva isti stil dugmadi za oba režima:

```js
const customStartScreen = ({ container, button }) => `
  <div class="central-screen flex-column ${container}" id="start-screen">
    <h2>Choose mode</h2>
    <button class="${button}" data-mode="one">1 player</button>
    <button class="${button}" data-mode="two">2 players</button>
  </div>
`
```

Prosledi ga u `super({ customStartScreen })`. U `handleClick(e)` proveri da je cilj odgovarajuće dugme i da su `this.ui.screen === 'start'` i `this.session.state === 'ready'`, zatim primeni izbor i pozovi `this.start()`. Ako izbor učitava resurse, spreči duplu aktivaciju i posle svakog `await` proveri da ista scena/pokušaj još važi. [Vis](../scenes/vis/Main.js#L64) je postojeći primer lokalnog izbora; [Ustanak](../scenes/ustanak/Main.js#L226) primer posebnog prozora runde. Prikaz i dozvola za akciju ostaju odvojeni i kod njih.

## HUD, pokazatelji i poruke

HUD se dobija iz metode `sceneUI(t)` scene; podaci ostaju u igri. [scoreUI](../ui/UI.js#L179) daje uobičajeni primarni i sekundarni brojač:

```js
sceneUI(t) {
  return this.ui.scoreUI('Score', this.score, 'Time', Math.floor(t))
}
```

Primer pretpostavlja da je `this.score` inicijalizovan u igri. UI upisuje novi HTML samo kada se promenio; scena ne treba da prepisuje ceo `#modal` radi osvežavanja bodova. `scoreUI` čita stanje, ne menja rezultat i ne određuje ishod.

Za prikaz zdravlja postoje [progresBar](../ui/components.js) — sa tim postojećim nazivom — i trajni bar kroz [PlayerView](../core3d/actor/behaviors/PlayerView.js). [PowerMeter](../ui/PowerMeter.js) služi za snagu punjenog hica; ne zamenjuje model zdravlja. Prilagođeni HTML preuzima tematske klase gde ih mapa nudi. Stalno zdravlje, kamera i lokalni paneli mogu biti van `#ui`/`#modal`; i njih treba obuhvatiti pregledom i budućom promenom teme.

Postojeći CSS daje gornje/donje leve/desne položaje i zasebna pravila za uske ekrane. Dimenzije i slojeve čitati iz [style.css](../ui/style.css), a ne održavati njihov prepis u ovom vodiču. Igra sa dva igrača, dugačkim izveštajem ili touch kontrolama traži pregled stvarnog preklapanja.

Kratku informaciju šalji pri događaju ili promeni stanja, ne svaki frame:

```js
this.ui.showMessage('Click to morph city')
```

Danas poruka koristi tri sekunde zidnog vremena. Aktivni prozor skriva već prikazanu poruku, a novu poruku zatraženu tokom prozora UI odbacuje; nema reda čekanja. Skrivenoj poruci tajmer i dalje teče. Ustanak ima zasebne najave poteza na gameplay satu. Intro, ishod i poruke prihvataju HTML koji već koristi, npr. `<br>`; spoljašnji tekst ne treba nekritički ubacivati u te šablone.

**Dogovor za ikonice:** postojeća dosledna upotreba dugmadi i simbola ostaje; ne menja se radi precrtavanja i ne traži ponovo pojedinačno odobrenje. Ista stvar koristi isti simbol i kada je dugme i kada je HUD pokazatelj. Za pucanje ostaje 💥; nenaoružani napad koristi 👊; osnovni simbol magijskog napada je ✨; municija je sličica metka, ne 🔫. Vlasniku predlagati samo stvarne sukobe u značenju, nedoslednosti ili nedostajuće simbole. [Zajednički katalog](../core/io/icons.js) čuva čiste simbole i putanje: koriste ga centralna dugmad, Touch, lokalni prikazi i HUD. Biraj simbol prema radnji konkretnog lika, ne prema imenu ulaza `attack`; modeli zadaju oznake postojećih touch radnji. Katalog ne uvozi gameplay klase, DOM ili 3D renderer; prikaz određuje veličinu, obris i dostupnost. Ne kopirati ovde ceo katalog ili inventar igara.

## Komande, tastatura i touch

Dodele i oznake tastera potiču iz [keys](../core/io/keys.js), a prikaz uputstava iz [Controls](../ui/Controls.js). Kroz `controlKeys` biraj samo postojeće sposobnosti svoje igre, po potrebi sastavljene sa `baseControls`. `showControls` upravlja prikazom tog uputstva; ne uključuje/isključuje same kontrole i podrazumevano je isključen na touch uređaju.

[Input](../core/io/Input.js) spaja tastaturu i [Touch](../core/io/Touch.js). Postojeća konfiguracija razlikuje značenje ulaza od njegovog simbola, kao u [Visu](../scenes/vis/Avionce.js#L20):

```js
import { icons } from '/core/io/icons.js'

const inputOptions = {
  attackKey: 'Space',
  buttonDict: { attack: icons.shoot, attack2: icons.loop, special: icons.bomb },
}
```

`attackKey` određuje tastaturni napad; `buttonDict` bira akcijska dugmad i oznake. Izostavljen ključ ne pravi dugme, prazna vrednost bira podrazumevani simbol, a nepoznat ključ Touch ignoriše. Prisustvo akcijskih dugmadi nije uslovljeno joystickom, pa sama provera uređaja ne dokazuje šta je na ekranu. Kod 3D igrača deo dugmadi nastaje iz `animDict`; to nije potpun popis sposobnosti, npr. skok može postojati i bez istoimene animacije.

Opis mora odgovarati stvarnoj radnji, uključujući javne alternativne tastere, držanje i otpuštanje. Izričito skrivene prečice ne dopisuju se u korisničko uputstvo. `event.code` označava fizički taster, ne nužno znak sa lokalizovane tastature. Ne premeštati binding da bi odgovarao pogrešnom opisu i ne smatrati vidljivu karticu igre dokazom potpune touch podrške.

**Automatske ispravke opisa — odluka vlasnika:** nedostajuću stvarnu komandu dopisati, a nevažeći ili netačan opis ispraviti bez pojedinačnog pitanja. Pitati kada dva tastera rade istu stvar, a jedan je već naveden, da vlasnik odluči da li treba otkriti i drugi. To važi za uputstva postojećih komandi; ne menja binding-e, ne odobrava nove gameplay radnje i ne otkriva već dogovorene tajne prečice.

<a id="skrivena-precica-za-trcanje"></a>
**Skrivena prečica za trčanje — odluka vlasnika:** levi Shift ostaje tajni taster za znalce. U javnom opisu trčanja prikazuje se samo CapsLock; levi Shift se ne otkriva kroz Controls, uputstva ili nagoveštaje. Njegovo postojeće ponašanje ostaje sačuvano. Izostavljanje Shifta iz opisa je namerno i ne vodi se kao greška ili nepotpunost; ova odluka ne proglašava druge tastere skrivenim.

<a id="skrivene-precice-za-bocno-kretanje"></a>
**Skrivene alternative za bočno kretanje — odluka vlasnika:** PageUp/PageDown ostaju skrivene alternative za Q/E. U javnom opisu navode se Q/E; PageUp/PageDown se ne dodaju u Controls, uputstva ili nagoveštaje. Postojeća dodela i ponašanje ostaju sačuvani, a izostavljanje ovih alternativa nije propust.

## Životni ciklus, fokus i odloženi poslovi

`#ui` služi HUD-u, `#modal` centralnim ekranima, a svaka UI instanca ima zaseban element poruke. Mapa `drawnBy` dozvoljava brisanje samo poslednjem vlasniku zajedničkog elementa: stari `end()` ne sme obrisati novu scenu. Ona ne predstavlja opštu zaštitu od kasnog novog upisa; svaki odloženi posao proverava svoju instancu i konkretan zahtev. Jednak tekst dve poruke ne čini ih istim zahtevom.

UI ima jedan otkaziv tajmer poruke: svaki novi zahtev dobija pune tri sekunde, čak i kada ponavlja isti tekst. `end()` je ponovljiv i uklanja tajmer, slušaoce, poruku i opise, te zaustavlja report; kasni poziv ugašenog UI-ja ne crta novi sadržaj. Report se sinhrono vezuje za svoj konkretan startni kontejner, bez kasnijeg traženja ponovljenog id-a. Zvukove poseduje audio sesija koju scena gasi pre UI-ja. Dodatni lokalni DOM i slušaoci moraju imati svog vlasnika i čišćenje u `end()` ili `session.scope`.

Pauza petlje ne isključuje direktne DOM događaje. Proveravati i dozvoljenu fazu i metu događaja; `session.active` znači samo da sesija nije ugašena, ne da gameplay traje. Zajednička tastatura i miš odbacuju gameplay ulaze sa UI elemenata i iza blokirajućeg prozora, bez otkazivanja prirodnog rada dugmadi i Volume-a. Oslobađanje ulaza radi i posle promene mete; otvaranje modala, gubitak fokusa i vidljivosti resetuju držanje. Touch razlikuje istovremene pritiske po pointerId i dopušta držanje fokusiranog dugmeta preko Space/Enter. Controls i kamera koriste native click. Centralni prozor dobija fokus i zadržava Tab/Shift+Tab u svojim kontrolama; Start/Continue vraćaju fokus na canvas. Lokalni izbor početka/runde i gameplay klik ostaju različite odgovornosti: opšta zabrana svih klikova dok sesija nije running blokirala bi postojeće izbore. Stvarno native ponašanje i pointer lock ostaju predmet [izvršne provere](TESTING.md#ui-verification-limits).

## Podešavanja i ulaz u igru

**Pravilo:** sva korisnička podešavanja čuvaju se između poseta u istom browseru. To uključuje postojeću jačinu zvuka, dogovoreni globalni izbor teme i svako novo podešavanje. Izmena jednog podešavanja čuva ostala; pri učitavanju se prihvataju samo važeće vrednosti. Ako skladište nije dostupno, izabrana vrednost i dalje važi u otvorenoj stranici, bez tvrdnje da je trajno sačuvana.

Trenutni Settings sadrži Volume, zajednički svim igrama. [settings](../ui/settings.js) primenjuje vrednost na config i već je čuva u browser skladištu. Birač teme iz [dogovora o stilovima](#stilovi) još ne postoji; njegovo čuvanje tek treba sprovesti kroz UI-09.

Sadašnji [ruter](../scenes/main.js) i [Arcade](../ui/Arcade.js) naplaćuju ulaz pre učitavanja, uključujući scene bez svog starta. To se razlikuje od [potvrđenog pravila naplate](DOCS.md#ulaz-u-igre-i-novčići); novi tok je posao [UI-05](PLAN-UI.md#ui-05), ne osobina koju današnji UI API već obezbeđuje. Pri njegovoj izmeni proveriti i dodatno učitavanje posle izbora, povraćaj novčića i zakasnele rezultate navigacije.

### Džep i arkadni žetoni

U korisničkim tekstovima i dokumentaciji koristimo naziv **džep** (engleski **pocket**) za mesto gde igrač drži **arkadne žetone** (engleski **tokens**). Ova terminologija važi i za prikaz raspoloživih žetona, njihov povraćaj i poruke o greškama. Zlatna ikonica predstavlja žeton; postojeće putanje resursa i tehnički identifikatori ostaju izvor za implementaciju, bez preimenovanja skladišnih ključeva zbog promene naziva.

**Blokirano čuvanje podataka:** potvrđena poruka je „Allow this site to save data to use arcade tokens.” Prikazuje se u istom početnom prozoru; stanje žetona tada je nedostupno i ne postavlja se na nulu. Besplatne igre ostaju dostupne. Ugradnja poruke pripada UI-05.

**Neuspešan povraćaj žetona:** potvrđena poruka je „The machine swallowed your token. Try giving it a kick.” Koristi se kada je žeton potrošen, a partija nije uspešno pokrenuta i povraćaj nije uspeo. To je šaljiv tekst u postojećem prozoru, bez nove kontrole ili gameplay radnje. Nerešen receipt i obaveza povraćaja ostaju sačuvani prema UI-05; poruka ne označava uspešan povraćaj. Ugradnja još nije sprovedena.

### Potvrđena oznaka naplate

Na dugmadima za početak, izbor i Play again naplative partije desno od postojećeg natpisa stoje zlatan žeton sa zvezdom i odnos dostupno/potrebno, bez dodatka „1 coin”. Stalni pregled pokazuje „0/1” bez žetona i „1/1” sa jednim žetonom. Kada je dugme dostupno, žeton se vrti punom bojom; kada je disabled, miruje i zadržava zlatnu nijansu, ali je prigušen zajedno sa brojem i ostalim sadržajem dugmeta. Natpis i oznaka ostaju u jednom redu, bez odsecanja ili prelivanja. Besplatna partija i radnje koje ne naplaćuju početak nemaju tu oznaku. Vlasnik je 2026-11-20 izričito prihvatio varijantu sa zvezdom kao zvaničnu; zvezda, boja i obod povezuju je sa žetonom na naslovnici. Povezivanje sa stvarnim tokom naplate ostaje u UI-05.

**Granica odobrenja:** animirani novčić je za pojedinačan novčić u prozoru igre. Naslovnica i njene kartice zadržavaju prethodni CSS novčić; ne preuzimaju animaciju ili druge resurse samo zato što postoje u zajedničkom katalogu. Mnoštvo istovremenih rotacija odvlači pažnju, a odobrenje prikaza u prozoru ne odobrava promenu naslovnice.

Odnos dostupno/potrebno pokazuje razlog nedostupnosti bez nove poruke. Uzor je [Grounded u Xbox smernicama](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103#symbols-and-shapes), koji razlikuje raspoložive i potrebne resurse.

Resursi su [coin.gif](../assets/images/ui/coin.gif) za dostupno dugme i [coin-still.png](../assets/images/ui/coin-still.png) za disabled stanje, sa providnom pozadinom. Njihov [izmenjivi 3D izvor](../assets/images/ui/sources/coin-star.html) koristi oblik [Avatarovog žetona](../core3d/objects/Coin.js), dopunjen obodom i zvezdom; model u igri Avatar nije menjan. Uz `prefers-reduced-motion: reduce` koristi se mirni PNG i na dostupnom dugmetu; promena te postavke odmah osvežava prikaz i ne menja dostupnost radnje. Izvor je 96×96, a potvrđeni prikaz na dugmetu 24×24. Oba resursa prikazuju se sa oštrim pikselizovanim ivicama i tankim tamnim obrisom, usklađenim sa okolnim oznakama. UI prikazuje već napravljene resurse; za ovu ikonicu ne pokreće 3D renderer niti uvozi klasu Coin. Putanje pripadaju zajedničkom katalogu iz UI-02, a izbor prema dostupnosti i smanjenom kretanju UI sloju.

**Bez novčića:** sva dugmad koja započinju naplativu partiju imaju native `disabled` stanje, bez poruke, obaveštenja ili dodatnog prozora. Sam izgled dugmeta i novčića mora jasno pokazati nedostatak valute; nije dovoljna neobjašnjiva promena funkcionalnosti. Besplatne igre i radnje bez nove naplate ostaju dostupne. Stanje se osvežava po promeni džepa i dnevnom resetu; greška čitanja džepa nije isto što i potvrđeno stanje nula. Tačan izgled disabled stanja proverava se u prikazu tema; ovaj dogovor još nije ugrađen u aktivni tok igre.

Stalna [UI stranica](../ui.html) u korenu projekta služi za pregled i dalje usklađivanje UI-ja. Prikazuje dogovorenu oznaku naplate u sve tri teme; „Žetoni dostupni” prebacuje aktivno i disabled stanje. Izbori režima su jedno ispod drugog, jednake širine i sa jasnim razmakom. Stranica ne pokreće partiju niti troši novčiće, održava se uz izmene UI-ja i ostaje posle završetka plana.

### Pouke za usklađivanje prikaza

- **Centrirati vidljivi znak, ne samo CSS kutiju.** Kod Play again znaka ↻ flex je pravilno centrirao element, ali je sam znak zbog fontskih metrika bio nacrtan niže. Optičko poravnanje treba da prati veličinu ikonice; posle učitavanja fonta proveriti vidljivi oblik uz natpis u svim temama, na uskom ekranu i u oba stanja dugmeta. Samo očitavanje centra elementa ne dokazuje da ikonica izgleda centrirano.
- **Poreklo resursa ne garantuje uklapanje.** Kadar iz postojećeg 3D modela bez obrisa i sa zaglađenim ivicama odskakao je od pikselizovanih oznaka. Pre pravljenja nove grafike proveriti da li postojeći resurs može da se uskladi načinom prikaza; ovde su bili dovoljni pikselizovano iscrtavanje i tamni obris. Ocenjivati ga na stvarnoj veličini dugmeta, u svim temama, zajedno sa natpisom.
- **Disabled stanje obuhvata ceo sadržaj dugmeta.** Posivljen novčić izgubio je prepoznatljivost, a novčić pune žute boje uz prigušen natpis previše je odskakao. Zadržati njegovu nijansu, prigušiti oznaku naplate zajedno sa ostalim sadržajem i zaustaviti rotaciju. Pri proveri uporediti aktivno i disabled dugme i prelaz nazad; pun intenzitet i animacija moraju se vratiti kada radnja ponovo postane dostupna.
- **Razmak i prelom moraju biti namerni.** Izbori režima bez odvojenog rasporeda delovali su spojeno, a duži natpis sa cenom mogao je da pređe u novi red. Koristiti eksplicitan razmak između dugmadi i držati natpis i cenu u jednom redu; za ovaj izbor pregled koristi vertikalnu grupu dugmadi jednakih širina. Proveravati i najduži natpis na uskom ekranu, bez odsecanja, dodirivanja dugmadi ili prelivanja.

## Provera i održavanje vodiča

Pri promeni UI-ja proveriti temu kroz stvarni start/pauzu/podešavanja/ishod/HUD i lokalne izbore, tastaturu i podržani touch; gašenje i brzu promenu scene proveriti posebno. HTML/reference test nije dokaz fokusa, čitljivosti, prirodnog ishoda ili rasporeda u browseru. Izvršavanje projektnih provera i browsera traži dozvolu prema [DOCS](DOCS.md); komande, pokrivenost i stvarna ograničenja su u [TESTING](TESTING.md#ui-verification-limits).

Osnovni opis UI-ja proveren je čitanjem izvora 2026-11-20, bez izvršnih provera aktivnih scena. Zasebno je u browseru proveren usaglašeni prikaz oznake naplate; [obim i ograničenja provera](TESTING.md#ui-verification-limits) razlikuju taj pregled od stvarne igre. Projektni testovi nisu pokrenuti. Pri refaktoru ažurirati ovaj vodič uz kod. Otvorene odluke i rad pripadaju [planu](PLAN-UI.md), a implementacioni detalji i tačne vrednosti ostaju u izvoru.
