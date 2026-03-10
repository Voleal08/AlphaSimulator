import React from "react";
import { useAppStore } from "../store/AppStore";

const baseStyle = {
  display: "block",
  height: 26,
  width: "auto",
  backgroundColor: "transparent"
};

function logoStyle(theme, height) {
  return {
    ...baseStyle,
    height,
    // убирает белую подложку, если она зашита в картинку
    mixBlendMode: "multiply",
    // в тёмной теме слегка “подсветим”, чтобы не было слишком темно
    filter: theme === "dark" ? "brightness(1.25) contrast(1.05)" : "none"
  };
}

export function AlfaLogo({ height = 26 }) {
  const { theme } = useAppStore();

  return (
    <img
      src="/альфа_будущее_лого.webp"
      alt="Альфа-Будущее"
      style={logoStyle(theme, height)}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}

export function SiriusLogo({ height = 26 }) {
  const { theme } = useAppStore();

  return (
    <img
      src="/университет_сириус_лого.webp"
      alt="Университет Сириус"
      style={logoStyle(theme, height)}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}