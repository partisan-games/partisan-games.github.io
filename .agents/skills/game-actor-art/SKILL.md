---
name: game-actor-art
description: "Izrađuje i povezuje 2D sprite art aktera sa njihovim radnjama i prelazima u igri. Koristi pri dopuni poza, animacija i završnih prikaza aktera; ne za pozadine, UI ikone ili samostalno sređivanje fizike."
---

# Art aktera u igri

Ova veština važi samo za projekat Partisan Games. Spoji crtež, radnju i prikaz u upotrebljivog aktera; ugovor arta vodi [ART](../../../docs/ART.md), odgovornosti [ARHITEKTURA](../../../docs/ARHITEKTURA.md), a obim provera [TESTING](../../../docs/TESTING.md). Konkretni resursi i nalazi ostaju u tim dokumentima.

## Pre izmene

- Pregledaj stvarnu izvornu sliku i najmanji relevantan lanac potrošača. Prikaz, logiku radnje, mapiranje, pregled i nivoe čitaj u meri u kojoj ih zahtev dotiče; art-only zadatak ne traži pregled celog gameplay-a. Naziv fajla ili klase ne dokazuje pogled, celo telo ni pokrivenost radnji. Razlikuj nedostajući crtež, pogrešno mapiranje i problem simulacije.
- Pre generisanja ili povezivanja proveri šta već postoji u radnoj verziji. Postojeća, nekomitovana dopuna nije nedostajući resurs; ne ponavljaj je samo zato što je nema u `HEAD`-u.
- Pre upotrebe izvorne sličice kao ideje primeni [obaveznu obradu i precrtavanje](../../../docs/ART.md#pravila-pripreme-i-ponovne-upotrebe): pakovanje izvornika u atlas ili proceduralno pomeranje delova ne znači da je osnovni crtež precrtan. Proveri poreklo svih povezanih delova aktera, uključujući vozilo i posadu, pre predaje igri i katalogu.
- Za istorijsku uniformu, oznaku jedinice, šlem ili opremu prvo pročitaj odgovarajući zapis u [ISTORIJA](../../../docs/ISTORIJA.md) i proveri stvarni istorijski izvor. Postojeći pixel art može biti stilska ili identitetska referenca, ali nije dokaz istorijskog izgleda; iz njega ne izmišljaj boje i oznake jedinice.
- Sačuvaj identitet prihvaćenog aktera. Potrebne sposobnosti proceni prema njegovoj ulozi, a ne samo trenutnom nivou; utvrđenu nepotpunost zabeleži bez samovoljnog širenja zadatka. Ako je dogovoren samo art, završi pripremu i jasno označi da povezivanje nije urađeno.

## Ugovor crteža

- Utvrdi pogled, orijentaciju, proporcije, paletu, ćeliju, sidrište/oslonac, razmeru i alfa ugovor. Ne menjaj sudarne mere zbog praznih margina nove slike. Pregledaj i početnu pozu prethodnog stanja, ne samo izdvojeni novi klip.
- Precrtavanje čuva izričito traženi stil originala. Ne tumači „obradi/precrtaj” kao dozvolu za drugi stil, više realizma ili druge proporcije. Očuvanje stila nije očuvanje male rezolucije: prema [pravilu kvaliteta i razmere](../../../docs/ART.md#pravila-pripreme-i-ponovne-upotrebe) obezbedi stvarno nacrtane detalje za najveći planirani prikaz, uključujući krupne kadrove, bez grubog smanjivanja i ponovnog uvećavanja. Pre generisanja navedi koje stilske osobine reference ostaju iste, pa proveri i prirodnu veličinu i najveći prikaz; tehnički test nije dokaz vizuelnog kvaliteta.
- Odredi dozvoljene promene. Kada se traži samo trzaj šaka i oružja, ostatak štiti maskom i proverom piksela; ne pomeraj isečen trup ispod mirne glave. Ta nepomičnost nije pravilo za hod, pad ili radnju koja zahteva pomeranje celog tela.
- Odvoji smer radnje od strane na koju je lik okrenut. Ogledanje je prihvatljivo samo ako čuva traženi izgled i pozu. Bacanje na drugu stranu bez okretanja lika može zahtevati novi pokret, ne ogledanje postojećeg atlasa.
- Uskladi kadrove sa događajem: bomba do otpuštanja ostaje u šaci, projektil/plamen izlazi iz stvarne cevi, a završni kadar ima dogovoreno trajanje i ponašanje. Efekte koje već crta igra ne ugrađuj ponovo u telo.

Za generisanje ili vizuelnu izmenu rastera koristi raspoloživi alat i pravila za slike; uklopi rezultat postojećom ponovljivom pripremom. Sačuvaj izvor, reference, prompt i poreklo, kao i mere, kadrove, trajanja, sidrišta, tačke događaja i hashove koji su potrebni tom potrošaču. Ne propisuj svuda binarnu alfu ili isti broj kadrova: prati ugovor konkretnog arta.

## Faze i granice aktera

- Zdravlje nula ne znači nužno gotovu olupinu. Prati stvarni tok aktera: obaranje, pad, dodir, poleganje ili tonjenje i završetak, gde postoje. Izbor slike i skrivanje delova veži za odgovarajuću fazu. Ne dodaj svakom akteru isto novo stanje samo zato što je jednom avionu trebalo `falling`.
- Proveri ceo završetak: preostalo kretanje, oslonac pri okretanju, poslednju pozu, trajanje krvi/olupine i uklanjanje efekata. Pogrešnu fiziku ne prikrivaj pomeranjem PNG-a; u art zadatku prijavi potreban zahvat van obima umesto da sam menjaš simulaciju.
- Razdvoji aktera od scenografije koju scena sklapa sa njim. Rov nije deo vojnika, dok njegovo oružje ili propeler vozila mogu biti njegovi delovi. Uklanjanje zaklona ne docrtava noge: jasno navedi kada je postojeći art samo gornji deo tela ili krupan kadar.

## Povezivanje i dokaz

- Kada je povezivanje u obimu, koristi zajedničko mapiranje aktera u stvarnom pregledu i pronađenim nivoima. Poseban HTML/GIF nije zamena za povezivanje sa igrom, niti razlog da se napravi druga kopija animacije samo za pregled.
- Pregledaj prelaze i završetak u veličini igre. Provera samo prvog kadra, izabranog naziva klipa ili prisustva fajla ne dokazuje radnju. Ciljana automatizovana provera treba da potvrdi stvarni događaj/ponašanje; stub koji prihvati svaki napad ne dokazuje da zahtev nije izgubljen dok je akter zauzet.
- Biraj provere prema promeni: zaštita piksela i geometrije za atlase, stvarno telo/animator za prelaze, dogovoreni runtime za učitavanje i prikaz. Koristi postojeće dozvole za izvršavanje i ne dodaj punu testnu seriju ili skupe generacije po automatizmu.
- Odvojeno navedi pripremljeno, povezano, stvarno provereno i vlasnikovo prihvatanje. Daj upotrebljiv link do pregleda prema pravilima projekta; prolazak testa ne zamenjuje vizuelni pregled niti dokazuje da ga je vlasnik odobrio.
