/** The classes that each UI style gives to the shared elements; a scene picks its style once. */
export const styleClasses = {
  simple: {
    container: 'simple-container',
    button: 'default-button',
    score: '',
    controlButton: '',
    healthBar: '',
    cameraButton: '',
  },
  rpg: {
    container: 'rpgui-container framed',
    button: 'rpgui-button',
    score: 'rpgui-button golden',
    controlButton: 'rpgui-button',
    healthBar: 'rpgui-progress',
    cameraButton: 'rpgui-button',
  },
  white: {
    container: 'white-container',
    button: 'white-button',
    score: '',
    controlButton: 'white-button',
    healthBar: '',
    cameraButton: '',
  },
}

// only one scene lives at a time, and it sets its style before it creates any element
let currentStyle = 'simple'

export function setUiStyle(style = 'simple') {
  currentStyle = style
}

export const currentStyleClasses = () => styleClasses[currentStyle]
