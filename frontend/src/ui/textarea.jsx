// src/components/ui/textarea.jsx
import * as React from "react";
import { cn } from "../lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full min-h-[80px] rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-slate-700 dark:placeholder-slate-500 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
