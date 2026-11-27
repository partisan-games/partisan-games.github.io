---
name: game-actor-art-3d
description: "Precrtava teksture 3D aktera Partisan Games u odobreni pixel art, usklađen sa 2D artom. Koristi za nove ili dorađene teksture likova, vozila i opreme na postojećim modelima."
---

# Pixel art za 3D aktere

Prati [odobreni stil](../../../docs/ART.md#3d-pixel-art) i [AR-P17](../../../docs/PLAN.md#ar-p17). Uporedi Kočin odobreni izgled u katalogu sa uzorom iz 2D igre. Uzmi zajednički jezik boje, kontrasta i ivica, uz prepoznatljive materijale i identitet svakog aktera. Za 2D sprite i njegove poze primeni veštinu game-actor-art-2d.

## Izvor i novi crtež

**Precrtavanje 3D modela radi se samo na postojećim teksturama i maskama.** Zabranjeno je dodavati geometriju, preoblikovati postojeću ili zamenjivati delove geometrijom drugog modela. Detalje poput kape, kose i brade nacrtaj na postojećoj UV mapi.

Kad precrtavaš generičke vojnike, napravi novu varijaciju sa prepoznatljivo drugačijim licem, kosom ili obrvama. Kod regularnih vojski sačuvaj boju, šaru i oznake postojeće uniforme. Za imenovane likove prati odobreni identitet, a partizansku odeću prilagodi dogovorenom izgledu.

1. Pronađi model, materijale i potrošače. Pogledaj stvarni model i njegove UV mape, uključujući ugrađene FBX ili GLB teksture, pre crtanja. Kod zajedničkog atlasa proveri koji UV delovi zaista pripadaju pojedinačnim materijalima i akterima, uključujući preklopljena ostrva. Istorijske boje i oznake uzmi iz potvrđenih projektnih izvora.
2. Referenci iz 2D arta daj ulogu likovnog uzora, a postojećoj UV mapi ulogu tehničkog rasporeda. Nacrtaj nove bojene površine i detalje u čitljivim grupama oštrih piksela. Za raster koristi imagegen ako zadatak traži generisanje ili precrtavanje. Čuvaj traženi identitet, osnovne materijale, oznake i oblik. Za jednobojan materijal ostavi jednobojnu teksturu kad je tako dogovoreno, pa neka volumen daje svetlo scene.
3. Poravnaj novi crtež sa stvarnim UV koordinatama. Za pomerena ostrva koristi uparene tačke kao u [pripremi Kočinih tekstura](../../../scripts/prepare-sutjeska-pixel-art.py). Za oznaku koja prelazi UV šav proveri veličinu i položaj na samom modelu. Za lokalnu doradu izmeni samo pripadajuću mapu ili njenu masku. Postojeće mere, geometrija, UV koordinate, kostur i animacije vode prikaz i posle precrtavanja. Sačuvaj izvornik, poreklo i ponovljivu pripremu.

## Optimizacija modela

Pri svakom precrtavanju obavezno proceni trošak modela u sceni koja ga koristi. Proveri broj trouglova, materijala i poziva za iscrtavanje, veličinu tekstura i koliko se primeraka vidi odjednom. Razmotri spajanje kompatibilnih delova, uklanjanje duplikata, ponovnu upotrebu materijala, lakše teksture ili jednostavniji prikaz na udaljenosti. Izaberi samo mere koje rešavaju utvrđeni trošak.

Procena optimizacije je deo precrtavanja. Zahvate u geometriji izdvoji kao zaseban zadatak. Ako optimizuješ, uporedi stanje pre i posle istom merom u uporedivom prikazu. Sačuvaj izvorni model i proveri UV šavove, siluetu, providne i pokretne delove, kostur i animacije. Ako model već odgovara svojoj upotrebi, ukratko zabeleži razlog.

## Katalog i provera

- Za svakog aktera prvo poveži jednu Pixel art varijaciju u katalogu, uz iste animacije i položaj pregleda. Zatim precrtaj sve njegove postojeće varijacije, zadržavajući njihov identitet i deleći teksture tamo gde odgovaraju istom izgledu. Sledi dogovoreni obim za promenu podrazumevanog prikaza i upotrebu zajedničke teksture u igrama.
- Pregledaj model spreda, sa strane i otpozadi, pri uobičajenoj veličini prikaza i izbliza. Proveri šavove, ivice uz različite materijale, boje pod svetlom i čitljivost oznaka. Za lik proveri pokret lica i odeće koji otkriva šavove, a za vozilo i opremu odvojene pokretne delove. Preglede pokreći u okviru [pravila projekta](../../../docs/DOCS.md).
- Ciljana tehnička provera treba da potvrdi da se mape učitavaju, da promena varijacije čuva isti model i animacije i da se druge varijacije pravilno vraćaju. U izveštaju razlikuj šta si proverio na modelu od vlasnikovog vizuelnog odobrenja.
