/**
 * Fixes import warning when loading .scss files
 */

declare module '*.scss' {
  export const content: { [className: string]: string }
  export default content
}

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
