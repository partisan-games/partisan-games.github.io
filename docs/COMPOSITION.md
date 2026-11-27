# Kompozicija umesto nasleđivanja

Nasleđivanjem klasa preuzima ponašanje roditelja preko `extends`. Kompozicijom objekat dobija manje objekte koji rade određene poslove: tenk **ima** zdravlje i oružje. U ovom projektu oba pristupa postoje zajedno; kompoziciju koristimo da se zajednička ponašanja ne vezuju za jednu granu nasleđivanja.

## Isti zadatak na dva načina

Želimo da tenk i zgrada imaju zdravlje i mogu da prime pogodak. Primeri su pojednostavljeni za poređenje; prvi nije prepis starog koda projekta.

### Nasleđivanje

```js
class UnistivObjekat {
  constructor(energija = 100) {
    this.energija = energija
  }

  pogodak(steta) {
    this.energija = Math.max(0, this.energija - steta)
  }
}

class Tenk extends UnistivObjekat {}
class Zgrada extends UnistivObjekat {}

const tenk = new Tenk()
tenk.pogodak(30)
console.log(tenk.energija) // 70
```

Zdravlje je u roditelju; tenk ga dobija zato što je `UnistivObjekat`. To je jednostavno dok svim potomcima odgovara isti roditelj.

Problem nastaje kada zgrada već nasleđuje klasu za zgrade, a tenk klasu za vozila. JavaScript klasa ima jednog direktnog roditelja: ne može istovremeno `extends Vozilo` i `extends UnistivObjekat`. Možeš da proširiš zajedničkog pretka, ali tada i drugi potomci dobijaju zdravlje koje im možda ne treba.

### Kompozicija

Isti posao dobija poseban objekat [Health](../core/gameplay/Health.js):

```js
import Health from '/core/gameplay/Health.js'

class Tenk {
  constructor() {
    this.health = new Health({ maximum: 100 })
  }

  pogodak(steta) {
    return this.health.damage(steta)
  }
}

class Zgrada {
  constructor() {
    this.health = new Health({ maximum: 300 })
  }

  pogodak(steta) {
    return this.health.damage(steta)
  }
}

const tenk = new Tenk()
const zgrada = new Zgrada()
tenk.pogodak(30)
console.log(tenk.health.current) // 70
console.log(zgrada.health.current) // 300
```

Obe klase koriste isti kod za računanje zdravlja, ali svaka instanca ima svoje stanje. Pogodak tenka ne menja zdravlje zgrade. Njihove roditeljske klase više nisu uslov za korišćenje zdravlja.

Primeri sa `import` pokreću se kao ES moduli dok lokalni server projekta radi; `/core/` označava koren sajta. Ostali primeri su označeni kao fragment konstruktora ili metoda klase.

## Kako to izgleda u našem tenku

Telo [Tank](../core/gameplay/bodies/vehicles/Tank.js) nasleđuje samo [Body](../core/gameplay/bodies/Body.js), koji mu daje položaj, brzinu, stanja i zdravlje. Unutar konstruktora sastavlja dodatne delove:

```js
// Skraćen fragment konstruktora Tank; clock, groundAt i random su opcije.
this.reload = new Cooldown({ seconds: reloadTime, clock })
this.shells = new ProjectilePool(() => new Shell({ gravity: tank.shellGravity, groundAt, random }))
```

`Cooldown` i bazen projektila se uvoze iz `core/gameplay/`. Tenk povezuje delove; svaki deo ima ograničen posao:

| Deo | Zna | Ne odlučuje o |
|---|---|---|
| [Health](../core/gameplay/Health.js) | Trenutnom i maksimalnom zdravlju | Trzaju, crtanju i pobedi |
| [Cooldown](../core/gameplay/Cooldown.js) | Roku do sledeće radnje | Izgledu i vrsti projektila |
| [ProjectilePool](../core/gameplay/bodies/projectiles/ProjectilePool.js) | Projektilima jednog vlasnika i njihovim pogocima | Uslovu pobede cele igre |
| [Tank](../core/gameplay/bodies/vehicles/Tank.js) | Povezivanju svojih delova i trzaju | Tasterima, crtežu i pravilima igre |

Kada tenk puca, pita svoje delove, a crtež i zvuk pokreće [prikaz](../core/actor/vehicles/TankSprite.js) kad vidi da je broj hitaca porastao:

```js
// Metoda klase Tank.
shoot() {
  if (this.dead || !this.canFire() || !this.reload.ready) return false
  this.reload.start()
  this.shells.fire(this.muzzle, this.yaw, this.elevation, tank.shellSpeed)
  this.shotsFired++
  this.vx -= this.forward * tank.recoil
  return true
}
```

Za drugačiji top možeš sastaviti drugo trajanje punjenja ili drugi projektil kroz opcije. Ne treba ti nova grana klasa samo da bi promenio broj cevi. Ako varijanta ima i druga posebna pravila, zasebna vrsta i dalje može imati smisla.

## Ponašanje možeš da proslediš spolja

U prethodnom primeru tenk sam pravi svoje delove. Druga mogućnost je da ih dobije kroz konstruktor. Ovaj samostalan primer koristi stvarni `Health`, a `Tenk` je pojednostavljen:

```js
import Health from '/core/gameplay/Health.js'

class Tenk {
  constructor({ health = new Health({ maximum: 100 }) } = {}) {
    this.health = health
  }

  pogodak(steta) {
    return this.health.damage(steta)
  }
}

const laki = new Tenk()
const teski = new Tenk({ health: new Health({ maximum: 200 }) })
teski.pogodak(30)
console.log(laki.health.current) // 100
console.log(teski.health.current) // 170
```

Tenk ne mora da odlučuje kako je saradnik napravljen; koristi ga kroz dogovorene metode. To se zove **ubrizgavanje zavisnosti**: običan argument konstruktora, bez posebnog frameworka. U testu tako možeš proslediti mali zamenski objekat koji beleži pozive, ako podržava metode koje tenk koristi.

Samo menjanje maksimuma ne zahteva prosleđivanje celog `Health` objekta: dovoljan može biti i parametar `maximum`. Prosleđivanje saradnika koristi kada zaista želiš da promeniš njegovo stvaranje ili ponašanje. Ne prosleđuj istu promenljivu `health` dvema nezavisnim metama, jer bi tada delile zdravlje.

## Top: sudar od delova

Poljski top nije jedan pravougaonik: točak je krug, a cev i postolje su uski pravougaonici. Umesto podklase „precizan top” on dobija saradnika `collider`, koji zna samo oblike i tela sa kojima se delovi crtaju:

```js
this.collider = new Collider([
  { body: this, shapes: barrelShapes },              // cev se okreće sa topom
  { body: this.postolje, shapes: carriageShapes },   // točak i lafet stoje
])
```

Granata se sastoji od putanje i borbenog pravila: `firstContact` kaže šta je prvo na putu koraka, a `Shell.strike` pravi eksploziju i odloženu štetu. Collider ne zna za zdravlje, timove ni štetu, pa isti oblici služe i drugoj igri sa drugim pravilima.

## Kada zadržati nasleđivanje

Nasleđivanje odgovara kada podklasa može da se koristi na mestu roditelja i deli njegov osnovni ugovor. Tela poput `Tank` i `Fighter` dele ugovor `Body`; partizanski i nemački tenk su isto telo sa drugom vrstom (`tankKinds`), ne podklase. Ne produbljivati hijerarhiju samo radi drugačijih podataka. Konkretna igra nasleđuje `Scene2D` ili `Scene3D` da bi radila kroz postojeći životni ciklus scene.

Kompozicija odgovara ponašanju koje treba različitim vrstama objekata: zdravlje tenku i zgradi, oružje tenku i avionu. Tada se promena tog ponašanja održava u njegovom malom objektu, a ne u zajedničkom pretku svih tih vrsta.

Ne izdvajaj svaku malu metodu u novu klasu. Izdvoji smislen posao sa jasnim podacima i pozivima; klase `Health` i `Cooldown` su primer takvih granica.

## Kako prevesti postojeći objekat

1. Izdvoji jedno ponašanje, npr. računanje zdravlja, sa njegovim stanjem i metodama.
2. Napravi zasebnu instancu tog ponašanja za svaki objekat kojem pripada.
3. U objektu zameni računanje direktnim pozivom saradnika.
4. Ako postojeći kod čita staro ime, privremeno ostavi getter koji čita novo stanje. Stvarni tenk ima `energija` → `health.current`; ne čuva oba podatka zasebno.
5. Uporedi ponašanje igre sa `backup/pre-ai-changes` i proveri da refaktor nije promenio ishod, trzaj, animacije ili druge postojeće efekte.

**Provera razumevanja:** ako želiš da i zgrada dobije zdravlje, da li mora da postane potomak tenka? Sa kompozicijom ne mora: dobije svoju instancu `Health`, dok njena klasa i pravila ostaju njeni.
