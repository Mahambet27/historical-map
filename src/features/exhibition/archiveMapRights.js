const FULL_DISPLAY_LICENSES = new Set([
  "public_domain",
  "open_license",
  "permission_granted",
  "educational_use_only",
]);

export const canDisplayFullArchiveMap = (map) =>
  Boolean(
    map?.imageUrl &&
      FULL_DISPLAY_LICENSES.has(map?.license?.status) &&
      map.georeferenceType !== "unavailable-preview"
  );

export const canCacheArchiveMap = (map) =>
  canDisplayFullArchiveMap(map) && map?.license?.cacheAllowed === true;

export const canExportArchiveMap = (map) =>
  canDisplayFullArchiveMap(map) && map?.license?.exportAllowed === true;

export const getArchiveMapRightsNotice = (map, language = "ru") => {
  const status = map?.license?.status || "unknown";
  const notices = {
    ru: {
      allowed: "Материал разрешён для указанного образовательного использования. Атрибуция обязательна.",
      blocked: "Полноразмерный материал не показывается: права ограничены или не подтверждены.",
    },
    kk: {
      allowed: "Материал көрсетілген оқу мақсатында пайдалануға рұқсат етілген. Атрибуция міндетті.",
      blocked: "Толық өлшемді материал көрсетілмейді: құқықтар шектеулі немесе расталмаған.",
    },
    en: {
      allowed: "The material is permitted for the stated educational use. Attribution is required.",
      blocked: "The full-resolution material is not displayed because rights are restricted or unconfirmed.",
    },
  };
  const text = notices[language] || notices.ru;
  return FULL_DISPLAY_LICENSES.has(status) ? text.allowed : text.blocked;
};
