# Indeks ugla prikaza

[index.csv](index.csv) povezuje svaku sliku sa vizuelno pregledanim uglom. Putanja je relativna ovom folderu; vojska i vrsta opreme ostaju određene folderima. Indeks ne prepisuje istorijske podatke ni parametre igre.

| `pogled` | Značenje |
|---|---|
| `bocno` | Dominantan bočni profil; manja nacrtana dubina ne menja oznaku. Prvi izbor za bočni nivo. |
| `odozgo` | Pogled na gornju stranu objekta, pogodan za nivo sa kamerom odozgo. |
| `spreda` | Objekat je okrenut prema posmatraču. |
| `otpozadi` | Objekat je okrenut leđima posmatraču. |
| `koso` | Izražen tročetvrtinski ili drugi kosi ugao; ne birati automatski kao bočni profil. |
| `mesovito` | Jedna slika sadrži više uglova; pre upotrebe izdvojiti i pregledati potreban deo. |
| `neprimenljivo` | Zastava ili sličan grafički znak bez smislenog ugla kamere. |
| `neodredjeno` | Pregled nije dao pouzdan zaključak; proveriti pojedinačnu sliku pre izbora. |

Oznaka opisuje crtež, ne pravac kretanja, orijentaciju cevi ili stanje lika. Ležeći lik nije samim tim prikazan odozgo. Umanjeni prikazi služili su za pregled; kod GIF-a pregledan je prvi kadar, ne cela animacija. Indeks ne potvrđuje da je slika već isečena, animirana ili spremna za direktno korišćenje u igri.

`sha256` je otisak pregledanog fajla: ako se sadržaj slike promeni, stara oznaka zahteva ponovni pregled. Novu sliku dodati tek posle vizuelnog pregleda; pri premeštanju ažurirati putanju, pri brisanju ukloniti red. Ne zaključivati ugao samo iz naziva. Za bočni nivo prvo filtrirati `pogled=bocno`, zatim odgovarajuću vojsku i tip iz putanje.
