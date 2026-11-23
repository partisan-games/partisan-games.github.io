# PLAN

Trajni spisak otvorenih poslova i ideja; završene stavke se uklanjaju, ovaj dokument ostaje.

**Status:** 📋 TODO · 🔄 In progress · ⛔ Blocked.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| | **[Art](#art)** | | | |
| 1 | [AR-P06](#ar-p06) | Precrtati krupnije slike manje od prikaza i vratiti stvarne veličine avionima u Visu | Codex, Claude | 📋 TODO |
| | **[Igre i ideje](#igre)** | | | |
| 2 | [IG-14](#ig-14) | Izabrati sledeće aktere od postojećeg arta | Vlasnik, Claude, Codex | 📋 TODO<br>Waiting: izbor kandidata [1](#note-1) |
| 3 | [IG-18](#ig-18) | Razmotriti pomeranje prizora i iskakanje protivnika u Otpisanima ili Neretvi | Vlasnik | 📋 TODO |
| 4 | [IG-19](#ig-19) | Dogovoriti nazive nivoa i prikaz žanra i godine na naslovnoj | Vlasnik | 📋 TODO |
| 5 | [IG-20](#ig-20) | Razmotriti nivo odbrane položaja odozgo, sa napadima sa svih strana | Vlasnik | 📋 TODO |
| 6 | [IG-21](#ig-21) | Razmotriti kampanju Jablanice i kolonu kamiona | Vlasnik | 📋 TODO |
| 7 | [IG-22](#ig-22) | Razraditi dodatne etape Neretve | Vlasnik | 📋 TODO |
| 8 | [IG-24](#ig-24) | Odlučiti o anahronim parolama u Liberated City | Vlasnik | 📋 TODO |

## Održavanje plana

Ovo je jedino mesto za otvorene poslove, nalaze, ideje i preostale preglede. Nove oblasti dobijaju sekciju ovde, ne novi fajl plana ili TODO u matičnoj dokumentaciji. PLAN se čuva u gitu i ostaje i kada nema otvorenih stavki. Dokumentacija vodi ka sekcijama, da završetak stavke ne pokvari njene veze; sekcija koja ostane bez stavki briše se sa poslednjom, a veze ka njoj se preusmeravaju.

Po završetku ukloniti stavku i njene nepotrebne beleške. Korisne potvrđene odluke i ograničenja sačuvati u postojećem matičnom dokumentu, bez dnevnika rada; zatim popraviti preostale reference. ID-jeve stavki ne koristiti ponovo. Premeštanje stavke nije nova provera ni prihvatanje, a izbor ideje nije automatski nalog za izradu.

Važe [DOCS](DOCS.md), [ugovor arta](ART.md#obavezna-integracija) i [arhitektura](ARHITEKTURA.md). Izvršene dokaze i ograničenja čuva [TESTING](TESTING.md). Vlasnikovi pregledi su odvojeni od završenog povezivanja; ne uvode novu blokadu bez njegovog izričitog uslova. Ranije završene provere ne ponavljati zbog reorganizacije plana.

## Art

<a id="ar-p06"></a>
### AR-P06 · Slike manje od prikaza

Po [pravilu razmere](ART.md#razmera) slika nikad nije manja od prikaza u igri; sitnija se precrtava, ne uvećava. Prema merenju u katalogu manje od svoje osnove su: Sd.Kfz. 251 (1,8 puta), brodovi u Čamcu (oko 1,6 puta), Nemac i Četnik spreda (1,45 puta, u Otpisanima), He 111 i Storch iz Kluza (oko 1,2 puta) i M15/42, StuG III i Hotchkiss (oko 1,1 puta). Avionima u Visu vratiti stvarne veličine tela (sada su 1,3 do 2,5 puta veći) i podesiti razmeru igre tako da se igranje ne promeni. Krupnije slike se ne umanjuju.

### Mogućnosti bez naloga za izradu

Olupina poljskog topa može postati zaseban rekvizit bojišta; još nije raspoređena kao takav rekvizit. Novi efekat vode traži posebno odgovarajuće rešenje, jer je prethodno proceduralno rešenje odbačeno. Dodatni desanti na Brač, Mljet i Korčulu ostaju ideje za igru uz istorijsku proveru, a ne zadaci izrade arta. Rezervni vojnički listovi i sezonske pozadine nisu obaveza za povezivanje: koriste se tek kada ih izabrani akter ili nivo zatraži.

<a id="igre"></a>
## Igre i ideje

<a id="ig-14"></a>
### IG-14 · Kandidati za vlasnikov izbor

Kandidati nisu nalog za izradu. Posle izbora dopuniti art, telo, zajednički prikaz i priču u katalogu, povezati aktera sa igrom i odigrati nivo.

- **Frontalni neprijatelji:** [strelac](../catalog.html#vojnici/otpisani-strelac) i [stražar](../catalog.html#vojnici/otpisani-strazar) čekaju vlasnikov izbor za nivo. Stražar u šinjelu dozvoljen je samo zimi.

- **Vis:** partizanski [Hurricane, Spitfire i Il-2](../assets/images/armies/partizani/avioni/) odozgo.
- **Do Trsta (izbor vlasnika, 2026-11-23, samo nemačka vozila):** [motor Zündapp K600 sa dvojicom](../assets/images/armies/nemci/motori/zundapp-k600.png), [trokolica BMW R12 sa dvojicom](../assets/images/armies/nemci/motori/bmw-r12-03.png), [oklopni automobil Sd.Kfz. 231](../assets/images/armies/nemci/vozila/sdkfz-231-02.png), [oklopni automobil Pz.Kpfw. 612 (37 mm)](../assets/images/armies/nemci/vozila/pzkpf612-37mm.png), [oficirski automobil Mercedes 830 BL](../assets/images/armies/nemci/vozila/830bl-02.png), [lovac tenkova Marder II (76 mm)](../assets/images/armies/nemci/tenkovi/panzer2d-76mm.png), [lovac tenkova Elefant](../assets/images/armies/nemci/tenkovi/elefant-01.png). Biraju se po raznovrsnosti, ne po istorijskoj vernosti.
- **Ustanak:** [italijanski top 47 mm sa posadom i minobacači](../assets/images/armies/talijani/artiljerija/); zahteva novu odluku o proširenju dvoboja.
- **Pešadija:** italijanski, britanski, ruski, četnički i SS vojnici; potrebni su atlasi pokreta.
- **Otpisani:** nemački motociklista sa mitraljezom.

<a id="ig-18"></a>
### IG-18 · Arkadni prizor iz prvog lica

Ideja iz README-a: Otpisani ili Neretva mogu dobiti pomeranje prizora i protivnike koji iskaču. Konkretna igra, tok i obim još nisu izabrani.

<a id="ig-19"></a>
### IG-19 · Nazivi i oznake nivoa

Osmisliti nazive nivoa i dogovoriti prikaz žanra i godine na naslovnoj. Pre izmene UI-ja odobriti konkretne tekstove i elemente prema [DOCS](DOCS.md#odobravanje-ui-elemenata).

<a id="ig-20"></a>
### IG-20 · Odbrana položaja

Ideja iz README-a: pogled odozgo i napadi sa svih strana, nalik igrama tipa tower defense. Kontekst, akteri i cilj nivoa još nisu razrađeni.

<a id="ig-21"></a>
### IG-21 · Kampanja Jablanice

Moguće etape su Prozor, Rama i Jablanica, sa zasedom kod Drežnice kao kandidatom. Kolona kamiona pokušava proboj putem uz reku. To su ideje, ne nalog za izradu; mesta imaju različite događaje i ne treba ponavljati isti bunker. Istorijske granice su u [ISTORIJA](ISTORIJA.md#neretva-februar-1943--napadi-na-italijanske-garnizone-igra-battle-for-jablanica).

<a id="ig-22"></a>
### IG-22 · Dodatne etape Neretve

Italijanske i ustaške etape ostaju kandidati uz postojeće Nemce i četnike. Izabrati mesta, datume, jedinice i borbene uloge, trajanje i prelaze, pa tek onda art i tok igre. Postojeći rov nije istorijski dokaz budućeg sastava.

<a id="ig-24"></a>
### IG-24 · Parole Bihaća

Liberated City je Bihać krajem 1942. Natpisi o dolasku Crvene armije i plakat RED_ARMY_IS_HERE pripadaju drugom okviru; vlasnik bira zamenu ili uklanjanje pre izmene sadržaja.

## Notes

Waiting: čeka navedeni zavisni posao.

1. <a id="note-1"></a>**IG-14:** pet prethodno izabranih aktera je povezano; [art](ART.md#dopune-iz-plana-ideja--predaja-arta) i [provere](TESTING.md#predaja-arta-iz-plana-ideja). Čeka se izbor novih kandidata.
