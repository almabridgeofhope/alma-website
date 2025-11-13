/// <reference types="vite/client" />

// Vite ImageTools Type Definitions
declare module "*?format=webp" {
  const src: string;
  export default src;
}

declare module "*?format=avif" {
  const src: string;
  export default src;
}

declare module "*?w=*" {
  const src: string;
  export default src;
}

declare module "*?h=*" {
  const src: string;
  export default src;
}

declare module "*?as=*" {
  const src: string;
  export default src;
}
