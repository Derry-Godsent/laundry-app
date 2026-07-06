import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const KpiCard = ({ title, value, trend, icon, onClick, className }: KpiCardProps) => {
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-400 bg-emerald-400/10"
      : trend?.direction === "down"
      ? "text-red-400 bg-red-400/10"
      : "text-zinc-400 bg-zinc-400/10";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-800/60",
        "bg-zinc-900/50 backdrop-blur-sm p-5",
        "transition-colors duration-200",
        onClick && "cursor-pointer hover:border-indigo-500/40 hover:bg-zinc-900/70",
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-500/10 blur-2xl" />
      
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          {icon && <div className="rounded-lg bg-zinc-800/80 p-2 text-zinc-300">{icon}</div>}
        </div>

        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
          {trend && (
            <span className={`mb-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendColor}`}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};