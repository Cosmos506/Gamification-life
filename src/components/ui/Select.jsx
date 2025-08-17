import React, { useState } from "react";

export function Select({ value, onValueChange, children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function SelectTrigger({ children, className = "" }) {
  return <div className={`border rounded-lg px-3 py-2 cursor-pointer ${className}`}>{children}</div>;
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ children, className = "" }) {
  return <div className={`mt-1 border rounded-lg bg-white ${className}`}>{children}</div>;
}

export function SelectItem({ value, children }) {
  return <div className="px-2 py-1 hover:bg-slate-100 cursor-pointer">{children}</div>;
}
