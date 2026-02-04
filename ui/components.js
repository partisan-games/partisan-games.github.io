export const progresBar = (energija, klasa) =>
/* html*/`
  <div class="progress-wrapper">
    <progress class="${klasa || ''}" value="${energija}" max='100'></progress>
    <div class="energija">${Math.round(energija)}</div>
  </div>
`
