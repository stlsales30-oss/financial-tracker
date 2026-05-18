"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.style.backgroundColor = "#0f1117";
      document.body.style.color = "#e2e8f0";
    } else {
      root.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#0f172a";
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: theme === "dark" ? "#0f1117" : "#f8fafc",
          color: theme === "dark" ? "#e2e8f0" : "#0f172a",
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
