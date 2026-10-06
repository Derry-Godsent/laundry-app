import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * View switcher for queues and ranges.
 *
 * Counts are part of the control on purpose: staff can see how much work sits
 * behind each view without opening it — the numbers come from the same live
 * query the list uses, so they can never drift.
 */
export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) => (
  <div className={cn("segmented", className)} role="group" aria-label={ariaLabel}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          className={cn("segmented__item", active && "is-active")}
          aria-pressed={active}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="segmented__count">{option.count}</span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
