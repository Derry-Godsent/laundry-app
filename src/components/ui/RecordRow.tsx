import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RecordRowProps {
  /** Avatar, icon or initials block on the left. */
  lead?: ReactNode;
  /** The record's name. Keep it short: it truncates on a phone. */
  title: ReactNode;
  /** One line under the title: who it is, what it is, when. */
  subtitle?: ReactNode;
  /** Facts worth scanning, each rendered as its own item. */
  meta?: ReactNode[];
  /** Status pill, amount or chevron. */
  trail?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  /** Rendered as a button when true, a plain row otherwise. */
  interactive?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * One record in a list.
 *
 * On a desk this reads as a table row. On a phone it becomes a card with a
 * comfortable tap area, which is the whole reason lists stopped being tables
 * there: a table row forces the columns to shrink until the record is unreadable.
 */
export const RecordRow = ({
  lead,
  title,
  subtitle,
  meta,
  trail,
  selected = false,
  onClick,
  interactive,
  className,
  ...rest
}: RecordRowProps) => {
  const isInteractive = interactive ?? Boolean(onClick);

  const content = (
    <>
      {lead ? <div className="record__lead">{lead}</div> : null}

      <div className="record__main">
        <div className="record__title"><span>{title}</span></div>
        {subtitle ? <div className="record__sub">{subtitle}</div> : null}
        {meta && meta.length > 0 ? (
          <div className="record__meta">
            {meta.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>

      {trail ? <div className="record__trail">{trail}</div> : null}
    </>
  );

  const classes = cn("record", selected && "is-selected", className);

  if (!isInteractive) {
    return <div className={classes} {...rest}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-pressed={selected}
      {...rest}
    >
      {content}
    </button>
  );
};

export interface RecordListProps {
  children: ReactNode;
  className?: string;
  /** Screen-reader label for the list itself. */
  label?: string;
}

/** The container that gives records their spacing and phone card treatment. */
export const RecordList = ({ children, className, label }: RecordListProps) => (
  /* A plain container with a name: the rows are buttons, so role="list" would
     claim listitem children that are not there. */
  <div className={cn("record-list", className)} aria-label={label}>
    {children}
  </div>
);

export default RecordRow;
