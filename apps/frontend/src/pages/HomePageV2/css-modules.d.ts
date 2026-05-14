/**
 * Local CSS-module type declarations for the HomePageV2 experiment.
 *
 * Scoped to this folder (the project doesn't ship a global vite-env.d.ts
 * yet, and the brief says not to modify files outside HomePageV2/).
 * Once a project-wide ambient declaration lands, this file can be deleted.
 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
