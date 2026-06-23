import { HTMLAttributes } from "react";
import clsx from "clsx";

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
