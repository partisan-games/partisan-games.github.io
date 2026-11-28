# Statistike modela

Prikupljene osobine mašina koje igre koriste ili planiraju, kao izvor za njihove vrednosti u kodu. Svaki model dobija svoju brzinu, oklop, vatrenu moć i zdravlje, a domet je za sve ceo ekran ([pravilo](ARHITEKTURA.md#gradivni-blokovi)). Vrednosti se prenose kao odnosi među modelima i prilagođavaju igri; istorijska vernost nije cilj.

**Izvori (prikupljeno 2026-11-23):** infobox i tabela „Specifications” engleske [Wikipedije](https://en.wikipedia.org/) (ime članka je u koloni modela) i javni podaci igre War Thunder iz [War-Thunder-Datamine](https://github.com/gszabi99/War-Thunder-Datamine), grana `master`. Podaci War Thundera su već prilagođeni balansu te igre. Za tenkove su brzina i masa iz njihove fizike vozila, ne iz polja `maxFwdSpeed`, koje je ograničenje igre. „Izdržljivost” aviona je zbir izdržljivosti njegovih delova u War Thunderu i služi samo za poređenje aviona međusobno. Crta (—) znači da izvor podatak nema; vrednost se tada bira po sličnom modelu.

## Tenkovi i oklopna vozila

Oklop je najdeblji prednji i bočni u milimetrima. Kad se izvori razlikuju, prva vrednost je sa Wikipedije, druga iz War Thundera.

| Model (Wikipedia) | Igra | Brzina km/h | Masa t | Motor KS | KS po toni | Oklop napred / bok | Glavno oružje | Posada |
|---|---|---|---|---|---|---|---|---|
| Partizanski tenk, nalik Pantheru ([Panther tank](https://en.wikipedia.org/wiki/Panther_tank)) | Tenkići, Do Trsta | — | 44.8 | 700 / 600 | 13.4 | 110 / 50 | 75 mm KwK 42 | 5 |
| Tigar I ([Tiger I](https://en.wikipedia.org/wiki/Tiger_I)) | Tenkići, Do Trsta | 45 put, 20 teren | 54–57 / 57.3 | 700 / 650 | 11.3 | 100 / 82 | 88 mm KwK 36 | 5 |
| M15/42 u nemačkoj službi ([M15/42 tank](https://en.wikipedia.org/wiki/M15/42_tank)) | Tenkići | 38 | 15.5 / 15 | 192 / 185 | 12.3 | 50 / 25 | 47 mm L/40 | 4 |
| StuG III G ([Sturmgeschütz III](https://en.wikipedia.org/wiki/Sturmgesch%C3%BCtz_III)) | Tenkići | 40 | 23.9 / 24.4 | 300 | 12.3 | 80 / 30 | 75 mm StuK 40 L/48 | 4 |
| Somua S35 ([SOMUA S35](https://en.wikipedia.org/wiki/SOMUA_S35)) | Do Trsta | 40 put, 32 teren | 19.5 | 190 | 9.7 | 47 / 40; 56 / 45 | 47 mm SA35 | 3 |
| Hummel ([Hummel](https://en.wikipedia.org/wiki/Hummel_(vehicle))) | Franjo Kluz | 42 | 24 / 21 | 300 | 14.3 | 30 / 20 | 150 mm sFH 18 | 6 |
| Marder II, 76 mm ([Marder II](https://en.wikipedia.org/wiki/Marder_II)) | Do Trsta | 40 | 10.8 | 138 | 12.8 | 35 / 14.5 | 76.2 mm Pak 36(r) | 4 |
| Elefant ([Elefant](https://en.wikipedia.org/wiki/Elefant)) | Do Trsta | 30 | 65 | 600 / 625 | 9.6 | 200 / 80 | 88 mm Pak 43 | 6 |
| Sd.Kfz. 222 ([Leichter Panzerspähwagen](https://en.wikipedia.org/wiki/Leichter_Panzersp%C3%A4hwagen)) | Do Trsta | — | 4 / 5 | 90 | 18 | 30 / 8 | 20 mm KwK 38 | 3 |
| Sd.Kfz. 251 ([Sd.Kfz. 251](https://en.wikipedia.org/wiki/Sd.Kfz._251)) | Do Trsta | 52.5 | 7.8 | 100 | 12.5 | 14.5 / 8 | MG 34/42 | 2 + 10 |
| Sd.Kfz. 231, osmotočkaš ([Schwerer Panzerspähwagen](https://en.wikipedia.org/wiki/Schwerer_Panzersp%C3%A4hwagen)) | Do Trsta | 85 put, 31 teren | 8.3 | 155 | 18.7 | — | 20 mm KwK 30 | 4 |
| Pz.Kpfw. 612, 37 mm | Do Trsta | — | — | — | — | — | 37 mm | — |
| Oklopni voz BP-42 | Franjo Kluz | — | — | — | — | — | — | — |

War Thunder za Sd.Kfz. 251 ima samo inačicu 251/9 sa topom od 75 mm, pa su njegova masa, snaga i oklop uzeti od nje. Model Pz.Kpfw. 612 nije pouzdano prepoznat ni u jednom izvoru, a BP-42 nema članak.

## Kamioni, automobili i motocikli

| Model (Wikipedia) | Igra | Brzina km/h | Motor KS | Napomena |
|---|---|---|---|---|
| Opel Blitz ([Opel Blitz](https://en.wikipedia.org/wiki/Opel_Blitz)) | Franjo Kluz | — | — | infobox bez brojeva |
| Horch 830 BL, oficirski | Do Trsta | 115 | 75 | stari naziv resursa je `mercedes-830bl`; podaci zbirke WHZ navode Horch |
| Motociklista, BMW R75 sa prikolicom ([BMW R75](https://en.wikipedia.org/wiki/BMW_R75)) | Do Trsta | — | 26 | |
| Zündapp K600 sa dvojicom | Do Trsta | — | — | masa sa posadom je procena, ne objavljen podatak o teretu |
| BMW R12 sa dvojicom ([BMW R12 and R17](https://en.wikipedia.org/wiki/BMW_R12_and_R17)) | Do Trsta | — | 18 | prikolica koristi izričito označenu zamensku masu R75 |

## Zajedničke mase i sudari

[Fizički podaci modela](../core/gameplay/modelStatistics.js) čuvaju masu u kilogramima, najveću brzinu na putu u km/h i glavno naoružanje iz gornjih tabela (prikazuju se u katalogu), vrstu konstrukcije i osnov izbora varijante/tereta, odvojeno od [parametara balansa](../core/gameplay/modelPerformance.js). Tela tenkova, nosača mitraljeza, Opela i PaK-a čitaju iste zapise u svim igrama; varijanta iz parametara tenka ima prednost nad zajedničkim crtežom. Neprepoznatim modelima ne dodeljivati izmišljenu masu. Partizanski tenk koristi Pantherovih 44.800 kg kao projektnu zamenu, ne kao potvrdu identiteta nacrtanog tenka; ostale mase oklopnih modela potiču iz gornje tabele.

Dopunski izvori: [Tank Museum — Tiger I](https://tankmuseum.org/tank-nuts/tank-collection/tiger-i) navodi 57 t, a [Somua S35](https://tankmuseum.org/tank-nuts/tank-collection/somua-s35) 19,5 t. [Zbirka DISG — Opel Blitz](https://www.disg-ev.de/fahrzeugsammlung/opel-blitz) za 3.6-36 S navodi 2.500 kg praznog i 5.500 kg najveće ukupne mase. [BMW-ov tehnički priručnik R75](https://vintagebmw.org/library_data/Workshop_R75_German.pdf) navodi 420 kg sa prikolicom i 840 kg dozvoljene ukupne mase. Za Opel i BMW u sudaru se koristi objavljena najveća ukupna masa; to je izabrana referenca opterećenja, ne izmereni teret aktera. Ostale mase zavise od varijante, posebno Sd.Kfz. 222/251; ne mešati američke/imperijalne tone sa metričkim.

[Zajedničko pravilo sudara](../core/gameplay/VehicleCollisions.js) iz konstrukcije i mase izvodi rang: neoklopljena vozila i vučena oruđa 1, ostala vozila ispod 10 t 2, od 10 do ispod 30 t 3, od 30 t 4. Rang i šteta su balans igre, ne istorijske činjenice. Šteta raste sa kvadratom relativne brzine i udelom mase protivnika; laka prepreka prenosi manje štete. Vozilo ranga 3/4 pri udaru od najmanje 1 m/s gazi protivnika ranga 1/2 ako je najmanje tri puta teže. Preživeli kontakti zaustavljaju vozila, uz jedan obračun štete do razdvajanja. Mrtve olupine nisu nove prepreke. Do Trsta koristi ovo pravilo na putu i zaustavlja kameru pred preživelim vozilom; ostale igre imaju zajedničke podatke, ali im pravilo kontakta nije automatski uključeno.

Nova vozila čitaju iste globalne zapise. [Zbirka WHZ — Horch 830 BL](https://www.whz.de/fileadmin/service/historische_sammlung/kraftfahrzeug/docs/horch_830_bl.pdf) navodi 1.950 kg praznog i 550 kg nosivosti; sudari koriste zbir 2.500 kg. [Izvorni BMW priručnik R12](https://vintagebmw.org/library_data/R12_owners_english_1935.pdf) navodi 188 kg solo motora; masa sa prikolicom i posadom nije potvrđena, pa se za sudar koristi jasno označen R75 primer od 840 kg. Zündapp koristi projektnu procenu 343 kg: referentnih 193 kg motora i dva pretpostavljena vojnika po 75 kg; to nije izmerena masa aktera. Neprepoznati Pz.Kpfw. 612 koristi jasno označene mere i 8.300 kg Sd.Kfz. 231 kao zamenu za sudare, bez tvrdnje o identitetu modela.

## Avioni

Brzina i prazna masa: prva vrednost je sa Wikipedije, druga iz War Thundera.

| Model (Wikipedia) | Igra | Najveća brzina km/h | Prazna masa kg | Motor KS | Naoružanje | Posada | Izdržljivost |
|---|---|---|---|---|---|---|---|
| Potez 25 ([Potez 25](https://en.wikipedia.org/wiki/Potez_25)) | Franjo Kluz | 230 | 1370 | 320 | 2 × 7.7 mm napred, 1 × 7.7 mm nazad; 200 kg bombi | 2 | — |
| Bf 109 G-6 ([Messerschmitt Bf 109](https://en.wikipedia.org/wiki/Messerschmitt_Bf_109)) | Franjo Kluz, Vis, Ratweek | 530 / 666 | 2247 / 2730 | — | 2 × 13 mm MG 131, 1 × 20 mm MG 151/20; 250 kg bombi | 1 | 2075 |
| Ju 87 D-5 ([Junkers Ju 87](https://en.wikipedia.org/wiki/Junkers_Ju_87)) | Franjo Kluz | — | — | 1400 | 2 × 7.92 mm napred, dvocevni 7.92 mm nazad; 250 + 4 × 50 kg bombi | 2 | 8678 |
| He 111 H-6 ([Heinkel He 111](https://en.wikipedia.org/wiki/Heinkel_He_111)) | Franjo Kluz, Vis | 440 | 8680 | 1300 | do 7 × 7.92 mm; 2000 kg bombi | 5 | 12064 |
| Fieseler Storch ([Fieseler Fi 156 Storch](https://en.wikipedia.org/wiki/Fieseler_Fi_156_Storch)) | Franjo Kluz | — | — | — | 1 × MG 15 | 2 | — |
| Spitfire Mk Vb ([Supermarine Spitfire (early Merlin-powered variants)](https://en.wikipedia.org/wiki/Supermarine_Spitfire_(early_Merlin-powered_variants))) | Vis | — | — | — | — | 1 | 2028 |
| Hurricane Mk IV ([Hawker Hurricane](https://en.wikipedia.org/wiki/Hawker_Hurricane)) | Vis | — / 527 | — / 2873 | 1185 | 4 × 20 mm Hispano; 2 × 250 lb bombi | 1 | 2289 |
| Breguet 19 ([Breguet 19](https://en.wikipedia.org/wiki/Breguet_19)) | Vis | 214 | 1387 | 450 | 1 × 7.7 mm napred, 2 × 7.7 mm nazad; lake bombe | 2 | — |
| Yak-1b ([Yakovlev Yak-1](https://en.wikipedia.org/wiki/Yakovlev_Yak-1)) | Vis | 592 / 575 | 2316 / 2350 | 1260 | 1 × 20 mm ShVAK, 1 × 12.7 mm UBS | 1 | 1974 |
| Il-2 ([Ilyushin Il-2](https://en.wikipedia.org/wiki/Ilyushin_Il-2)) | katalog | 410 / 432 | 4425 / 4838 | 1720 | 2 × 23 mm, 2 × 7.62 mm; 600 kg bombi ili 8 raketa | 2 | 3452 |
| Bf 110 G-2 ([Messerschmitt Bf 110](https://en.wikipedia.org/wiki/Messerschmitt_Bf_110)) | Vis | 475 / 540 | — / 6466 | 1050 | 2 × 20 mm MG FF/M i mitraljezi | 2–3 | 3396 |
| Lancaster I ([Avro Lancaster](https://en.wikipedia.org/wiki/Avro_Lancaster)) | Ratweek | 454 | 16738 | 4 × 1280 | 8 × 7.7 mm Browning; 6400 kg bombi | 7 | — |
| B-17G ([Boeing B-17 Flying Fortress](https://en.wikipedia.org/wiki/Boeing_B-17_Flying_Fortress)) | Ratweek | 462 | 16391 | 4 × 1200 | 13 × 12.7 mm M2 Browning; 3600 kg bombi | 10 | — |
| B-24J ([Consolidated B-24 Liberator](https://en.wikipedia.org/wiki/Consolidated_B-24_Liberator)) | Ratweek | 467 | 16556 | 4 × 1200 | 10 × 12.7 mm M2 Browning; 3600 kg bombi | 10 | — |
| B-25J ([North American B-25 Mitchell](https://en.wikipedia.org/wiki/North_American_B-25_Mitchell)) | Ratweek | 438 | 8836 | 2 × 1700 | 12 × 12.7 mm M2 Browning; 1360 kg bombi | 6 | — |
| Ju 52/3m g3e ([Junkers Ju 52](https://en.wikipedia.org/wiki/Junkers_Ju_52)) | Raid on Drvar | 265.5 | 5720 | 3 × 680 | 2 × 7.92 mm MG 15; 500 kg bombi | 2 | — |
| Fw 190 A-5 ([Focke-Wulf Fw 190](https://en.wikipedia.org/wiki/Focke-Wulf_Fw_190)) | Vis | 652 / 670 | 3200 / 3353 | — | 2 × 13 mm MG 131, 2 × 20 mm MG 151/20 | 1 | 2102 |

Bombarderi Ratweek-a imaju [vrednosti igre](../core/gameplay/modelPerformance.js) u odnosu na B-24. Vatrena moć prati broj i kalibar mitraljeza: B-17 ima 13 teških, a Lancaster osam pušaka kalibra 7,7 mm. Brzina bombardovanja prati nosivost bombi: Lancaster nosi 6.400 kg, a B-25 1.360 kg. Laki B-25 brže skreće, a B-17 najviše izdrži.

3D avioni (Lancaster, B-17, B-24, B-25, Bf 109 i Ju 52) prikazuju masu, brzinu i naoružanje u katalogu iz [istih zapisa](../core/gameplay/modelStatistics.js) kao tenkovi. Inačica u zagradi je ona iz War Thundera. Wikipedija za Hurricane opisuje celu porodicu, pa su njeno oružje i motor za Mk IV približni.

### Mere tela u Visu

Modeli dele [iste mere](../core/actor/aircraft/fighterBomberPlanes.js) u nivou i katalogu: `length` je dužina trupa, `width` raspon krila. Prikaz odozgo i pogoci prate te ose, umesto ranijih mera preuzetih iz PNG-a. Vis koristi 14 px/m; upravljanje, brzine metaka, razmak pušaka, petlja i sletanje množe svoja rastojanja sa 10/14, a putanje i talasi ostaju u istim pikselima i sekundama. Stvarne razlike u veličinama modela menjaju njihov vidljivi obris i sudarnu površinu; nisu prikrivene zasebnim kutijama sudara.

| Model | Dužina m | Raspon m | Osnov |
|---|---|---|---|
| Spitfire Mk Vb | 9.12 | 11.23 | [Italijansko ratno vazduhoplovstvo](https://www.aeronautica.difesa.it/en/2023/05/26/spitfire-v-ix/) |
| Hurricane Mk IV | 9.84 | 12.19 | [BAE — porodica Hurricane](https://www.baesystems.com/heritage/page/hawker-hurricane) |
| Breguet 19 | 9.51 | 14.83 | [Vazduhoplovne tradicije Srbije](https://vazduhoplovnetradicijesrbije.rs/index.php/istorija/brege-19) |
| Yak-1b | 8.48 | 10 | [Tehničke tabele Yak-1](https://airpages.ru/ru/yak1.shtml) |
| Il-2 | 11.6 | 14.6 | [NASM — Il-2](https://airandspace.si.edu/collection-objects/ilyushin-il-2-shturmovik/nasm_A19950142000) |
| Bf 109 | 8.94 | 9.92 | [Australian War Memorial](https://www.awm.gov.au/visit/exhibitions/striking/planes/german/bf109) |
| Fw 190 | 8.95 | 10.5 | [Luftfahrtmuseum Hannover](https://luftfahrtmuseum-hannover.de/index.php/en/infotext/schild-focke-wulf-190gb) |
| Bf 110 | 12.65 | 16.25 | [Australian War Memorial — G-4 referenca](https://www.awm.gov.au/visit/exhibitions/striking/planes/german/bf110) |
| He 111 | 16.4 | 22.6 | [Deutsches Museum — CASA izvedenica He 111](https://www.deutsches-museum.de/en/flugwerft-schleissheim/exhibition/military-aviation/casa-2111) |

Neidentifikovani obojeni lovci koriste mere Bf 109 kao projektnu zamenu; crtež nije potvrda konkretne istorijske varijante. Bočni avioni drugih nivoa zadržavaju svoje postojeće mere.

## Brodovi

| Model (Wikipedia) | Igra | Brzina km/h | Glavno oružje | Napomena |
|---|---|---|---|---|
| Schnellboot S-30 ([E-boat](https://en.wikipedia.org/wiki/E-boat)) | Čamac | — | 20 mm C/38 | War Thunder: klasa S-38 |
| R-boot ([R boat](https://en.wikipedia.org/wiki/R_boat)) | Čamac | — | 20 mm C/30 | War Thunder: R-41 |
| MFP ([Marinefährprahm](https://en.wikipedia.org/wiki/Marinef%C3%A4hrprahm)) | Čamac | — | — | infobox bez brojeva |
| Vorpostenboot ([Vorpostenboot](https://en.wikipedia.org/wiki/Vorpostenboot)) | Čamac | — | — | infobox bez brojeva |

## Topovi

| Model (Wikipedia) | Igra | Kalibar | Masa | Brzina zrna m/s | Brzina paljbe | Posada |
|---|---|---|---|---|---|---|
| Flak 38 ([2 cm Flak 30, Flak 38 and Flakvierling 38](https://en.wikipedia.org/wiki/2_cm_Flak_30,_Flak_38_and_Flakvierling_38)) | Franjo Kluz | 20 mm | 405 kg | 900 | 180 u minuti | 5 |
| PaK 38 ([5 cm Pak 38](https://en.wikipedia.org/wiki/5_cm_Pak_38)) | Do Trsta | 50 mm | 1000 kg | 550–1130 | 13 u minuti | 5 |
| Schneider 155 L ([Canon de 155 L modèle 1918 Schneider](https://en.wikipedia.org/wiki/Canon_de_155_L_mod%C3%A8le_1918_Schneider)) | Ustanak | 155 mm | 5050 kg | 561 | — | — |
| Poljski top 75 mm | Battle for Jablanica | 75 mm | — | — | — | 2 |

Model poljskog topa iz Jablanice nije prepoznat, pa za njega nema izvora.
