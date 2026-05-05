import { render, screen } from "@testing-library/react";
import App from "./App";
import { AppStoreProvider } from "./store/AppStore";

test("renders app header", () => {
  render(
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  );
  expect(screen.getByRole("button", { name: /Войти/i })).toBeInTheDocument();
});
