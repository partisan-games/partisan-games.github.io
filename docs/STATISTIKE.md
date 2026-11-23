# Statistike modela

Prikupljene osobine mašina koje igre koriste ili planiraju, kao izvor za njihove vrednosti u kodu. Svaki model dobija svoju brzinu, oklop, vatrenu moć i zdravlje, a domet je za sve ceo ekran ([pravilo](ARHITEKTURA.md#gradivni-blokovi)). Vrednosti se prenose kao odnosi među modelima i prilagođavaju igri; istorijska vernost nije cilj.

**Izvori (prikupljeno 2026-11-23):** infobox i tabela „Specifications” engleske [Wikipedije](https://en.wikipedia.org/) (ime članka je u koloni modela) i javni podaci igre War Thunder iz [War-Thunder-Datamine](https://github.com/gszabi99/War-Thunder-Datamine), grana `master`. Podaci War Thundera su već prilagođeni balansu te igre. Za tenkove su brzina i masa iz njihove fizike vozila, ne iz polja `maxFwdSpeed`, koje je ograničenje igre. „Izdržljivost” aviona je zbir izdržljivosti njegovih delova u War Thunderu i služi samo za poređenje aviona međusobno. Crta (—) znači da izvor podatak nema; vrednost se tada bira po sličnom modelu.

## Tenkovi i oklopna vozila

Oklop je najdeblji prednji i bočni u milimetrima. Kad se izvori razlikuju, prva vrednost je sa Wikipedije, druga iz War Thundera.

| Model (Wikipedia) | Igra | Brzina km/h | Masa t | Motor KS | KS po toni | Oklop napred / bok | Glavno oružje | Posada |
|---|---|---|---|---|---|---|---|---|
| Partizanski tenk, nalik Pantheru ([Panther tank](https://en.wikipedia.org/wiki/Panther_tank)) | Tenkići, Do Trsta | — | 44.8 | 700 / 600 | 13.4 | 110 / 50 | 75 mm KwK 42 | 5 |
| Tigar I ([Tiger I](https://en.wikipedia.org/wiki/Tiger_I)) | Tenkići | 45 put, 20 teren | 54–57 / 57.3 | 700 / 650 | 11.3 | 100 / 82 | 88 mm KwK 36 | 5 |
| Somua S35 ([SOMUA S35](https://en.wikipedia.org/wiki/SOMUA_S35)) | Do Trsta | 40 put, 32 teren | 19.5 | 190 | 9.7 | 47 / 40; 56 / 45 | 47 mm SA35 | 3 |
| Hummel ([Hummel](https://en.wikipedia.org/wiki/Hummel_(vehicle))) | Franjo Kluz | 42 | 24 / 21 | 300 | 14.3 | 30 / 20 | 150 mm sFH 18 | 6 |
| Marder II, 76 mm ([Marder II](https://en.wikipedia.org/wiki/Marder_II)), plan | Do Trsta | 40 | 10.8 | 138 | 12.8 | 35 / 14.5 | 76.2 mm Pak 36(r) | 4 |
| Elefant ([Elefant](https://en.wikipedia.org/wiki/Elefant)), plan | Do Trsta | 30 | 65 | 600 / 625 | 9.6 | 200 / 80 | 88 mm Pak 43 | 6 |
| Sd.Kfz. 222 ([Leichter Panzerspähwagen](https://en.wikipedia.org/wiki/Leichter_Panzersp%C3%A4hwagen)) | Do Trsta | — | 4 / 5 | 90 | 18 | 30 / 8 | 20 mm KwK 38 | 3 |
| Sd.Kfz. 251 ([Sd.Kfz. 251](https://en.wikipedia.org/wiki/Sd.Kfz._251)) | Do Trsta | 52.5 | 7.8 | 100 | 12.5 | 14.5 / 8 | MG 34/42 | 2 + 10 |
| Sd.Kfz. 231, osmotočkaš ([Schwerer Panzerspähwagen](https://en.wikipedia.org/wiki/Schwerer_Panzersp%C3%A4hwagen)), plan | Do Trsta | 85 put, 31 teren | 8.3 | 155 | 18.7 | — | 20 mm KwK 30 | 4 |
| Pz.Kpfw. 612, 37 mm, plan | Do Trsta | — | — | — | — | — | 37 mm | — |
| Oklopni voz BP-42 | Franjo Kluz | — | — | — | — | — | — | — |

War Thunder za Sd.Kfz. 251 ima samo inačicu 251/9 sa topom od 75 mm, pa su njegova masa, snaga i oklop uzeti od nje. Model Pz.Kpfw. 612 nije pouzdano prepoznat ni u jednom izvoru, a BP-42 nema članak.

## Kamioni, automobili i motocikli

| Model (Wikipedia) | Igra | Brzina km/h | Motor KS | Napomena |
|---|---|---|---|---|
| Opel Blitz ([Opel Blitz](https://en.wikipedia.org/wiki/Opel_Blitz)) | Franjo Kluz | — | — | infobox bez brojeva |
| Mercedes 830 BL, oficirski, plan | Do Trsta | — | — | nema članka; War Thunder ima samo Horch bez brojeva |
| Motociklista, BMW R75 sa prikolicom ([BMW R75](https://en.wikipedia.org/wiki/BMW_R75)) | Do Trsta | — | 26 | |
| Zündapp K600 sa dvojicom, plan | Do Trsta | — | — | nema članka |
| BMW R12 sa dvojicom, plan ([BMW R12 and R17](https://en.wikipedia.org/wiki/BMW_R12_and_R17)) | Do Trsta | — | 18 | |

## Avioni

Brzina i prazna masa: prva vrednost je sa Wikipedije, druga iz War Thundera.

| Model (Wikipedia) | Igra | Najveća brzina km/h | Prazna masa kg | Motor KS | Naoružanje | Posada | Izdržljivost |
|---|---|---|---|---|---|---|---|
| Potez 25 ([Potez 25](https://en.wikipedia.org/wiki/Potez_25)) | Franjo Kluz | 230 | 1370 | 320 | 2 × 7.7 mm napred, 1 × 7.7 mm nazad; 200 kg bombi | 2 | — |
| Bf 109 G-6 ([Messerschmitt Bf 109](https://en.wikipedia.org/wiki/Messerschmitt_Bf_109)) | Franjo Kluz, Vis | 530 / 666 | 2247 / 2730 | — | 2 × 13 mm MG 131, 1 × 20 mm MG 151/20; 250 kg bombi | 1 | 2075 |
| Ju 87 D-5 ([Junkers Ju 87](https://en.wikipedia.org/wiki/Junkers_Ju_87)) | Franjo Kluz | — | — | 1400 | 2 × 7.92 mm napred, dvocevni 7.92 mm nazad; 250 + 4 × 50 kg bombi | 2 | 8678 |
| He 111 H-6 ([Heinkel He 111](https://en.wikipedia.org/wiki/Heinkel_He_111)) | Franjo Kluz, Vis | 440 | 8680 | 1300 | do 7 × 7.92 mm; 2000 kg bombi | 5 | 12064 |
| Fieseler Storch ([Fieseler Fi 156 Storch](https://en.wikipedia.org/wiki/Fieseler_Fi_156_Storch)) | Franjo Kluz | — | — | — | 1 × MG 15 | 2 | — |
| Spitfire Mk Vb ([Supermarine Spitfire (early Merlin-powered variants)](https://en.wikipedia.org/wiki/Supermarine_Spitfire_(early_Merlin-powered_variants))) | Vis | — | — | — | — | 1 | 2028 |
| Hurricane Mk IV ([Hawker Hurricane](https://en.wikipedia.org/wiki/Hawker_Hurricane)) | Vis | — / 527 | — / 2873 | 1185 | 4 × 20 mm Hispano; 2 × 250 lb bombi | 1 | 2289 |
| Breguet 19 ([Breguet 19](https://en.wikipedia.org/wiki/Breguet_19)) | Vis | 214 | 1387 | 450 | 1 × 7.7 mm napred, 2 × 7.7 mm nazad; lake bombe | 2 | — |
| Yak-1b ([Yakovlev Yak-1](https://en.wikipedia.org/wiki/Yakovlev_Yak-1)) | Vis | 592 / 575 | 2316 / 2350 | 1260 | 1 × 20 mm ShVAK, 1 × 12.7 mm UBS | 1 | 1974 |
| Il-2 ([Ilyushin Il-2](https://en.wikipedia.org/wiki/Ilyushin_Il-2)) | katalog | 410 / 432 | 4425 / 4838 | 1720 | 2 × 23 mm, 2 × 7.62 mm; 600 kg bombi ili 8 raketa | 2 | 3452 |
| Bf 110 G-2 ([Messerschmitt Bf 110](https://en.wikipedia.org/wiki/Messerschmitt_Bf_110)) | Vis | 475 / 540 | — / 6466 | 1050 | 2 × 20 mm MG FF/M i mitraljezi | 2–3 | 3396 |
| Fw 190 A-5 ([Focke-Wulf Fw 190](https://en.wikipedia.org/wiki/Focke-Wulf_Fw_190)) | Vis | 652 / 670 | 3200 / 3353 | — | 2 × 13 mm MG 131, 2 × 20 mm MG 151/20 | 1 | 2102 |

Inačica u zagradi je ona iz War Thundera. Wikipedija za Hurricane opisuje celu porodicu, pa su njeno oružje i motor za Mk IV približni.

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
