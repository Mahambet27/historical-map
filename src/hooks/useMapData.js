import { useEffect, useState } from "react";

import { getPlaces } from "../services/placesService.js";

const emptyFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const emptyMapData = {
  settlements: emptyFeatureCollection,
  places: [],
  additionalEraPlaces: [],
  popularPlaces: [],
  historicalBorderContours: emptyFeatureCollection,
  historicalBorderLabels: emptyFeatureCollection,
  tarbagataiGeojson: emptyFeatureCollection,
  zaysanGeojson: emptyFeatureCollection,
  protectedAreaContours: emptyFeatureCollection,
};

export default function useMapData() {
  const [state, setState] = useState({
    data: emptyMapData,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let ignore = false;

    async function loadMapData() {
      try {
        const [
          settlementsModule,
          eraPlacesModule,
          bordersModule,
          popularPlacesModule,
          regionContoursModule,
          protectedAreasModule,
          places,
        ] = await Promise.all([
          import("../data/settlements.json"),
          import("../data/eraPlaces.js"),
          import("../data/historicalBorders.js"),
          import("../data/popularPlaces.js"),
          import("../data/regionContours.js"),
          import("../data/protectedAreas.js"),
          getPlaces(),
        ]);

        if (ignore) return;

        setState({
          data: {
            settlements: settlementsModule.default ?? emptyFeatureCollection,
            places: Array.isArray(places) ? places : [],
            additionalEraPlaces: eraPlacesModule.additionalEraPlaces ?? [],
            popularPlaces: popularPlacesModule.popularPlaces ?? [],
            historicalBorderContours:
              bordersModule.historicalBorderContours ?? emptyFeatureCollection,
            historicalBorderLabels:
              bordersModule.historicalBorderLabels ?? emptyFeatureCollection,
            tarbagataiGeojson:
              regionContoursModule.tarbagataiGeojson ?? emptyFeatureCollection,
            zaysanGeojson: regionContoursModule.zaysanGeojson ?? emptyFeatureCollection,
            protectedAreaContours:
              protectedAreasModule.protectedAreaContours ?? emptyFeatureCollection,
          },
          error: null,
          loading: false,
        });
      } catch (error) {
        console.error("Map data loading failed:", error);
        if (ignore) return;
        setState({
          data: emptyMapData,
          error,
          loading: false,
        });
      }
    }

    loadMapData();

    return () => {
      ignore = true;
    };
  }, []);

  return state;
}
