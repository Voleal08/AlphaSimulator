import React from "react";
import { useAppStore } from "../store/AppStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <button className="btn" onClick={toggleTheme}>
      {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
    </button>
  );
}