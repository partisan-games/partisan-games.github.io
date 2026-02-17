class FullScreen extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', this.toggle)
  }

  connectedCallback() {
    this.innerHTML = /* html */`
      <style>
        .full-screen-icon {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 2;
          transition: transform 0.25s;
        }
        .full-screen-icon:hover {
          transform: scale(1.1);
        }
      </style>
      <input
        type="image"
        class="full-screen-icon pointer"
        width="40" 
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA+AAAAPgBz8HmZQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFGSURBVFiF7ZcxbgIxEEVfwCAKmhQUkQIHSgEUJBJcgQOEhmOkT5GlyNJQUXEqqFCkpLA38lq212ZZQeEvWeuRNX/+2F57DPAb2NaEYx3K24ogbQQ3FwD2qdkDA+BRa70Izp7hO1CctljO9dkCnTqZKbSBzBOnZBwM+xsQNYILxeGLUTKeLWovnQlb5jkw9Al4cjjGinAF76gYXgEuglARVb5BAkCuX26MZwECviyZ6/uoJEAAK23wqPV/gLnqz4AzckNVIQdegS4y87ni0mOsLH5OCGTmkwififKp8wclJCQk/KMNfALTCJ8X5EFUeXc8AO+a/QGcNFsAG+TRegbegF0F5xh5HHfVd0H5KO4DS93BdxmZxcQll5FZ1Nz/ddxUQVJweAXYSrKikomFS8TIJ+DmRek1MjcRVZYX7S4eJmZLj9NG8AcRDQY6QwK5ggAAAABJRU5ErkJggg==" 
        alt="full screen"
        title="Full screen"
      />
    `
  }

  toggle() {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen()
    else if (document.exitFullscreen)
      document.exitFullscreen()
  }
}

customElements.define('full-screen-btn', FullScreen)