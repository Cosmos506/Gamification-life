import React from "react";

export function Button({ children, variant = "primary", size = "default", className = "", ...props }) {
  const base = "px-4 py-2 rounded-xl font-semibold transition";
  const variants = {
    primary: "bg-slate-800 text-white hover:bg-slate-700",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    destructive: "bg-red-600 text-white hover:bg-red-500",
    ghost: "bg-transparent text-slate-800 hover:bg-slate-100",
  };
  const sizes = {
    default: "text-sm",
    sm: "text-xs px-2 py-1",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
