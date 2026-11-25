# Džakovi sa peskom

Vlasnik je dostavio preuzete [izvorni FBX](source/model.fbx) i [teksturu](source/sandbags01.png) iz `D:/Downloads/sandbags`. Autor, izvorna stranica i licenca nisu bili priloženi; ne pripisuje se nova licenca preuzetom artu.

[build.py](build.py), pokrenut Blenderom 4.5 u pozadini, zadržava geometriju i UV mapu, ravnomerno skalira zid na procenjenu visinu 1,1 m, centrira ga i oslanja na tlo. [sandbags.glb](sandbags.glb) sadrži 2.324 trougla, jedan materijal i ugrađenu dostavljenu teksturu; širina je 4,27 m, dubina 1,11 m. [Metapodaci](metadata.json) sadrže postupak i SHA-256 otiske.

[Zajednički prikaz](../../../../core3d/actor/buildings/Sandbags.js) koristi isti model u katalogu, u grupi Scenografija → Zakloni, i u Crvenom krstu. Dva zida uz bočne strane otvorenog dvorišta zaustavljaju hod, pogled i pogotke prema stvarnoj geometriji; prolaz kroz sredinu i izlaz ostaju slobodni. Položaji su izbor za igru, ne potvrđena istorijska rekonstrukcija.
