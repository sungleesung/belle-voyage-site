"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [t, setT] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    const d = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    setT(d ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);
  const flip = () => {
    const n = t === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem("bv-theme", n); } catch {}
    setT(n);
  };
  return (
    <button className="tt" type="button" onClick={flip}>
      <span className="sr">Switch to {t === "dark" ? "light" : "dark"} theme</span>
      <span aria-hidden="true">Invert</span>
    </button>
  );
}
