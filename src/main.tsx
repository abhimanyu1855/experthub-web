
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { LenisProvider } from "./app/providers/LenisProvider.tsx";

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(err => {
        console.warn("Service worker registration failed:", err);
      });
    });
  }

  createRoot(document.getElementById("root")!).render(
    <LenisProvider>
      <App />
    </LenisProvider>
  );