# Storybook

[storybook.html](../storybook.html) prikazuje svaki gradivni blok sam na praznoj pozornici, da se isproba kako radi. Otvara se na istom serveru kao igre, npr. `/storybook.html`. Nije deo igre, pa ne troši novčiće i nije u meniju; njegove kontrole bira agent, a vlasnik ih pregleda ([pravilo](DOCS.md#odobravanje-ui-elemenata)). Pravila samih blokova su u [arhitekturi](ARHITEKTURA.md#gradivni-blokovi).

## Upotreba

- Levo je spisak vrsta (vojnici, tenkovi i vozila, avioni) i njihovih priča. Priča je jedan blok u jednom početnom podešavanju; adresa joj je `#vrsta/priča`, pa se otvara linkom i ostaje posle reload-a.
- Desno su dugmad stanja bloka, zatim pucanja koja blok podržava („Pucaj gore”, „Pucaj pravo”), „Prati kamerom” i „Reset”.
- „Reset” ponovo pravi priču; potreban je jer stanje ne vraća mrtav blok, a blok koji odleti ili odveze se ostaje van ekrana. Isto radi klik na priču u spisku.
- Kamera stoji; „Prati kamerom” drži blok u sredini ekrana.

## Pozornica

[Stage2D](../storybook/Stage2D.js) je prazna 2D scena: nebo, tlo, kamera i nevidljivi zamenik igrača (`stage.target`), koga prate blokovi koji lete ili voze za igračem, kao lovac. Zamenik prima pogotke, ali ne strada. Pozornica crta samo blok.

## Dodavanje priče

Priče su u [storybook/stories](../storybook/stories/), po jedna datoteka za igru, a [index.js](../storybook/stories/index.js) ih raspoređuje po vrstama. Priča je `{ id, name, game, block, create(stage) }`: `block` je putanja modula, a `create` pravi blok, stavlja ga na pozornicu i vraća ga.

Panel čita blok:

- `states`, `state` i `setState(name)` daju dugmad stanja;
- `shots` (tačka ispred bloka i iznad njega za svako pucanje), `forward` (1 desno, -1 levo) i `aimAt(point)` daju dugmad pucanja: dugme nanišani blok u tačku tog pucanja i stavi ga u `fire`.

Blok koji ne može da se napravi samo sa opcijama pozornice još nije nezavisan; prvo se refaktoriše po [pravilima](ARHITEKTURA.md#gradivni-blokovi).

## Provere

[storybookCatalog.test.js](../tests/unit/storybookCatalog.test.js) pravi svaku priču, prolazi kroz sva njena stanja i proverava da svako navedeno pucanje ispali metak. [storybookStage2D.test.js](../tests/unit/storybookStage2D.test.js) proverava pozornicu, praćenje kamerom i da gašenje ne ostavlja rukovaoce na stranici. Izgled se proverava samo u browseru.
