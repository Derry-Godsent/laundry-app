import { useState } from "react";
import { BRAND } from "./brand";
import "./BrandMark.css";

/**
 * The company mark.
 *
 * Renders `public/brand/logo.png` when that file exists and falls back to the
 * initials when it does not, so a missing file can never show a broken image
 * on the sign-in screen or in the sidebar. The image is loaded inside a chip,
 * so a logo of any shape or aspect sits correctly without being cropped.
 */
type Size = "sm" | "md" | "lg" | "xl";

export interface BrandMarkProps {
  /** sm 26px (top bar), md 34px (sidebar), lg 44px, xl 72px (sign-in). */
  size?: Size;
  /** The company name and product line beside the mark. */
  withText?: boolean;
  /** Rendered instead of the mark only, for a header that already has a title. */
  className?: string;
}

export const BrandMark = ({ size = "md", withText = false, className }: BrandMarkProps) => {
  const [logoFailed, setLogoFailed] = useState(false);

  /* Which mark, and why.
   *
   * The supplied artwork is 99 pixels wide and its three letters occupy about
   * twelve of them, so below roughly 44 pixels of placement the letters are
   * about four pixels each and read as a smudge. It is also navy, which
   * disappears on the navy chip and on a dark launcher.
   *
   * So the artwork is used where it can be seen, on a light plate, and the
   * drawn letters are used in the small chrome slots where they are sharper
   * and always legible. Neither is ever stretched: the artwork keeps its own
   * aspect inside the plate. */
  const useArtwork = !logoFailed && (size === "lg" || size === "xl");

  const drawn = (
    /* The same geometry as public/brand/monogram.svg, which is the source of
       the tab icon and the home screen icon: drawn from paths rather than set
       in a font, so the mark cannot change shape with a font that failed to
       load, and the small sizes stay crisp. */
    <svg className="brandmark__mono" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <g transform="translate(256 256) scale(1.16) translate(-256 -256)" fill="none" stroke="currentColor" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 168 A88 88 0 1 0 150 344" />
        <path d="M260 344 V168 H296 A44 44 0 0 1 296 256 H260" />
        <path d="M368 168 V344 H440" />
      </g>
    </svg>
  );

  const mark = useArtwork ? (
    <img
      className="brandmark__img"
      src={BRAND.logo}
      alt=""
      width={72}
      height={72}
      decoding="async"
      onError={() => setLogoFailed(true)}
      onLoad={(event) => {
        /* A 404 can still fire `load` in some engines, with no pixels in it:
           a natural width of zero means nothing was decoded, so the mark
           falls back rather than showing an empty square. */
        if (event.currentTarget.naturalWidth === 0) setLogoFailed(true);
      }}
    />
  ) : (
    drawn
  );

  return (
    <span className={["brandmark", `brandmark--${size}`, className].filter(Boolean).join(" ")}>
      <span className={`brandmark__chip${useArtwork ? " brandmark__chip--plate" : ""}`}>{mark}</span>
      {withText && (
        <span className="brandmark__text">
          <span className="brandmark__name">{BRAND.abbr}</span>
          <span className="brandmark__product">{BRAND.name}</span>
        </span>
      )}
    </span>
  );
};
