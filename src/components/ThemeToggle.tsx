import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="relative w-14 h-7 rounded-full bg-secondary border border-border transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center transition-all duration-300 ease-in-out ${
          dark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {dark ? (
          <Moon className="w-3.5 h-3.5 text-primary-foreground transition-all duration-300" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-primary-foreground transition-all duration-300" />
        )}
      </span>
    </button>
  );
}
