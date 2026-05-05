import React from "react";
import { useAppStore } from "../store/AppStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === "dark";

  return (
    <button
      className="btn btnGhost btnIcon"
      onClick={toggleTheme}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      type="button"
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>
        {isDark ? "☾" : "☼"}
      </span>
    </button>
  );
}