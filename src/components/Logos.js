import React from "react";

/*
  Это SVG-заглушки (неофициальные логотипы).
  Если у вас есть права на реальные логотипы — положите их в public/ и замените на <img src="/..."/>.
*/

export function AlfaLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-label="Alfa placeholder">
      <rect x="1" y="1" width="32" height="32" rx="10" fill="rgba(239,49,36,0.15)" stroke="rgba(239,49,36,0.55)" />
      <path d="M10 22 L17 10 L24 22" stroke="rgba(239,49,36,1)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M13 18 H21" stroke="rgba(239,49,36,1)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function SiriusLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-label="Sirius placeholder">
      <rect x="1" y="1" width="32" height="32" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(160,170,190,0.65)" />
      <path
        d="M17 9 L19 15 L25 15 L20 18.5 L22 24 L17 20.5 L12 24 L14 18.5 L9 15 L15 15 Z"
        fill="rgba(160,170,190,0.95)"
      />
    </svg>
  );
}