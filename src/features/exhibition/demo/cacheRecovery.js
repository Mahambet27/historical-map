export const PROJECT_CACHE_PREFIXES = Object.freeze([
  "qazaq-heritage",
  "qhm-",
]);

export const isProjectCacheName = (name) =>
  PROJECT_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix));

export const clearProjectCaches = async (
  cacheStorage = globalThis.caches
) => {
  if (!cacheStorage) return [];
  const names = await cacheStorage.keys();
  const projectCaches = names.filter(isProjectCacheName);
  await Promise.all(projectCaches.map((name) => cacheStorage.delete(name)));
  return projectCaches;
};

export const getServiceWorkerStatus = async (
  serviceWorker = navigator.serviceWorker
) => {
  if (!serviceWorker) return { supported: false, registered: false };
  const registration = await serviceWorker.getRegistration();
  return {
    supported: true,
    registered: Boolean(registration),
    state:
      registration?.active?.state ||
      registration?.waiting?.state ||
      registration?.installing?.state ||
      "none",
  };
};

export const reregisterServiceWorker = async (
  serviceWorker = navigator.serviceWorker
) => {
  if (!serviceWorker) return null;
  const registration = await serviceWorker.getRegistration();
  await registration?.unregister();
  return serviceWorker.register("/sw.js", { scope: "/" });
};

