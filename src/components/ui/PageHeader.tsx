import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Small gold label above the title — the page's "home" in the console. */
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, subtitle, actions }: PageHeaderProps) => (
  <header className="page-header">
    <div className="page-header__text">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
    {actions ? <div className="page-header__actions">{actions}</div> : null}
  </header>
);

export default PageHeader;
