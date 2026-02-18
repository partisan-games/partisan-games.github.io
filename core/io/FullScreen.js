class FullScreen extends HTMLElement {
  constructor() {
    super()
    this.toggle = this.toggle.bind(this)
    this.addEventListener('click', this.toggle)
  }

  connectedCallback() {
    this.innerHTML = /* html */`
      <style>
        .full-screen-icon {
          position: fixed;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          font-size: 2.5rem;
        }
      </style>
      <span class="full-screen-icon pointer">⛶</span>
    `
  }

  toggle(e) {
    e.stopPropagation()

    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen()
    else if (document.exitFullscreen)
      document.exitFullscreen()
  }
}

customElements.define('full-screen-btn', FullScreen)