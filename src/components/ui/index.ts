/* The staff console design system, in one import.
   `import { Card, CardHeader, Button, StatusPill } from "@/components/ui";` */
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { Card, CardHeader, CardBody, CardFooter } from "./Card";

export { StatusPill } from "./StatusPill";
export type { PillTone } from "./StatusPill";

export { PageHeader } from "./PageHeader";
export { Avatar } from "./Avatar";
export { StatTile } from "./StatTile";
export { SegmentedControl } from "./SegmentedControl";
export type { SegmentOption } from "./SegmentedControl";
export { EmptyState } from "./EmptyState";
export { Banner } from "./Banner";
export type { BannerTone } from "./Banner";
export { Sparkline } from "./Sparkline";
export { KpiCard } from "./KpiCard";

/* Mobile patterns (phase B): the shared shapes every page composes from, so a
   list, a filter row and a confirmation behave the same on every screen. */
export { FilterBar } from "./FilterBar";
export type { FilterBarProps } from "./FilterBar";
export { RecordList, RecordRow } from "./RecordRow";
export type { RecordListProps, RecordRowProps } from "./RecordRow";
export { DetailView } from "./DetailView";
export type { DetailViewProps } from "./DetailView";
export { ActionBar } from "./ActionBar";
export type { ActionBarProps } from "./ActionBar";
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps, ConfirmTone } from "./ConfirmDialog";
export { ErrorState, LoadingRows } from "./States";
export type { ErrorStateProps, LoadingRowsProps } from "./States";
export { useOverlay } from "./useOverlay";
