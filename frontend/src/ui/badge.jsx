import React from "react";

export function Badge({ className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
