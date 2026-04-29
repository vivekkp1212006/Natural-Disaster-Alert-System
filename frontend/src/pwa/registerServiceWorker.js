const SERVICE_WORKER_PATH = `${process.env.PUBLIC_URL}/service-worker.js`;

export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH)
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}

export function isPwaStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
