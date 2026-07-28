const EMPTY_ROUTE = { coordinates: [], distance: 0, duration: 0 };

export async function fetchDrivingRoute({ from, to, token, signal, fetchImpl = fetch }) {
  const coordinates = `${from.join(",")};${to.join(",")}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);

  const response = await fetchImpl(url, { signal });
  if (!response.ok) throw new Error(`Directions request failed (${response.status})`);
  const route = (await response.json())?.routes?.[0];
  if (!route) return EMPTY_ROUTE;
  return {
    coordinates: route.geometry?.coordinates || [],
    distance: route.distance || 0,
    duration: route.duration || 0,
  };
}
