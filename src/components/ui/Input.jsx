import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 ${className}`}
      {...props}
    />
  );
}