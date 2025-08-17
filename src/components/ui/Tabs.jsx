import React, { useState, createContext, useContext } from "react";

const TabsContext = createContext();

export function Tabs({ children, defaultValue }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>;
}

export function TabsList({ children, className = "" }) {
  return <div className={`flex border-b ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children, className = "" }) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      className={`px-4 py-2 ${active ? "border-b-2 border-slate-800 font-semibold" : "text-slate-500"} ${className}`}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
