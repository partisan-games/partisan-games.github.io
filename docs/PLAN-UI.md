# Standardni UI: preostali posao

Pouzdanost ulaza, naplata žetonom, zajedničke ikonice i birač teme su ugrađeni; ostaju vizuelni pregled, završna provera i uslovne dopune.

**Status:** 📋 TODO · 🔄 In progress · ✅ Done · ⛔ Blocked · — Not assessed.

| # | ID | Posao | Ko | Status |
|---|---|---|---|---|
| 1 | [UI-03](#ui-03) | Prozori, opisi i raspored HUD-a: snimci u browseru i vlasnikov pregled | Claude, vlasnik | ⛔ Blocked<br>Čeka dozvolu za browser i vlasnikov pregled |
| 2 | [UI-04](#ui-04) | Završna provera osnovnog paketa | Claude | 🔄 In progress<br>Unit testovi, lint i ceo smoke prošli posle ispravki ([dokaz](TESTING.md#ui-verification-limits)); ostaje posle UI-03 |
| 3 | [PD-3](#pd-3) | Odluka: koje touch komande i pristup pauzi dodati | Vlasnik | 📋 TODO |
| 4 | [UI-08](#ui-08) | Dopune touch komandi · uslovno, posle PD-3 | Claude | 📋 TODO |
| 5 | [PD-4](#pd-4) | Odluka: šta Esc radi u centralnim prozorima | Vlasnik | 📋 TODO |

Pravila i odluke koje su nastale u ovom planu su u [UI vodiču](UI.md) i [DOCS](DOCS.md#ulaz-u-igre-i-novčići). Provere se pokreću samo uz vlasnikovu dozvolu, smoke u jednom Chrome-u. Agent ne pravi commit.

<a id="ui-03"></a>
## UI-03 · Prozori, opisi i raspored HUD-a

- **Šta:** u svakoj temi (simple, rpg, white) prozori, dugmad, HUD i kontrole izgledaju kao celina u svim igrama, uključujući sedam prilagođenih startova, rundu Ustanka, HUD van `#ui`, Controls, poruke i grešku rutera. Opisi komandi su tačni; levi Shift i PageUp/PageDown ostaju skriveni ([UI](UI.md#komande-tastatura-i-touch)). Sadržaj igara se ne izjednačava.
- **Gotovo kada:** snimci svih menjanih varijanti i tema na 1280×800, 320×568, 390×844 i 844×390 pokazuju da nema prelivanja, nedostupnih dugmadi ni preklapanja prozora, HUD-a, touch kontrola i kamere; vlasnik je pregledao snimke. Posle vizuelnih izmena ponovljeni su smoke slučajevi starta i naplate.
- **Zamke:** `min-width: 320px` i z-index iz CSS-a ne dokazuju da prikaz staje na ekran; deljeni health bar nije uvek u `#ui`; samo Vis ima svoj scroll. Stare HTML reference se ne presnimavaju grupno da bi testovi prošli.

<a id="ui-04"></a>
## UI-04 · Završna provera osnovnog paketa

- **Šta:** posle UI-03 redom `npm run lint`, `npm test`, `npm run check`, `npm run smoke -- --workers=1`, plus izvršni scenariji koje automatske provere ne pokrivaju:
  - svaka opcija prilagođenih startova (tri avatara, pet aviona Warplane-a, četiri aviona Visa, Tenkići i Ustanak 1P/2P) sa naplatom, Play again i povraćajem pri neuspelom učitavanju;
  - Tab/Shift+Tab, Enter/Space na dugmadima i strelice na Volume, bez gađanja u igri; povratak iz drugog taba;
  - touch: dva istovremena pritiska, pointercancel, pristup pauzi i meniju.
- **Gotovo kada:** sve komande prolaze na konačnoj radnoj kopiji, a scenariji su izvršeni ili ih je vlasnik izričito preuzeo; rezultat je upisan u [TESTING](TESTING.md#ui-verification-limits). Emulacija u browseru se beleži odvojeno od fizičkog uređaja.

<a id="pd-3"></a>
## PD-3 · Touch komande i pauza

Touch nije ekvivalent tastature: nema trčanja, bočnog kretanja, kočnice vozila ni brzine Zeppelina; Sorceress ima leteći skok bez touch dugmeta; Tenkići, Ustanak i Do Trsta nemaju touch, a FPS isključuje joystick. Touch nema ni dugme za pauzu, pa ni put do podešavanja i menija. Vlasnik bira koje radnje dobijaju kontrolu i kako se dolazi do pauze; do tada ograničenja ostaju.

<a id="ui-08"></a>
## UI-08 · Dopune touch komandi · uslovno

- **Okidač:** vlasnik u PD-3 odobri konkretne kontrole, sa rasporedom i oznakama. Bez toga se ne radi.
- **Šta:** samo odobrene radnje dobijaju touch kontrolu istog značenja i pravila držanja kao tastatura, kroz [Touch](../core/io/Touch.js) i [Input](../core/io/Input.js); tastatura se ne menja.
- **Gotovo kada:** svaka odobrena radnja ima isti efekat kao na tastaturi, bez preklapanja, dvostrukog okidanja i zaglavljenog ulaza; ciljane i browser provere izvršene uz dozvolu.

<a id="pd-4"></a>
## PD-4 · Esc u centralnim prozorima

Tokom igre Esc otvara pauzu, a u pauzi i ostalim centralnim prozorima ne radi ništa; pravilo „kao Esc” u DOCS to ne opisuje tačno ([UI](UI.md#prozori-i-prelazi)). Vlasnik odlučuje da li Esc iz prozora vraća u igru, u meni ili ostaje kako jeste.
