// src/components/ui/card.jsx
import * as React from "react";
import { cn } from "../lib/utils";

function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn("px-4 py-2 border-b border-slate-200 dark:border-slate-700", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("px-4 py-2", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
