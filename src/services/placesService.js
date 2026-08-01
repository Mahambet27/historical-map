import { getSupabaseClient } from "../lib/supabaseClient.js";

let staticPlacesPromise = null;

const loadStaticPlaces = async () => {
  if (!staticPlacesPromise) {
    staticPlacesPromise = import("../data/places.json")
      .then((module) => module.default ?? [])
      .catch(() => []);
  }

  return staticPlacesPromise;
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const chooseFirstText = (...values) => {
  for (const value of values) {
    const text = normalizeText(value);
    if (text) return text;
  }
  return "";
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const isValidLngLat = (lng, lat) =>
  Number.isFinite(lng) &&
  Number.isFinite(lat) &&
  Math.abs(lng) <= 180 &&
  Math.abs(lat) <= 90;

const logDev = (message, details) => {
  if (!import.meta.env.DEV) return;

  if (details === undefined) {
    console.info(message);
    return;
  }

  console.info(message, details);
};

const buildTranslationMap = (rows) => {
  const translations = {};

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const language = normalizeText(row?.language);
    if (!language) return;

    translations[language] = {
      name: chooseFirstText(row?.title),
      short: chooseFirstText(row?.short_description),
      full: chooseFirstText(row?.full_description),
    };
  });

  return translations;
};

const buildImages = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .slice()
    .sort((a, b) => toNumber(a?.sort_order) - toNumber(b?.sort_order))
    .map((row) => chooseFirstText(row?.public_url, row?.storage_path))
    .filter(Boolean);

const getSupabaseData = async (signal) => {
  const supabaseClient = await getSupabaseClient();
  if (!supabaseClient) {
    return null;
  }

  const requestSignal = signal || new AbortController().signal;
  let results;

  try {
    results = await Promise.all([
      supabaseClient
        .from("places")
        .select(
          "id, slug, status, region, district, place_type, era_id, latitude, longitude, short_notes, full_notes"
        )
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .abortSignal(requestSignal),
      supabaseClient
        .from("place_translations")
        .select("place_id, language, title, short_description, full_description")
        .abortSignal(requestSignal),
      supabaseClient
        .from("place_images")
        .select("place_id, public_url, storage_path, alt_text, caption, sort_order, is_primary")
        .abortSignal(requestSignal),
      supabaseClient.from("eras").select("id, sort_order").abortSignal(requestSignal),
    ]);
  } catch (error) {
    logDev("Using static places fallback", {
      reason: error?.message || "Supabase request failed",
    });
    return null;
  }

  const [placesResult, translationsResult, imagesResult, erasResult] = results;

  if (placesResult.error || translationsResult.error || imagesResult.error || erasResult.error) {
    logDev("Using static places fallback", {
      reason:
        placesResult.error?.message ||
        translationsResult.error?.message ||
        imagesResult.error?.message ||
        erasResult.error?.message,
    });
    return null;
  }

  const places = Array.isArray(placesResult.data) ? placesResult.data : [];
  const eras = Array.isArray(erasResult.data) ? erasResult.data : [];

  if (places.length === 0 || eras.length === 0) {
    logDev("Using static places fallback", {
      reason: places.length === 0 ? "No published Supabase places found" : "No Supabase eras found",
    });
    return null;
  }

  const translationGroups = new Map();
  (Array.isArray(translationsResult.data) ? translationsResult.data : []).forEach((row) => {
    const placeId = normalizeText(row?.place_id);
    if (!placeId) return;

    const current = translationGroups.get(placeId) || [];
    current.push(row);
    translationGroups.set(placeId, current);
  });

  const imageGroups = new Map();
  (Array.isArray(imagesResult.data) ? imagesResult.data : []).forEach((row) => {
    const placeId = normalizeText(row?.place_id);
    if (!placeId) return;

    const current = imageGroups.get(placeId) || [];
    current.push(row);
    imageGroups.set(placeId, current);
  });

  const eraOrderById = new Map(
    eras
      .map((row) => [normalizeText(row?.id), toNumber(row?.sort_order)])
      .filter(([id]) => Boolean(id))
  );

  const mappedPlaces = places
    .map((row) => {
      const placeId = normalizeText(row?.id);
      const translations = buildTranslationMap(translationGroups.get(placeId));
      const imageList = buildImages(imageGroups.get(placeId));
      const preferredTranslation = translations.kk || translations.ru || translations.en || {};
      const longitude = Number(row?.longitude);
      const latitude = Number(row?.latitude);

      if (!isValidLngLat(longitude, latitude)) {
        return null;
      }

      return {
        id: placeId,
        slug: normalizeText(row?.slug),
        name: chooseFirstText(preferredTranslation.name, row?.slug, row?.place_type),
        type: chooseFirstText(row?.place_type),
        coords: [longitude, latitude],
        era: eraOrderById.get(normalizeText(row?.era_id)) ?? 0,
        shortDescription: chooseFirstText(
          preferredTranslation.short,
          row?.short_notes,
          row?.full_notes
        ),
        fullDescription: chooseFirstText(preferredTranslation.full, row?.full_notes),
        images: imageList,
        translations,
        region: normalizeText(row?.region),
        district: normalizeText(row?.district),
        status: normalizeText(row?.status),
        model3d: null,
      };
    })
    .filter(Boolean);

  if (mappedPlaces.length === 0) {
    logDev("Using static places fallback", {
      reason: "Supabase places had invalid coordinates or unsupported shape",
    });
    return null;
  }

  return mappedPlaces;
};

export async function getPlaces({ signal } = {}) {
  const supabasePlaces = await getSupabaseData(signal);
  if (Array.isArray(supabasePlaces) && supabasePlaces.length > 0) {
    logDev("Loaded places from Supabase", { count: supabasePlaces.length });
    return supabasePlaces;
  }

  logDev("Using static places fallback");
  return loadStaticPlaces();
}
