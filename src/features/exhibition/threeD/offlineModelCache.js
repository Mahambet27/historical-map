export const THREE_D_CACHE_PREFIX = "qazaq-heritage-3d-";
export const THREE_D_CACHE_VERSION = "v1";
export const THREE_D_CACHE_NAME = `${THREE_D_CACHE_PREFIX}${THREE_D_CACHE_VERSION}`;

export const cleanupOld3DCaches = async (cacheStorage = globalThis.caches) => {
  if (!cacheStorage) return [];
  const names = await cacheStorage.keys();
  const stale = names.filter(
    (name) => name.startsWith(THREE_D_CACHE_PREFIX) && name !== THREE_D_CACHE_NAME
  );
  await Promise.all(stale.map((name) => cacheStorage.delete(name)));
  return stale;
};

export const isModelCached = async (
  src,
  cacheStorage = globalThis.caches
) => {
  if (!cacheStorage) return false;
  const cache = await cacheStorage.open(THREE_D_CACHE_NAME);
  return Boolean(await cache.match(src));
};

export const cacheModelForOffline = async ({
  src,
  fileSizeBytes,
  fetchImpl = fetch,
  cacheStorage = globalThis.caches,
  onProgress = () => {},
}) => {
  if (!cacheStorage) throw new Error("Cache Storage is unavailable");
  await cleanupOld3DCaches(cacheStorage);
  const response = await fetchImpl(src, { cache: "no-store" });
  if (!response.ok) throw new Error(`Model download failed (${response.status})`);
  const total = Number(response.headers.get("content-length")) || fileSizeBytes || 0;
  let loaded = 0;
  let cacheResponse;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress({ loaded, total, percent: total ? Math.min(100, (loaded / total) * 100) : 0 });
    }
    const body = new Blob(chunks, { type: "model/gltf-binary" });
    cacheResponse = new Response(body, {
      status: 200,
      headers: {
        "content-type": "model/gltf-binary",
        "content-length": String(body.size),
      },
    });
  } else {
    const body = await response.blob();
    loaded = body.size;
    onProgress({ loaded, total: total || loaded, percent: 100 });
    cacheResponse = new Response(body, {
      status: 200,
      headers: { "content-type": "model/gltf-binary", "content-length": String(body.size) },
    });
  }
  const cache = await cacheStorage.open(THREE_D_CACHE_NAME);
  await cache.put(src, cacheResponse);
  return { cacheName: THREE_D_CACHE_NAME, loaded, total: total || loaded };
};

