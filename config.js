export default {
  volume: .4
}

export const isDev = false // location.hostname === 'localhost' || location.hostname === '127.0.0.1'

export const isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

export const hasMouse = window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches
