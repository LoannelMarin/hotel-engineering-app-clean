// src/components/ui/input.jsx
import * as React from "react";
import { cn } from "../lib/utils";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-slate-700 dark:placeholder-slate-500 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
