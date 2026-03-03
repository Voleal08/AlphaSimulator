import React from "react";
import { Link } from "react-router-dom";
import SiteShell from "../components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="card">
        <div className="cardInner col">
          <div className="h1">Страница не найдена</div>
          <div className="muted">Проверьте URL.</div>
          <Link className="btn btnPrimary" to="/">На главную</Link>
        </div>
      </div>
    </SiteShell>
  );
}