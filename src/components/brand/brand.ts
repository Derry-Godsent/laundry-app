/* The brand, in one place.
 *
 * The console shows the company mark in four places (sign-in, the sidebar, the
 * mobile top bar, and the browser tab and home screen icons) and the company
 * name in several more. They all read from here, so renaming the business or
 * replacing the logo is one edit, not a search.
 *
 * To use the real logo: put the file at `public/brand/logo.png` (a square PNG
 * with a transparent background works best) and every mark picks it up. Until
 * then each mark falls back to a monogram built from the initials below, which
 * is why the app never shows a broken image.
 */
export const BRAND = {
  /** The registered name, for documents and footers. */
  name: "Chapman Prestige Limited",
  /** The name as it is spoken, for the sidebar and the sign-in screen. */
  short: "Chapman Prestige",
  /** What this app is, under the mark. */
  product: "Operations console",
  /** The logo, if it has been added to `public/brand/`. */
  logo: "/brand/logo.png",
}
