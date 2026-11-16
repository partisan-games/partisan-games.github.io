# Ustanak: razoriv teren kao u Worms-u

Đule useca rupu u prednjem sloju zemlje; đulad i borci padaju u stvarni oblik rupe.

| # | Korak | Rezultat | Status |
|---|---|---|---|
| 1 | [T-01](#t-01) · Art prednjeg sloja zemlje | Vlasnik je na snimcima sva tri ambijenta odobrio izgled sloja | 📋 TODO |
| 2 | [T-02](#t-02) · Tlo kao visinska mapa | Rupa je krug usečen u tlo; đulad i borci čitaju istu visinu | 📋 TODO |
| 3 | [T-03](#t-03) · Crtanje i usecanje | Rupa se vidi kao presek: tamni zid kratera i oprljena ivica | 📋 TODO |
| 4 | [T-04](#t-04) · Pad boraca | Borci i topovi padaju do novog tla, ne skaču | 📋 TODO |
| 5 | [T-05](#t-05) · Provere i pregled | Testovi, snimci i vlasnikova odluka da li teren ostaje | 📋 TODO |

## Obim

Samo Ustanak (`scenes/ustanak/`, njegovi testovi i art). Zajednički engine, Tenkići i druge igre se ne menjaju. Ovaj plan zamenjuje sadašnji krater-decal iz koraka 9 [plana Ustanka](PLAN-USTANAK.md); decal se briše, ne ostaje kao druga putanja. Nije u obimu: naginjanje topa između točka i lafeta, rupe ispod površine (pećine), uticaj na štetu i UI.

## Kako se čita

Radi Claude, redom; 1 p je jedan idealan radni dan. Korak je gotov kad su provere iz „Gotovo kada” prošle; T-01 i T-05 traže i vlasnikovo izričito odobrenje. Posle naloga Claude završava jedan korak i čeka „dalje”. Browser se pokreće samo za snimke, jedan Chrome; smoke ne bez posebnog odobrenja. Placeholder nije art ([pravilo](DOCS.md#pravilo-za-umetnost)).

## Osnova

Provereno na `a3ccd89d` uz lokalne izmene koraka 9.

- Borci stoje na liniji ispod točkova, `Top.floorY` ([Top.js:35](../scenes/ustanak/Top.js#L35)), oko 575 px na ekranu od 720; stopala posada i strelca su na tlu + 34 ([artFrame](../scenes/ustanak/artFrame.js#L14), [Posada:55](../scenes/ustanak/Posada.js#L55)), zastavnika na + 32 i + 36. Vidljiva gornja ivica zemlje je 45 px više ([Battlefield:57](../scenes/ustanak/Battlefield.js#L57)), zato pod borcima nema ivice u koju bi se usekla rupa.
- Sadašnji [Terrain](../scenes/ustanak/Terrain.js) čuva kratere kao zdele, a [Battlefield:62](../scenes/ustanak/Battlefield.js#L62) crta `krater.gif` kao šaru. Đule pada kroz `ground.heightAt` ([Djule:13](../scenes/ustanak/Djule.js#L13)), a borci se spuštaju preko `standAt(depth)` (Top, Posada, Strelac, Zastavnik). Ti ugovori ostaju; menja se šta je tlo i kako se crta.
- Ambijenti su pixel art (selo `crnogorsko-selo-1941-pixel.png`), a teksture u `assets/images/textures/terrain/` su fotografije; fotografija direktno u sceni ne pripada stilu.
- AI nišani u središte mete i ispravlja se prema stvarnom padu đuleta ([CannonAI:49](../scenes/ustanak/CannonAI.js#L49)), pa sam radi sa promenjenim tlom.

## Koraci

<a id="t-01"></a>
### T-01 · Art prednjeg sloja zemlje · 0.5 / 1 / 1.5 p · Claude

**Šta:** traka zemlje od `Top.floorY` do dna ekrana, preko donjeg dela pozadine u sve tri runde. Gornja ivica je trava u boji trake sa slike postolja (`top-postolje.gif`, redovi 88–98), da se zelena traka topa stopi sa tlom; ispod je zemlja. Art se pravi iz [dirt.jpg](../assets/images/textures/terrain/dirt.jpg) smanjenjem na pikselnu razmeru scene i svođenjem na paletu tla iz [Battlefield:56](../scenes/ustanak/Battlefield.js#L56); uz to tamnija varijanta za zid kratera i oprljena ivica iz [sprzena-zemlja.jpg](../assets/images/textures/sprzena-zemlja.jpg), istim postupkom. Skripta za pravljenje ostaje u scratchpad-u; u projekat idu samo PNG-ovi u `assets/images/background/`.

**Gotovo kada:** postoje tri PNG-a (sloj, zid, ivica), jedan browser snimak svake runde sa nekoliko izazvanih rupa, i vlasnik je izričito odobrio izgled. Ako ga odbije, korak se ponavlja sa njegovom primedbom; T-03 ne počinje pre odobrenja.

**Zamke:** sloj pokriva ulicu sela i dno grada ispod linije tla; to je deo onoga što vlasnik odobrava. Ivica mora biti na liniji stopala, ne na sadašnjoj ivici polja.

<a id="t-02"></a>
### T-02 · Tlo kao visinska mapa · 0.5 / 0.75 / 1 p · Claude

**Šta:** [Terrain](../scenes/ustanak/Terrain.js) čuva visinu tla po koloni piksela (`Float32Array` širine ekrana), na početku `floorY`. `blast(x, y)` useca krug poluprečnika ~22 px oko tačke pada: za svaku kolonu u krugu visina postaje veća od postojeće i donje ivice kruga. Dno sloja (dno ekrana minus 8 px) je granica. `heightAt(x)` čita kolonu (van ekrana `floorY`), `reset()` vraća ravno tlo, `enabled = false` isključuje usecanje. Lista kratera i `depthAt` po zdelama se brišu; `support`/`settle` ostaju. Djule poziva `blast(x, y)` sa tačkom pada.

**Gotovo kada:** unit testovi pokazuju polukrug posle jednog pada, dublju rupu posle drugog pada u nju, granicu na dnu, ravno tlo posle `reset`, bez promene kad je isključeno, i đule koje pada u rupu eksplodira na njenom dnu. Postojeći testovi Ustanka prolaze.

**Zamke:** rupa se računa iz iste tačke i poluprečnika kao crtanje u T-03, da ne nastanu dva oblika. Đule koje pogodi zid rupe sa strane mora stati na zidu: `landingTime` već traži prvi dodir duž puta, pa ga samo proveriti testom.

<a id="t-03"></a>
### T-03 · Crtanje i usecanje · 0.5 / 1 / 1.5 p · Claude

**Šta:** nov `GroundLayer` u Ustanku drži skriveno platno veličine ekrana. Na početku runde crta sloj iz T-01. Pri `blast` crta oprljenu ivicu u nešto većem krugu (`source-atop`), pa useca krug (`destination-out`). Battlefield posle pozadine crta zid kratera ispod sloja, pa sloj; kroz rupu se vidi tamni zid, ne ulica ili nebo. Brisanje `krater.gif` decal-a, `craterFlattening` i `craters()` iz Battlefield-a.

**Gotovo kada:** browser snimci sve tri runde posle nekoliko izazvanih pada pokazuju rupe tamo gde su đulad pala, sa ivicom i zidom, a ne decal; posle nove runde sloj je ceo. Unit test proverava da `blast` useca i Terrain i sloj istim krugom (mock konteksta beleži krug).

**Zamke:** happy-dom nema 2D platno; crtanje testirati kroz zabeležene pozive, a izgled samo snimkom. Skriveno platno se pravi jednom po sceni i pušta u `end()`.

<a id="t-04"></a>
### T-04 · Pad boraca · 0.25 / 0.5 / 1 p · Claude

**Šta:** kad se tlo pod stopalom spusti, borac pada gravitacijom do nove visine umesto da skoči. `Terrain.update(dt)` pomera tekuću dubinu svakog oslonca ka visini pod stopalom i poziva `standAt`; Main ga poziva u `update`, pa pauza i kraj meča rade kao za ostale objekte. Top pada po točku (`footX`), ceo, bez naginjanja.

**Gotovo kada:** unit test meri da dubina raste sa vremenom, ne prelazi tlo, stoji u pauzi i vraća se na nulu u novoj rundi; pogodak u top koji pada pogađa njegov trenutni položaj (collider prati telo).

**Zamke:** borac ne sme pasti ispod dna sloja; zastavnikova zastava pada sa njim ([Zastavnik:19](../scenes/ustanak/Zastavnik.js#L19)).

<a id="t-05"></a>
### T-05 · Provere i pregled · 0.25 / 0.5 / 1 p · Claude

**Šta:** ceo unit skup, lint i `npm run check`; jedan browser snimak po rundi. Ugovor tla (jedna visinska mapa za đulad, borce i crtanje) kratko u [arhitekturi](ARHITEKTURA.md). U [planu Ustanka](PLAN-USTANAK.md) korak 9 upućuje na ishod.

**Gotovo kada:** provere prolaze ili su pošteno navedene, vlasnik je odigrao partiju i rekao da li teren ostaje. Posle toga se ovaj plan briše, a pouke ostaju u dokumentaciji.

## Raspored

Jedan izvršilac. Ukupno **2 / 3.75 / 6 p**: T-01 i T-02 **1 / 1.75 / 2.5**, T-03 i T-04 **0.75 / 1.5 / 2.5**, T-05 **0.25 / 0.5 / 1**. T-02 ne zavisi od izgleda, pa se može raditi dok vlasnik gleda snimke iz T-01. [Raspored](plan-teren.json).

## Rizici

Sloj menja donji deo sva tri ambijenta: ako vlasnik ne prihvati nijedan izgled, teren ostaje bez Worms-a i odluka se vraća u korak 9. Veličina platna se čita jednom pri učitavanju scene ([Main:19](../scenes/ustanak/Main.js#L19)); promena prozora usred runde ne pomera visinsku mapu, kao ni sadašnje tlo. Duboka rupa ispod topa može ga spustiti tako da AI ili igrač teško pogađa; dubinu ograničava dno sloja, a vlasnik je procenjuje u T-05.
