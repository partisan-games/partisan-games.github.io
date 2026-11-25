# Messerschmitt Bf 109

[model.glb](model.glb) zamenjuje stari FBX u Warplane-u i oba prikaza lovca u katalogu. Ima 1.981 trougao: trup 1.857 i propeler 124. Teksture su ugrađene, a propeler je odvojen od trupa i okreće se oko osovine; dodatni generički propeler se ne koristi.

Vlasnik je izabrao paket „German Bf 109 Fighter Plane”, identifikatora `B6L6UIB83ZKUE6YOCT94DAHM3`. Pošto preuzeti folder u trenutku zamene više nije bio dostupan, priprema koristi već prisutni [OBJ istog identifikatora](../junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.obj), sa istim brojem trouglova i nazivima materijala kao pregledani FBX. Taj primerak je ranije smešten pod pogrešnim nazivom „Štuka”; njegovu postojeću upotrebu kod parkiranih aviona ova zamena ne menja. Njegove JPG teksture nisu bajt-po-bajt iste kao iz kasnije preuzetog foldera; ovde se koriste dostupne projektne teksture.

[build.py](build.py) u Blenderu 4.5 čuva sve trouglove i UV koordinate, ispravlja smer na −Z u Three.js, odvaja tri lopatice i njihove okove i postavlja raspon krila na 9,92 m prema [projektnim merama](../../../../../docs/STATISTIKE.md). Dužina proizlazi iz proporcija modela, oko 8,80 m. To nije precizna rekonstrukcija istorijske varijante ili livereje za Ratweek; stajni trap ostaje izvučen kao na izvoru.

Licenca je postojeća [RigModels Personal Use](../junkers-ju-87-stuka/License.txt); model nije relicenciran. [Metapodaci](metadata.json) čuvaju izvor, broj trouglova, osovinu i SHA-256, a [offline pregled](preview.png) prikazuje pripremljeni sklop bez pokretanja pregledača.
