# Dokumentacija

Zajednička osnova za razvoj 2D i 3D igara, sa istorijski zasnovanim sadržajem.

## Gde pripada znanje

| Oblast | Autoritativno mesto | Sadržaj |
|---|---|---|
| Istorija | [Istorijska vernost](ISTORIJA.md) | Vojske, periodi, područja, jedinice, vozila, avioni, oružje i prihvaćeni art. |
| Konteksti igara | [IGRE](IGRE.md) | Dogovorene teme, istorijski okvir i zamišljeni tok malih igara i njihovih etapa. |
| Ugao 2D arta | [Indeks prikaza](../assets/images/armies/index.csv) | Vizuelne oznake za izbor bočnih, gornjih i drugih prikaza, uz same slike. |
| Arhitektura i obrasci | [ARHITEKTURA](ARHITEKTURA.md) | Odgovornosti zajedničkog engine-a, obrasci i bitna ograničenja. |
| Provere | [TESTING](TESTING.md) | Komande, pokrivenost i ograničenja provera. |
| Posebna tehnika prikaza | [Animacija pozadine](ANIMACIJA-POZADINE.md) | Konkretno rešenje, neuspešni pristupi i preventivne provere. |
| Agentovi poslovi | [TODO](TODO.md) | Agentove razvojne stavke, pregledi i potrebne popravke. |
| Razvoj igre | Lokalni planovi igara | Koraci izrade i statusi; nije trajna baza znanja. |

Pokretanje projekta opisuje [README](../README.md). Istorijske slike i poreklo čuvaju se u [references/ww2-yu](references/ww2-yu/), a merni artefakti se povezuju iz tehničkog opisa.

## Kako zapisujemo znanje

Osoba koja vodi projekat i daje naloge agentu u dokumentaciji se naziva vlasnik projekta.

Glavni principi: **bez dupliranja informacija** i **bez podataka koji brzo zastarevaju promenom koda i zahtevaju često ručno ažuriranje**.

Jedna činjenica ili odluka ima jedno autoritativno mesto; ostali dokumenti vode link do njega. Dokumentujemo trajne odluke, razloge, ograničenja i istorijske izvore. Ne prepričavamo implementaciju: spiskovi klasa i metoda, potpisi API-ja, brojevi igara i testova i slični promenljivi podaci ostaju u kodu i alatima koji ih već prikazuju. Pišemo po temi, bez dnevnika završenih koraka i kopiranja celih planova.

Zapis čuvamo samo ako daje trajno znanje koje nije već dostupno na drugom mestu. Uz odluku navesti razlog i bitno ograničenje; uz istorijsku tvrdnju izvor i kontekst. Ako je merenje neophodno za razumevanje ograničenja, povezati dokaz sa datumom/revizijom, bez održavanja prepisa rezultata. Predloge i otvoren posao voditi u postojećem TODO-u ili povezanom planu, a ne kao važeću arhitekturu.

Istorijski zapis dodatno prati period, područje, korisnika opreme i varijantu; tehnički zapis prati vlasnika stanja, zavisnosti i životni ciklus. Detaljni obrasci su u odgovarajućim dokumentima. Postojeći art u `assets` ostaje istorijski prihvaćen prema [vlasnikovoj odluci](ISTORIJA.md#prihvaćen-art-projekta).

Pre rada pročitati relevantnu istorijsku temu, arhitektonska pravila i ugovor sistema koji se menja. Posle rada ažurirati postojeći zapis; novu datoteku otvarati samo za samostalnu temu koja bi opteretila postojeću. Plan nije dokaz implementacije, a razvojni cilj nije tvrdnja da danas nema tehničkog duga.

## Odobravanje UI elemenata

Svaki novi UI element zahteva prethodno izričito odobrenje vlasnika, uključujući brojače, tekstove, indikatore, dugmad i obaveštenja. Nalog za izmenu gameplay-a ili završetak plana sam po sebi ne odobrava dodavanje UI elemenata.

## Pravilo za umetnost

Konačni vojni art u `assets/images/armies/game-ready` organizovati po vrsti opreme, ne po nivou ili igri. Isti resurs koriste svi nivoi kojima je potreban, bez kopiranja u zasebne foldere nivoa.

Sav art koji koristimo, iz `assets` ili drugih izvora, služi kao osnova za konačnu grafiku igre. Crtati ga za stvarnu veličinu prikaza u igri i ujednačen stil: jasna silueta, čitljivi oblici i samo detalji koji se na toj veličini vide. Izvorna slika može biti veća ako je nacrtana za manji prikaz; ne oslanjati se na smanjivanje detaljnih velikih ilustracija da samo proizvede čitljiv mali sprite. Pravilo važi za likove, vozila, oružje, objekte, pozadine i ostalu vizuelnu umetnost, ne samo vojni art.

Sačuvati prepoznatljive i istorijski bitne detalje reference, odabrati perspektivu prema nivou i koristiti providnu pozadinu gde je potrebna. Izvornike čuvati odvojeno od konačnih verzija. Istorijsko prihvatanje reference ne znači da je ona konačan grafički materijal. Već završeni art koji zadovoljava ovo pravilo ne precrtavati ponovo; rad obuhvata materijal potreban za konkretnu igru, ne automatsku preradu cele zbirke.

Pre ukrašavanja okruženja izabrati vizuelne uzore, paletu i odnos dekoracije prema borbi. Detalje grupisati uz prazne delove između grupa, uskladiti osvetljenje i gustinu piksela; ne prikrivati loše uklapanje nasumičnim rotacijama ili odsecanjem silueta. Polazište: [Environment Art — The Level Design Book](https://book.leveldesignbook.com/process/env-art).

## Statusi u planovima postupne izrade igara

README TODO uređuje isključivo vlasnik; agent ga ne menja. Agentove stavke pripadaju [TODO](TODO.md), a koraci pojedinačnih igara njihovim postojećim planovima.

Kada agent završi dogovoreni posao neke stavke, odmah je označava `✅ Done`. Posle završenog posla `🔄 In progress` ostaje samo ako je vlasnik izričito postavio svoje odobrenje kao uslov za Done. Vlasnik pregleda Done stavke ako želi i kada želi; nastavak rada prati zaseban dogovor. Izvršene provere beleže se prema stvarnim dokazima, odvojeno od statusa izrade. Testovi i izvršne provere pokreću se samo uz vlasnikovu dozvolu. Ovo pravilo važi za ovu vrstu planova i prati [centralno pravilo skilova](C:/Users/Lenovo/.agents/skills/slusaj/references/prihvatanje.md).

