export const css = /* css */`
  .tabs {
    position: absolute;
    box-shadow: 0 4px 4px -2px rgba(0, 0, 0, 0.5);
    max-width: 240px;
    position: absolute;
  }

  .tab {
    overflow: hidden;
  }

  .tab input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    z-index: -1;
  }

  .tab-label {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: #2C6E63;
    font-weight: bold;
    border-bottom: 1px solid #1C4740;
  }

  .tab-label::after {
    content: "❯";
    width: 1em;
    height: 1em;
    text-align: center;
    transition: all 0.35s;
  }

  .tab-content {
    max-height: 0;
    background: white;
    transition: all .45s;
  }

  .tab-content button {
    width: 100%;
    text-align: left;
    text-transform: none;
  }

  input:checked+.tab-label {
    background: #1C4740;
  }

  input:checked+.tab-label::after {
    transform: rotate(90deg);
  }

  input:checked~.tab-content {
    max-height: 100vh;
  }
`