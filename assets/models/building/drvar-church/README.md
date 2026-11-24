# Crkva za Drvar

Aktivni model [church.glb](church.glb) koristi novu geometriju prema [fotografiji koju je vlasnik zadao](https://vididrvar.com/wp-content/uploads/photo-gallery/imported_from_media_libray/283685711_10223840088932106_6851035121561528686_n.jpg?bwg=1687256439): kameni zidovi, tri lučna bočna prozora, dvovodni krov, četvrtast ulazni zvonik i piramidalni četvorovodni krov sa krstom. Fotografija je vizuelni uzor, njeni pikseli nisu tekstura modela; ne potvrđuje izgled iz 1944.

[build.py](build.py) ponovljivo pravi geometriju u Blenderu 4.5, a opcija `--render` pravi [offline pregled](preview.png). Model ima ugrađenu postojeću [teksturu kamena](../../../images/textures/walls/stone-wall.jpg); krov, stolarija i metal koriste materijale bez dodatnog preuzimanja. Nova geometrija i skripta prate MIT licencu projektnog koda; postojeća tekstura zadržava svoje poreklo.

[Prikaz](../../../../core3d/actor/buildings/Church.js) postavlja osnovu na tlo i visinu na procenjenih 11 m. Položaj u nivou i akteri ostaju isti; ovo je spoljašnji izgled, bez enterijera i promena pravila borbe.

Izvorni dostavljeni [church.fbx](church.fbx), izvorno `NNVECW2DG3YH2WY4MODYP0IFZ.fbx` (RigModels), i njegov [atlas](../../../images/textures/buildings/drvar-church.jpg) ostaju sačuvani, ali se više ne učitavaju. Njihova [priložena licenca](License.txt) dozvoljava samo ličnu upotrebu (studenti); komercijalna upotreba zahteva Premium članstvo na RigModels. Nisu obuhvaćeni MIT licencom novog modela ili projektnog koda.
