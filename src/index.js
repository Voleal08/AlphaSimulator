import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

import { AppStoreProvider } from "./store/AppStore";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </React.StrictMode>
);