# Junkers Ju 88, rezerva

[Izvorni GLB](model.glb) je neizmenjena kopija vlasnikovog `hand_painted_ww2_ju_88_bomber.glb`, sačuvana 2026-11-26. Ima 12.138 trouglova, šest meševa i materijala, 18 ugrađenih slika i nijednu animaciju.

[Pojednostavljeni GLB](model-lite.glb) ima 3.675 trouglova, a [pregled](preview.png) ga prikazuje desno, pored izvornog. Napravljen je [pripremom](prepare.py) u Blenderu 4.5: `blender -b --python prepare.py -- model.glb model-lite.glb .3 preview-lite.png`. Postupak:

- motori su razdvojeni na odvojene delove;
- sitni delovi, manji od 1% raspona krila, su uklonjeni;
- delovi do 30 trouglova, među njima i lopatice elisa, su sačuvani, jer bi se pri smanjenju izobličili u šiljke;
- ostatak motora je sveden na 30%, a okvir kabine na 50%;
- krila, trup i rep su ostali netaknuti.

Elise nisu izdvojene kao zasebni objekti za okretanje.

Ugrađeni metapodaci navode autora [Styx](https://sketchfab.com/588276), [izvornu stranicu](https://sketchfab.com/3d-models/hand-painted-ww2-ju-88-bomber-8cc655592e844009b40bb5bfb71c830d) i licencu CC BY 4.0. Rezerva nije povezana sa katalogom ni sa igrama.
