import type Lenis from "lenis";
/* One scroller, shared. The intro needs to stop it — overflow:hidden never
   did, because Lenis is not the document scroller. */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { instance = l; };
export const getLenis = () => instance;
