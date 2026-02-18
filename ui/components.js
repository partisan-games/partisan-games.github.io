export const progresBar = (energija, klasa) =>
/* html*/`
  <div>
    <progress class="${klasa || ''}" value="${energija}" max='100'></progress>
  </div>
`
