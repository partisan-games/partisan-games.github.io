# Storybook

[storybook.html](../storybook.html) prikazuje igrače i neprijatelje samostalno na praznoj pozornici, da se isproba kako rade. Otvara se na istom serveru kao igre, npr. `/storybook.html`. Nije deo igre, pa ne troši novčiće i nije u meniju; njegove kontrole bira agent, a vlasnik ih pregleda ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Pravila samih blokova su u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi).

## Upotreba

- Storybook prikazuje samo aktere, igrače i neprijatelje, uključujući bibliotečke klase za te uloge; pozadine, okolina, efekti, projektili i predmeti nemaju zasebne priče (odluka vlasnika). Saradnici poput metka ili eksplozije mogu se videti uz aktera tokom pucanja/pogotka, a svetlo, tlo i meta deo su pozornice. Obim određuje uloga, ne folder klase.
- Levo je spisak vrsta (vojnici, tenkovi i vozila, avioni, brodovi, artiljerija i 3D vrste) i njihovih priča. Priča je jedan blok u jednom početnom podešavanju; adresa joj je `#vrsta/priča`, pa se otvara linkom i ostaje posle reload-a.
- Desno su dugmad stanja bloka, zatim pucanja koja blok podržava („Pucaj gore”, „Pucaj pravo”), podešavanja bloka, „Prati kamerom” i „Reset”.
- „Reset” ponovo pravi priču; potreban je jer stanje ne vraća mrtav blok, a blok koji odleti ili odveze se ostaje van ekrana. Isto radi klik na priču u spisku.
- Kamera stoji; „Prati kamerom” drži blok u sredini ekrana. Avion igrača, koji leti brzinom leta, prati od početka i vodi se tastaturom igre.
- Podešavanja menjaju izvezene objekte podešavanja bloka, npr. `rifle` strelca: klizač ide od 0 do četiri puta veće početne vrednosti. Promena ponovo pravi priču, jer blok neke vrednosti čita samo pri stvaranju; „Vrati” i prelazak na drugu priču vraćaju početne vrednosti.

## Pozornica

[Stage2D](../storybook/Stage2D.js) je prazna 2D scena: nebo, tlo, kamera i nevidljivi zamenik igrača (`stage.target`), koga prate blokovi koji lete ili voze za igračem, kao lovac. Zamenik prima pogotke, ali ne strada. Pozornica crta samo blok.

[Stage3D](../storybook/Stage3D.js) je prazna 3D scena: svetlo, pod i kamera koja se mišem okreće oko sredine. Priča koja traži 3D pozornicu to kaže poljem `stage`; njen `create` je asinhron, jer prvo učitava modele. Za 3D lika panel pravi dugmad i od njegovih animacija (`anim.actions`), a lik igrača se vodi tastaturom igre.

## Dodavanje priče

Priče su u [storybook/stories](../storybook/stories/), po jedna datoteka za igru, a [index.js](../storybook/stories/index.js) ih raspoređuje po vrstama. Priča je `{ id, name, game, block, create(stage) }`: `block` je modul bloka (`import Flak, * as flakModule from ...`), a `create` pravi blok, stavlja ga na pozornicu i vraća ga.

Panel čita blok:

- `states`, `state` i `setState(name)` daju dugmad stanja;
- `shots` (tačka ispred bloka i iznad njega za svako pucanje), `forward` (1 desno, -1 levo) i `aimAt(point)` daju dugmad pucanja: dugme nanišani blok u tačku tog pucanja i stavi ga u `fire`;
- [controls.js](../storybook/controls.js) od izvoza modula pravi podešavanja: samo od običnih objekata sa brojevima, da/ne vrednostima i takvim ugnežđenim objektima. Pojedinačna izvezena konstanta se ne može menjati spolja, pa podešavanje koje vredi menjati ide u objekat.

Blok koji ne može da se napravi samo sa opcijama pozornice još nije nezavisan; prvo se refaktoriše po [pravilima](ARHITEKTURA.md#gradivni-blokovi).

## Provere

Pokrivenost aktera grafikom i prioriteti dopuna vode se u [ART](ART.md). Postojanje stanja ili priče samo po sebi ne dokazuje da telo ima poseban animirani klip.

Svaka dopuna arta mora postati dostupna u postojećoj ili novoj priči aktera. Priča i svi nivoi koriste isti objekat i zajedničko mapiranje arta; poseban HTML/GIF pregled nije zamena. Art zadatak se zatvara tek posle [obavezne integracije i provera](ART.md#obavezna-integracija).

[storybookCatalog.test.js](../tests/unit/storybookCatalog.test.js) pravi svaku priču, prolazi kroz sva njena stanja i proverava da svako navedeno pucanje ispali metak. [storybookCoverage.test.js](../tests/unit/storybookCoverage.test.js) traži priču za svakog aktera u navedenim folderima. [storybookControls.test.js](../tests/unit/storybookControls.test.js) proverava podešavanja, a [storybookStage2D.test.js](../tests/unit/storybookStage2D.test.js) pozornicu, praćenje kamerom i da gašenje ne ostavlja rukovaoce na stranici. Izgled se proverava samo okom.

## Granice i odluke

- 3D lik se ne može napraviti u unit testu bez učitanog modela, pa 3D priče proverava browser. Top iz igre Cannon nema priču: puca kroz Ammo fiziku, koju 3D pozornica nema. Oba čekaju sređivanje nivoa koji ih koriste (odluka vlasnika).
- Pozornica prikazuje jednog aktera. Više aktera koji deluju jedan na drugog uvodi se tek ako vlasnik to zatraži.
- Namerno nije preuzeto: biblioteka Storybook i React (traže build), kontrole iz unutrašnjih polja objekta (daju besmislena polja) i upravljanje vremenom igre, poput pauze ili usporavanja (vlasniku ne treba).
