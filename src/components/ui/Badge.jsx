import React from "react";

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-200 text-gray-800",
    secondary: "bg-slate-100 text-slate-400",
    green: "bg-green-600 text-white",
  };
  return <span className={`px-2 py-1 rounded-xl text-xs font-semibold ${variants[variant]} ${className}`}>{children}</span>;
}
