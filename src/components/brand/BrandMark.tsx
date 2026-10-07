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

  const mark = logoFailed ? (
    /* The same geometry as public/brand/monogram.svg, which is the source of
       the tab icon and the home screen icon: drawn from paths rather than set
       in a font, so the mark cannot change shape with a font that failed to
       load, and the small sizes stay crisp. */
    <svg className="brandmark__mono" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <g transform="translate(3 0)" fill="none" stroke="currentColor" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
        <path d="M259 186 A92 92 0 1 0 259 326" />
        <path d="M310 352 V160 H356 A52 52 0 0 1 356 272 H310" />
      </g>
    </svg>
  ) : (
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
  );

  return (
    <span className={["brandmark", `brandmark--${size}`, className].filter(Boolean).join(" ")}>
      <span className="brandmark__chip">{mark}</span>
      {withText && (
        <span className="brandmark__text">
          <span className="brandmark__name">{BRAND.short}</span>
          <span className="brandmark__product">{BRAND.product}</span>
        </span>
      )}
    </span>
  );
};
