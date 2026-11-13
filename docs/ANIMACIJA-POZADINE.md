# Animacija vatre i dima u Tenkićima

## Rešenje u projektu

- `scenes/tenkici/PozadinaGrada.js` crta izvorni `assets/images/background/razrusen-grad-ww2-pixel.png` i preko njega animirane efekte.
- Efekti se crtaju na transparentnom platnu 724 × 543 i uvećavaju bez zaglađivanja, tako da odgovaraju pikselima pozadine.
- Tri žarišta imaju stalne koordinate. Vrhovi plamena menjaju visinu i otklon neprekidnim funkcijama vremena.
- Dim se podiže, širi i postepeno nestaje. Svaka čestica izbledi pre nego što se njen prostor ponovo upotrebi, čime se izbegava vidljiv skok.
- Dva gusta stuba imaju različitu širinu, brzinu, nagib, veličinu oblačića i ritam emisije. Samo pomeranje početne faze nije dovoljno da izgledaju različito.
- Vreme napreduje kroz `update(dt)` scene: pauza zaustavlja animaciju, a završni ekran ostavlja vatru i dim u pokretu. Nema dodatnih tajmera ni zasebne petlje animacije.

## Šta smo naučili

Zasebno generisani kadrovi vatre i dima nisu automatski povezana animacija: razlike u obliku i položaju stvaraju skakanje. U prvom pokušaju generisana tabla kadrova spojena je u GIF, ali rezultat je u pokretu izgledao neprirodno.

Za ovu pozadinu bolje se pokazala neprekidna animacija u kodu, sa nepomičnim žarištima i odvojenim plamenom i dimom. Originalni grad ostaje neizmenjen.

GIF `assets/images/background/pozadina-dimi.gif` poslužio je kao vizuelni uzor za visoke, tamne stubove sa nepravilnim oblačićima. Gust dim ne treba svesti na dva jednaka konusa: različite siluete zahtevaju različite parametre putanje, širenja i čestica.

## Provera

Pregledati više trenutaka animacije u pregledaču, a ne samo jednu sliku. Proveriti da žarišta ostaju na mestu, čestice nastaju i nestaju bez skoka, a grad izvan efekata ostaje nepromenjen.

Tokom razvoja prikaz je proveravan u lokalnom Edge pregledaču, uz poređenje piksela između trenutaka i praćenje grešaka stranice. Prošli su ESLint za izmenjene module, `npm run check` i `git diff --check`. Cela testna komanda nije prošla jer su u lokalnoj instalaciji nedostajali `@happy-dom/global-registrator` i Playwright paketi; ne predstavljati ovo kao prolazak svih testova.

## Izvori

- [Unity: What is a Particle System?](https://docs.unity.cn/530/Documentation/Manual/PartSysWhatIs.html) — dim se podiže, širi i postaje prozirniji tokom životnog veka.
- [Pixelbolt: Pixel art fire animation](https://skulitom.github.io/Pixelbolt/guides/pixel-art-fire-animation/) — primeri povezanih kadrova i simulacije vatre za piksel animaciju.
