// src/components/ui/select.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";

const SelectCtx = createContext(null);

export function Select({ value, onValueChange, children, className }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const ctx = useMemo(
    () => ({
      value,
      setValue: (v, lbl) => {
        onValueChange?.(v);
        if (lbl !== undefined) setSelectedLabel(lbl);
      },
      open,
      setOpen,
      selectedLabel,
      setSelectedLabel,
    }),
    [value, onValueChange, open, selectedLabel]
  );

  return (
    <SelectCtx.Provider value={ctx}>
      <div className={cn("relative", className)}>{children}</div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className, children, disabled }) {
  const { open, setOpen } = useContext(SelectCtx);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm",
        "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50",
        className
      )}
    >
      <span className="truncate w-full text-left">{children}</span>
      <svg
        className={cn("ml-2 h-4 w-4 transition-transform", open && "rotate-180")}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.127l3.71-3.896a.75.75 0 111.08 1.04l-4.24 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, className }) {
  const { selectedLabel } = useContext(SelectCtx);
  return (
    <span className={cn(!selectedLabel && "text-slate-400", className)}>
      {selectedLabel || placeholder || "Select…"}
    </span>
  );
}

export function SelectContent({ className, children }) {
  const { open, setOpen } = useContext(SelectCtx);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg",
        className
      )}
    >
      <ul className="max-h-64 overflow-auto py-1">{children}</ul>
    </div>
  );
}

export function SelectItem({ value, children, className }) {
  const { value: current, setValue, setSelectedLabel } = useContext(SelectCtx);
  const isActive = current === value;

  // Si el valor actual coincide, aseguremos que el label quede sincronizado
  useEffect(() => {
    if (isActive && typeof children === "string") setSelectedLabel(children);
  }, [isActive, children, setSelectedLabel]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setValue(value, typeof children === "string" ? children : String(children))}
        className={cn(
          "flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm",
          "hover:bg-slate-50 focus:bg-slate-50",
          isActive ? "bg-blue-50 text-blue-700" : "text-slate-700",
          className
        )}
      >
        {children}
      </button>
    </li>
  );
}
