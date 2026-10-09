import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Selalu mulai dari Home saat halaman dimuat ulang
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
window.scrollTo(0, 0);
window.addEventListener("beforeunload", () => window.scrollTo(0, 0));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);