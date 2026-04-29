/**
 * Push notification foundation.
 * This keeps the integration point ready without enabling push flow yet.
 */
export const pushService = {
  isSupported() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  },

  async getRegistration() {
    if (!("serviceWorker" in navigator)) return null;
    return navigator.serviceWorker.ready;
  },

  async getExistingSubscription() {
    if (!this.isSupported()) return null;
    const registration = await this.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  },

  async getPermissionState() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  },
};
