function track(eventName, eventData) {
  if (typeof window !== "undefined" && window.umami) {
    if (eventData) {
      window.umami.track(eventName, eventData);
    } else if (eventName) {
      window.umami.track(eventName);
    } else {
      window.umami.track();
    }
  }
}

export function trackPage() {
  track();
}

export function trackEvent(name, data) {
  track(name, data);
}
