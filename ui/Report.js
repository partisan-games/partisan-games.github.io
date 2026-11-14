import { createSound } from '/core/io/sound.js'

const css = /* css */`
  @font-face {
    font-family: "1942 Report";
    src: url("/assets/fonts/1942.ttf");
    font-display: swap;
  }

  .report {
    background-color: #cccccc;
    background-image: url(/assets/images/ui/document.jpg);
    background-size: cover;
    width: 100%;
    max-width: 420px;
    min-height: 260px;

    & p {
      color: #333;
      font-family: '1942 Report', Courier, monospace;
      font-size: initial;
      font-weight: bold;
      line-height: 1.2;
      margin: 0;
      padding: 150px 15% 8px;
      text-shadow: none;
    }

    & .report-word {
      display: inline-block;
      white-space: nowrap;
    }
  }
`

// one stylesheet for the whole page, shared by every start screen report
const style = document.createElement('style')
style.textContent = css

function createHtml(id) {
  const div = document.createElement('div')
  div.className = 'report'

  setTimeout(() => {
    const container = document.getElementById(id)
    container.prepend(div)
  }, 1)

  const p = document.createElement('p')
  div.appendChild(p)
  return p
}

export default class Report {
  constructor({ text = 'Destroy all enemy aircraft.', containerId } = {}) {
    this.i = 0
    this.intervalId
    this.text = text
    this.containerId = containerId
    this.p = createHtml(containerId)
    this.characters = []

    for (const token of text.match(/\s+|\S+/g) || []) {
      if (/^\s+$/.test(token)) {
        for (const character of token) {
          this.p.append(character === '\n' ? document.createElement('br') : document.createTextNode(character))
          this.characters.push(null)
        }
        continue
      }

      const word = document.createElement('span')
      word.className = 'report-word'
      for (const character of token) {
        const letter = document.createElement('span')
        letter.textContent = character
        letter.style.visibility = 'hidden'
        word.appendChild(letter)
        this.characters.push(letter)
      }
      this.p.appendChild(word)
    }

    if (!style.isConnected) document.head.appendChild(style)

    this.audio = createSound('typing.mp3')
    this.init()
  }

  init() {
    if (this.intervalId) return
    this.intervalId = setInterval(this.kucaj, 80)
    // the typing sound is optional: the browser may block it, and stop() may pause it before it starts
    this.audio.play().catch(() => {})
  }

  kucaj = () => {
    const letter = this.characters[this.i++]
    if (letter) letter.style.visibility = 'visible'
    if (this.i >= this.characters.length) this.stop()
  }

  stop() {
    this.audio.pause()
    clearInterval(this.intervalId)
  }
}
