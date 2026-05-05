import React from "react";
import { useAppStore } from "../store/AppStore";

const baseStyle = {
  display: "block",
  width: "auto",
  objectFit: "contain",
  backgroundColor: "transparent",
  userSelect: "none"
};

function logoStyle(theme, height) {
  if (theme === "dark") {
    return {
      ...baseStyle,
      height,
      /*
        Белый фон -> чёрный, который сливается с тёмной темой.
        Цвета логотипа стараемся сохранить через hue-rotate(180deg).
      */
      filter: "invert(1) hue-rotate(180deg) brightness(1.08) contrast(1.04)",
      mixBlendMode: "screen"
    };
  }

  return {
    ...baseStyle,
    height,
    /* В светлой теме просто убираем белую подложку */
    mixBlendMode: "multiply",
    filter: "none"
  };
}

export function AlfaLogo({ height = 26 }) {
  const { theme } = useAppStore();

  return (
    <img
      src="/alfa-logo.webp"
      alt="Альфа"
      style={logoStyle(theme, height)}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export function SiriusLogo({ height = 26 }) {
  const { theme } = useAppStore();

  return (
    <img
      src="/sirius-logo.webp"
      alt="Сириус"
      style={logoStyle(theme, height)}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}