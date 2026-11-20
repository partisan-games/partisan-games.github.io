# Dokumentacija

Zahtevne operacije, naročito velike testne serije, buildovi i paralelni browseri, zahtevaju posebno izričito odobrenje pre pokretanja. Priprema za komit i ranija dozvola za ciljane testove ne daju tu dozvolu; unapred navesti obim i očekivano opterećenje.

Zajednička osnova za razvoj 2D i 3D igara, sa istorijski zasnovanim sadržajem.

## Gde pripada znanje

| Oblast | Autoritativno mesto | Sadržaj |
|---|---|---|
| Istorija | [Istorijski izvori](ISTORIJA.md) | Činjenice sa izvorima: vojske, periodi, područja, jedinice, vozila, avioni i oružje. |
| Konteksti igara | [KONTEKST](KONTEKST.md) | Okvir, priča, protivnici, prikaz i prihvaćeni art svake igre i njenih etapa. |
| Ugao 2D arta | [Indeks prikaza](../assets/images/armies/index.csv) | Vizuelne oznake za izbor bočnih, gornjih i drugih prikaza, uz same slike. |
| Arhitektura i obrasci | [ARHITEKTURA](ARHITEKTURA.md) | Odgovornosti zajedničkog engine-a, obrasci i bitna ograničenja. |
| UI | [UI](UI.md) | Principi, teme, prozori, HUD, komande i praktična upotreba postojećeg UI-ja. |
| Učenje kompozicije | [Kompozicija umesto nasleđivanja](COMPOSITION.md) | Uporedni primeri i sastavljanje zdravlja i oružja. |
| Provere | [TESTING](TESTING.md) | Komande, pokrivenost i ograničenja provera. |
| Isprobavanje blokova | [Storybook](STORYBOOK.md) | Upotreba storybook-a i dodavanje priča za blokove. |
| Posebna tehnika prikaza | [Animacija pozadine](ANIMACIJA-POZADINE.md) | Konkretno rešenje, neuspešni pristupi i preventivne provere. |
| Agentovi poslovi | [TODO](TODO.md) | Agentove razvojne stavke, pregledi i potrebne popravke. |
| Razvoj igre | Planovi igara (`docs/PLAN-*.md`) | Koraci izrade i statusi; nije trajna baza znanja. Planovi su u gitu, nikad u `.git/info/exclude`. |

Pokretanje projekta opisuje [README](../README.md). Istorijske slike i poreklo čuvaju se u [references/ww2-yu](references/ww2-yu/), a merni artefakti se povezuju iz tehničkog opisa.

## Kako zapisujemo znanje

HTML stranice čuvati van `docs`; iz dokumentacije voditi linkove do njih.

Osoba koja vodi projekat i daje naloge agentu u dokumentaciji se naziva vlasnik projekta.

Glavni principi: **bez dupliranja informacija** i **bez podataka koji brzo zastarevaju promenom koda i zahtevaju često ručno ažuriranje**.

Jedna činjenica ili odluka ima jedno autoritativno mesto; ostali dokumenti vode link do njega. Dokumentujemo trajne odluke, razloge, ograničenja i istorijske izvore. Ne prepričavamo implementaciju: spiskovi klasa i metoda, potpisi API-ja, brojevi igara i testova i slični promenljivi podaci ostaju u kodu i alatima koji ih već prikazuju. Pišemo po temi, bez dnevnika završenih koraka i kopiranja celih planova.

Zapis čuvamo samo ako daje trajno znanje koje nije već dostupno na drugom mestu. Uz odluku navesti razlog i bitno ograničenje; uz istorijsku tvrdnju izvor i kontekst. Ako je merenje neophodno za razumevanje ograničenja, povezati dokaz sa datumom/revizijom, bez održavanja prepisa rezultata. Predloge i otvoren posao voditi u postojećem TODO-u ili povezanom planu, a ne kao važeću arhitekturu.

Istorijski zapis dodatno prati period, područje, korisnika opreme i varijantu; tehnički zapis prati vlasnika stanja, zavisnosti i životni ciklus. Detaljni obrasci su u odgovarajućim dokumentima. Postojeći art u `assets` ostaje istorijski prihvaćen prema [vlasnikovoj odluci](KONTEKST.md#prihvaćen-art-projekta).

Pre rada pročitati relevantnu istorijsku temu, arhitektonska pravila i ugovor sistema koji se menja. Posle rada ažurirati postojeći zapis; novu datoteku otvarati samo za samostalnu temu koja bi opteretila postojeću. Plan nije dokaz implementacije, a razvojni cilj nije tvrdnja da danas nema tehničkog duga.

Pre brisanja bilo kog plana obavezno pregledati njegov sadržaj i sačuvati korisne odluke, potvrđene nalaze, uzroke grešaka i ograničenja u postojećem autoritativnom dokumentu, bez dupliranja. Proveriti da su zapisi dostupni i ukloniti linkove do obrisanog plana; tek tada obrisati plan. Ovo se radi uvek, bez vlasnikovog podsećanja. Nepokrenute provere ne predstavljati kao izvršene.

## Odobravanje UI elemenata

Svaki novi UI element zahteva prethodno izričito odobrenje vlasnika, uključujući brojače, tekstove, indikatore, dugmad i obaveštenja. Nalog za izmenu gameplay-a ili završetak plana sam po sebi ne odobrava dodavanje UI elemenata.

Isto važi za izmenu postojećih UI tekstova: uvoda, poruka, ishoda, natpisa dugmadi i opisa kontrola. Izuzetak je usklađivanje teksta sa promenjenim gameplay-om bez kreativnosti i bez novih termina (npr. uklonjen tenk iz uvoda, „refuel” kad goriva više nema): radi se odmah i javlja vlasniku. Sve ostalo čeka odobrenje; do tada stari tekst ostaje, a predlog se pokazuje vlasniku.

Za uputstva postojećih komandi važi dodatna odluka vlasnika: nedostajuće i netačne opise ispravljati automatski prema stvarnom kodu. Pitanje je potrebno kada dva tastera rade isto, a jedan je već naveden; skrivene prečice i granice ovog odobrenja opisuje [UI vodič](UI.md#komande-tastatura-i-touch).

Pravilo važi za sadržaj igara. Razvojne stranice za pregled, kao [ui.html](../ui.html) i `storybook.html`, nisu igra: agent sam bira njihove kontrole i tekstove, a vlasnik ih pregleda kad su gotove (odluka vlasnika, 2026-11-20).

Ni planirana mogućnost uključivanja/isključivanja opcije ne odobrava checkbox, indikator ili drugo UI rešenje. Pre izmene prikazati konkretan predlog i sačekati izričito odobrenje; do tada pripremiti samo logiku.

Uvodni tekst je kratak, jedna rečenica zadatka (npr. „Destroy the enemy and land on the airfield!”). Uvodni ekran svakog nivoa ima samo dugme za početak (ili izbor načina igre), bez glavnog menija; tako je vlasnik odlučio. Redosled dugmadi na ostalim centralnim ekranima (pauza, podešavanja, runda, kraj, greška) je isti: gornje dugme vraća na glavni meni, kao Esc, a donje potvrđuje ili nastavlja igru. Dugme za glavni meni pravi zajednički `mainMenuButton` iz [UI](../ui/UI.js).

## UI stilovi

Autoritativni opis tema i potvrđenog korisničkog izbora je u [UI vodiču](UI.md#stilovi); odobravanje novih elemenata i tekstova ostaje uređeno pravilom iznad.

## Ulaz u igre i novčići

Odluka vlasnika od 2026-11-20: igre koje nemaju startni prozor ostaju besplatne i kreću odmah po učitavanju, bez dodavanja prozora za novčić ili starta. To važi i za direktan link, reload i ponovnu igru; dostupnost novčića i njihovog skladišta ne sme uslovljavati besplatnu igru.

Za igre sa startnim prozorom ostaje jedan prozor pre početka: Start ili izbor režima naplaćuje jedan novčić, a kartica u glavnom meniju ne naplaćuje. Play again naplaćuje novu partiju i pokreće je sa istim prethodnim izborom, bez ponavljanja startnog prozora. Preskakanje tog prozora pri replay-u ne menja cenu igre. Cilj je manje klikova, uz jasno prikazanu cenu; konkretni novi natpisi i poruke i dalje traže prethodno odobrenje po pravilu iznad. Ovo je pravilo željenog ponašanja, ne potvrda da ga trenutni kod sprovodi.

## Tasteri

Načelno je Space skok kad lik skače, inače pucanje. Izuzeci su dozvoljeni, npr. kočnica 3D tenka i desni igrač za dvoje (Enter). Tasteri su u [keys.js](../core/io/keys.js).

## Pravilo za umetnost

Art i zvukovi su obavezni delovi svake igre. Uključiti ih u početni plan, bez čekanja da ih vlasnik zatraži: grafiku i animacije, zvukove radnji i ambijenta, usklađivanje sa događajima i kontrolu jačine/utišavanja. Pre završetka proveriti oba; funkcionalan gameplay sam po sebi nije završena igra.

Placeholder nije art, ni za pregled: igre su realistične ratne, pa nacrtani oblici (elipse, pravougaonici) deluju crtano. Pre crtanja u kodu potražiti postojeći art iste stvari u `assets/images/` i drugim igrama i iskoristiti ga; krateri u Ustanku su spljoštena slika kratera iz Ranjenika. Ako arta nema, reći to i planirati pravi art.

Pozadina nikada ne sme biti statična: svaki ambijent ima vidljivo kretanje. Dim, vatra i slični pokretni elementi crtaju se kao stvarna animacija, odvojeno od osnovne slike; statično naslikani efekti nisu zamena. Animacija miruje u pauzi i nastavlja se posle ishoda. Postupak i provere su u [Animaciji pozadine](ANIMACIJA-POZADINE.md).

Konačni vojni art u `assets/images/armies/game-ready` organizovati po vrsti opreme, ne po nivou ili igri. Isti resurs koriste svi nivoi kojima je potreban, bez kopiranja u zasebne foldere nivoa.

Sav art koji koristimo, iz `assets` ili drugih izvora, služi kao osnova za konačnu grafiku igre. Crtati ga za stvarnu veličinu prikaza u igri i ujednačen stil: jasna silueta, čitljivi oblici i samo detalji koji se na toj veličini vide. Izvorna slika može biti veća ako je nacrtana za manji prikaz; ne oslanjati se na smanjivanje detaljnih velikih ilustracija da samo proizvede čitljiv mali sprite. Pravilo važi za likove, vozila, oružje, objekte, pozadine i ostalu vizuelnu umetnost, ne samo vojni art.

Sačuvati prepoznatljive i istorijski bitne detalje reference, odabrati perspektivu prema nivou i koristiti providnu pozadinu gde je potrebna. Izvornike čuvati odvojeno od konačnih verzija. Istorijsko prihvatanje reference ne znači da je ona konačan grafički materijal. Već završeni art koji zadovoljava ovo pravilo ne precrtavati ponovo; rad obuhvata materijal potreban za konkretnu igru, ne automatsku preradu cele zbirke.

Pre ukrašavanja okruženja izabrati vizuelne uzore, paletu i odnos dekoracije prema borbi. Detalje grupisati uz prazne delove između grupa, uskladiti osvetljenje i gustinu piksela; ne prikrivati loše uklapanje nasumičnim rotacijama ili odsecanjem silueta. Čitljivost borbe planirati lokalno: iza silueta jedinica ostaviti mirne površine odgovarajućeg kontrasta, a van tih zona sačuvati oštrinu i korisne detalje. Globalno zamućenje ili prigušivanje cele pozadine ne rešava lošu kompoziciju. Kada je uzor gotov game art, poput grada iz Tenkića, ponovljeni spriteovi na ravnim geometrijskim oblicima nisu odgovarajuća zamena: napraviti celovit ambijent i pregledati ga iza jedinica u igri. Polazište: [Environment Art — The Level Design Book](https://book.leveldesignbook.com/process/env-art).

## Statusi u planovima postupne izrade igara

README TODO uređuje isključivo vlasnik; agent ga ne menja. Agentove stavke pripadaju [TODO](TODO.md), a koraci pojedinačnih igara njihovim postojećim planovima.

Kada agent završi dogovoreni posao neke stavke, odmah je označava `✅ Done`. Posle završenog posla `🔄 In progress` ostaje samo ako je vlasnik izričito postavio svoje odobrenje kao uslov za Done. Vlasnik pregleda Done stavke ako želi i kada želi; nastavak rada prati zaseban dogovor. Izvršene provere beleže se prema stvarnim dokazima, odvojeno od statusa izrade. Testovi i izvršne provere pokreću se samo uz vlasnikovu dozvolu. Ovo pravilo važi za ovu vrstu planova i prati [centralno pravilo skilova](C:/Users/Lenovo/.agents/skills/slusaj/references/prihvatanje.md).

