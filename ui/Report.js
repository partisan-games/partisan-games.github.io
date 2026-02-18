import config from '/config.js'

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
  }
`

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

    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)

    this.audio = new Audio('/assets/sounds/typing.mp3')
    this.audio.volume = config.volume
    this.init()
  }

  init() {
    if (this.intervalId) return
    this.intervalId = setInterval(this.kucaj, 80)
    this.audio.play()
  }

  kucaj = () => {
    this.p.innerHTML += this.text.charAt(this.i)
    this.p.innerHTML = this.p.innerHTML.replace(/\n/g, '<br>')
    if (this.i >= this.text.length)
      this.stop()
    this.i++
  }

  stop() {
    this.audio.pause()
    clearInterval(this.intervalId)
  }
}
