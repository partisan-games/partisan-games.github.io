## Dokumentacija

### Scena2D

`Scena2D` automatski poziva razne metode, koje nasledne scene mogu implementirati.

Metoda koje poziva jednom:

```js
init()
```

Metoda koje poziva na klik:

```js
handleClick(e)
```

#### Glavna petlja

Metode koje Scena2D poziva unutar glavne petlje:

```js
loop(dt, t) {
    this.handleInput(dt)
    this.update(dt, t)
    this.clear()
    this.render(dt, t)
    this.sceneUI()
}
```

Ako dodamo predmet sceni, Scena2D na njemu svaki frejm poziva sledeće metode:

```js
predmet.handleInput()
predmet.update()
    predmet.proveriGranice()
predmet.render()
```

Ako predmeti imaju druge predmete unutar sebe, i njihove metode će se rekurzivno pozivati.

Ako predmet nije dodat sceni, onda ove metode pozivamo ručno. 

Scenu okončavamo na `end()`, što zaustavlja animaciju, čisti šablone iz DOM-a, prazni predmete, zaustavlja zvuke i slično. U naslednim scenama je potrebno ukloniti sve dodate događaje.

### Platno

Platno vodi računa o veličini ekrana. Podrazumevano je to veličina scene.

### Mish

Mish vodi računa o svemu što se tiče kursora, njegovoj poziciji, izgledu, itd.
