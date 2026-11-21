# Žive pozadine

## Obavezno pravilo

Svaka pozadina ima živ ambijent, naročito kada prikazuje dim i vatru. Osnovnu sliku pripremiti bez zamrznutih plamenova i stubova dima, pa efekte dodati pokretnim slojevima. Dodavanje jedne animacije preko slike sa ostalim nepomičnim požarima nije dovoljno. Kretanje prati vreme scene: miruje u pauzi, traje posle pobede i poraza.

Proveravati same slojeve efekata kroz više trenutaka, uz pauzu i ishod; promena cele slike zbog aviona ili zastave ne dokazuje da dim radi.

Ako igra ima vetar, jedan izvor smera i jačine upravlja i balistikom i povezanim efektima: dimom i vrhovima plamena. Žarišta ostaju na mestu; pomera se dim i savija plamen. Brzinu efekata prevoditi u koordinate njihovog platna, da druga rezolucija ne promeni smer ili prividnu jačinu. Proveriti oba smera, različite jačine, isključen vetar, pauzu i nastavak posle ishoda; vetar samo na granatama nije završen efekat.

U Ustanku zastave po izričitoj odluci vlasnika zadržavaju položaj i smer ka sredini ekrana, nezavisno od vetra. Obe koriste jedan statičan crtež platna i isti talas iz zajedničkog vremena scene; ne dodavati promenu unapred nacrtanih kadrova samo jednoj zastavi. Promena smera sekla je levu zastavu na ivici ekrana; top i raspored boraca ne pomerati zbog tog efekta. Zastave nisu pokazatelj smera vetra.

## Ustanak

[Battlefield](../scenes/ustanak/Battlefield.js) smenjuje Grahovo, Viluse i okolinu Nikšića, a zajednički [BattleBackground](../scenes/tenkici/BattleBackground.js) crta osnovu i žarišta na posebnom transparentnom platnu. Slika i efekti koriste isto poravnanje sa fizičkim tlom; Ustanak dodaje svoj prednji zemljani sloj i prosleđuje vetar. Browser provera poredi direktno sloj vatre/dima, uključujući pauzu i nastavak posle pobede.

## Tenkići

- `scenes/tenkici/BattleBackground.js` crta izvorni `assets/images/background/razrusen-grad-ww2-pixel.png` i preko njega animirane efekte.
- Efekti se crtaju na transparentnom platnu 724 × 543 i uvećavaju bez zaglađivanja, tako da odgovaraju pikselima pozadine.
- Tri žarišta imaju stalne koordinate. Vrhovi plamena menjaju visinu i otklon neprekidnim funkcijama vremena.
- Dim se podiže, širi i postepeno nestaje. Svaka čestica izbledi pre nego što se njen prostor ponovo upotrebi, čime se izbegava vidljiv skok.
- Dva gusta stuba imaju različitu širinu, brzinu, nagib, veličinu oblačića i ritam emisije. Samo pomeranje početne faze nije dovoljno da izgledaju različito.
- Vreme napreduje kroz `update(dt)` scene: pauza zaustavlja animaciju, a završni ekran ostavlja vatru i dim u pokretu. Nema dodatnih tajmera ni zasebne petlje animacije.

## Deljenje pozadine između nivoa

Liniju tla meriti u pikselima izvornog PNG-a, od gornje ivice. Ona označava naslikanu granicu ravne borbene površine, ne visinu planinskog horizonta niti automatski tačku oslonca svakog aktera. Žarišta i regioni koriste isti koordinatni sistem; pri skaliranju prate isto mapiranje kao deo slike na kome leže. Sačuvati oštrinu piksela i poravnati gornji i donji deo prema geometriji nivoa, bez odsecanja ključnih motiva.

Ustanak i Tenkići trenutno imaju različitu geometriju: u Ustanku je `groundLevel` na 75% visine, ispod njega su oslonac topa i zemljani sloj; Tenkići na 80% visine postavljaju **centre** tenkova. Procenat iz metapodataka zato nije dovoljan za zamenu pozadine ili pomeranje jedinica. Proveriti posebno naslikanu ivicu, oslonce i fizičko tlo projektila; pri pregledu Ustanka dodati stvarni prednji zemljani sloj, koji može sakriti donji deo slike. Izvori su [Battlefield](../scenes/ustanak/Battlefield.js), [Top](../scenes/ustanak/Top.js), [GroundLayer](../scenes/ustanak/GroundLayer.js) i [Tenkići](../scenes/tenkici/Main.js).

Pomoćni PNG sa stvarnim artom i merama može proveriti kompoziciju bez pokretanja igre; ne dokazuje runtime transformacije, učitavanje, efekte, vetar, pauzu ili ishod. Osnovna slika bez efekata je art sloj; živ ambijent je završen tek kada igra pokreće njegove slojeve kroz vreme scene.

## Šta smo naučili

Zasebno generisani kadrovi vatre i dima nisu automatski povezana animacija: razlike u obliku i položaju stvaraju skakanje. U prvom pokušaju generisana tabla kadrova spojena je u GIF, ali rezultat je u pokretu izgledao neprirodno.

Za ovu pozadinu bolje se pokazala neprekidna animacija u kodu, sa nepomičnim žarištima i odvojenim plamenom i dimom. Originalni grad ostaje neizmenjen.

GIF `assets/images/background/pozadina-dimi.gif` poslužio je kao vizuelni uzor za visoke, tamne stubove sa nepravilnim oblačićima. Gust dim ne treba svesti na dva jednaka konusa: različite siluete zahtevaju različite parametre putanje, širenja i čestica.

## Provera

Pregledati više trenutaka animacije u pregledaču, a ne samo jednu sliku. Proveriti da žarišta ostaju na mestu, čestice nastaju i nestaju bez skoka, a grad izvan efekata ostaje nepromenjen.

Pri proveri u browseru porediti same slojeve efekata, proveriti mirovanje u pauzi i nastavak posle pobede, i vizuelno pregledati različite trenutke uz praćenje grešaka stranice.

## Izvori

- [Unity: What is a Particle System?](https://docs.unity.cn/530/Documentation/Manual/PartSysWhatIs.html) — dim se podiže, širi i postaje prozirniji tokom životnog veka.
- [Pixelbolt: Pixel art fire animation](https://skulitom.github.io/Pixelbolt/guides/pixel-art-fire-animation/) — primeri povezanih kadrova i simulacije vatre za piksel animaciju.
