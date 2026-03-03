import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppStoreProvider } from "./store/AppStore";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </React.StrictMode>
);