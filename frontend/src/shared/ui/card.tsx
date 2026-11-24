import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/** The 30% surface: cards, panels and form areas sit on secondary with ink text. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl bg-secondary p-5 text-ink", className)} {...rest} />;
}
