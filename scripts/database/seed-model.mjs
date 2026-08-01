import { archiveMaps } from "../../src/data/exhibition/archiveMaps.js";
import { allHistoricalEntities } from "../../src/data/exhibition/entities.js";
import { entityGeometries } from "../../src/data/exhibition/entityGeometries.js";
import { environmentSnapshots } from "../../src/data/exhibition/environmentSnapshots.js";
import { historicalEvents } from "../../src/data/exhibition/events.js";
import { historicalPeople } from "../../src/data/exhibition/people.js";
import { exhibitionPlaces } from "../../src/data/exhibition/places.js";
import { historicalSettlements } from "../../src/data/exhibition/historicalSettlements.js";
import { historicalRoutes } from "../../src/data/exhibition/historicalRoutes.js";
import { hydrologySnapshots } from "../../src/data/exhibition/hydrologySnapshots.js";
import { routeSegments } from "../../src/data/exhibition/routeSegments.js";
import { sourceClaims } from "../../src/data/exhibition/sourceClaims.js";
import { historicalSources } from "../../src/data/exhibition/sources.js";
import { historicalStories, storyQuestions } from "../../src/data/exhibition/stories.js";
import {
  LOCAL_DATASET_VERSION,
  P2A_SCHEMA_VERSION,
} from "../../src/dataAccess/datasetVersion.js";
import { sortById } from "./seed-io.mjs";

const LANGUAGES = ["kk", "ru", "en"];
const DEFAULT_STATUS = "needs_review";
const DEFAULT_CONFIDENCE = "medium";

const sourceMetadata = (dataset, record, extra = {}) => ({
  datasetVersion: LOCAL_DATASET_VERSION,
  public: true,
  sourceDataset: `src/data/exhibition/${dataset}.js`,
  sourceId: record.id,
  ...extra,
});

const statusOf = (record) => record.verificationStatus || DEFAULT_STATUS;
const confidenceOf = (record) => record.confidenceLevel || DEFAULT_CONFIDENCE;
const sourceIdsOf = (record) =>
  Array.isArray(record.sourceIds) ? [...record.sourceIds] : [];
const geometryOf = (record) =>
  record.geojson?.geometry || record.geometry?.geometry || record.geometry || null;

const entityTypeOf = (entity) => {
  const mapping = {
    cultural_political_communities: "archaeological_culture",
    union_republic: "administrative_unit",
    republic: "state",
  };
  return mapping[entity.entityType] || entity.entityType || "polity";
};

const translatedValue = (value, language) =>
  value?.[language] || value?.ru || value?.kk || value?.en || "";

const mapEntities = () =>
  sortById(
    allHistoricalEntities.map((entity) => ({
      id: entity.id,
      entity_type: entityTypeOf(entity),
      default_name: translatedValue(entity.names, "ru") || entity.id,
      summary: entity.descriptions || {},
      valid_from_year: entity.startYear ?? null,
      valid_to_year: entity.endYear ?? null,
      confidence_level: confidenceOf(entity),
      verification_status: statusOf(entity),
      metadata: sourceMetadata("entities", entity, {
        originalEntityType: entity.entityType,
        capitals: entity.capitals || [],
        eventIds: entity.eventIds || [],
        neighbours: entity.neighbours || [],
        origins: entity.origins || null,
        people: entity.people || [],
        sourceIds: sourceIdsOf(entity),
        stages: entity.stages || [],
        statusWasMissing: !entity.verificationStatus,
      }),
    }))
  );

const mapNames = () =>
  sortById(
    allHistoricalEntities.flatMap((entity) =>
      LANGUAGES.filter((language) => translatedValue(entity.names, language)).map(
        (language) => ({
          id: `${entity.id}:name:${language}`,
          subject_type: "entity",
          subject_id: entity.id,
          language,
          name: translatedValue(entity.names, language),
          valid_from_year: entity.startYear ?? null,
          valid_to_year: entity.endYear ?? null,
          name_type: "historical",
          source_ids: sourceIdsOf(entity),
          verification_status: statusOf(entity),
        })
      )
    )
  );

const mapGeometries = () =>
  sortById(
    entityGeometries.map((geometry) => {
      const geojson = geometryOf(geometry);
      return {
        id: geometry.id,
        subject_type: "entity",
        subject_id: geometry.entityId,
        geometry_type: geojson?.type || "Polygon",
        geometry: geojson,
        valid_from_year: geometry.validFromYear ?? null,
        valid_to_year: geometry.validToYear ?? null,
        confidence_level: confidenceOf(geometry),
        verification_status: statusOf(geometry),
        reconstruction_method: geometry.geometryType || "reconstruction",
        source_ids: sourceIdsOf(geometry),
        metadata: sourceMetadata("entityGeometries", geometry, {
          originalGeometryType: geometry.geometryType,
        }),
      };
    })
  );

const mapEvents = () =>
  sortById(
    historicalEvents.map((event) => ({
      id: event.id,
      titles: event.titles || {},
      descriptions: event.descriptions || {},
      event_type: event.eventType,
      start_year: event.startYear ?? null,
      end_year: event.endYear ?? event.startYear ?? null,
      entity_ids: event.entityIds || [],
      person_ids: event.personIds || [],
      place_ids: event.placeIds || [],
      source_ids: sourceIdsOf(event),
      confidence_level: confidenceOf(event),
      verification_status: statusOf(event),
      metadata: sourceMetadata("events", event, {
        precision: event.precision || "unknown",
        statusWasMissing: !event.verificationStatus,
      }),
    }))
  );

const mapPeople = () =>
  sortById(
    historicalPeople.map((person) => ({
      id: person.id,
      names: person.names || {},
      descriptions: person.descriptions || {},
      birth_year: person.birthYear ?? null,
      death_year: person.deathYear ?? null,
      entity_ids: (person.entityRoles || []).map((role) => role.entityId).filter(Boolean),
      event_ids: person.eventIds || [],
      source_ids: sourceIdsOf(person),
      confidence_level: confidenceOf(person),
      verification_status: statusOf(person),
      metadata: sourceMetadata("people", person, {
        entityRoles: person.entityRoles || [],
        placeIds: person.placeIds || [],
        portraitUrl: person.portraitUrl || null,
        statusWasMissing: !person.verificationStatus,
      }),
    }))
  );

const mapPlaces = () => {
  const richIds = new Set(historicalSettlements.map((place) => place.id));
  const rich = historicalSettlements.map((place) => ({
    id: place.id,
    place_types: place.placeType || [],
    names: place.names || {},
    point: {
      type: "Point",
      coordinates: place.coordinates,
    },
    coordinate_precision: place.coordinatePrecision || "unknown",
    valid_from_year: place.validFromYear ?? null,
    valid_to_year: place.validToYear ?? null,
    entity_ids: place.entityIds || [],
    event_ids: place.eventIds || [],
    route_ids: place.routeIds || [],
    source_ids: sourceIdsOf(place),
    confidence_level: confidenceOf(place),
    verification_status: statusOf(place),
    metadata: sourceMetadata("historicalSettlements", place, {
      personIds: place.personIds || [],
    }),
  }));
  const simple = exhibitionPlaces
    .filter((place) => !richIds.has(place.id))
    .map((place) => ({
      id: place.id,
      place_types: ["historical_place"],
      names: place.names || {},
      point: {
        type: "Point",
        coordinates: place.coords,
      },
      coordinate_precision: "approximate",
      valid_from_year: null,
      valid_to_year: null,
      entity_ids: [],
      event_ids: [],
      route_ids: [],
      source_ids: [],
      confidence_level: "low",
      verification_status: DEFAULT_STATUS,
      metadata: sourceMetadata("places", place, {
        statusWasMissing: true,
      }),
    }));
  return sortById([...rich, ...simple]);
};

const mapSources = () =>
  sortById(
    historicalSources.map((source) => ({
      id: source.id,
      titles: {
        kk: source.title,
        ru: source.title,
        en: source.title,
      },
      author: source.author ?? null,
      institution: source.organization ?? null,
      publisher: source.organization ?? null,
      publication_year: source.publicationYear ?? null,
      source_type: source.sourceType,
      url: source.url || null,
      license_status:
        source.id === "qhm-p1c-educational-overlay"
          ? "permission_granted"
          : "unknown",
      verification_status: statusOf(source),
      metadata: sourceMetadata("sources", source, {
        citation: source.citation,
        doi: source.doi || null,
      }),
    }))
  );

const mapClaims = () =>
  sortById(
    sourceClaims.map((claim) => ({
      id: claim.id,
      subject_type: claim.subjectType,
      subject_id: claim.subjectId,
      predicate: claim.predicate,
      value_type: claim.valueType,
      claim_value: claim.value,
      labels: claim.labels || {},
      evidence_type: claim.evidenceType,
      confidence_level: confidenceOf(claim),
      verification_status: statusOf(claim),
      interpretation_notes: claim.interpretationNotes || {},
      reviewed_by: claim.reviewedBy ?? null,
      reviewed_at: claim.reviewedAt ?? null,
      metadata: sourceMetadata("sourceClaims", claim),
    }))
  );

const mapClaimSources = () =>
  sourceClaims
    .flatMap((claim) =>
      sourceIdsOf(claim).map((sourceId) => ({
        claim_id: claim.id,
        source_id: sourceId,
        relation_type: "supports",
        notes: {},
      }))
    )
    .sort((left, right) =>
      `${left.claim_id}:${left.source_id}`.localeCompare(
        `${right.claim_id}:${right.source_id}`
      )
    );

const mapRoutes = () =>
  sortById(
    historicalRoutes.map((route) => ({
      id: route.id,
      route_type: route.routeType,
      names: route.names || {},
      descriptions: route.summaries || {},
      valid_from_year: route.validFromYear ?? null,
      valid_to_year: route.validToYear ?? null,
      confidence_level: confidenceOf(route),
      verification_status: statusOf(route),
      source_ids: sourceIdsOf(route),
      metadata: sourceMetadata("historicalRoutes", route, {
        culturalRoles: route.culturalRoles || [],
        entityIds: route.entityIds || [],
        eventIds: route.eventIds || [],
        goods: route.goods || [],
        interpolationAllowed: Boolean(route.interpolationAllowed),
        placeIds: route.placeIds || [],
        politicalRoles: route.politicalRoles || [],
        seasonCycle: route.seasonCycle || [],
        segmentIds: route.segmentIds || [],
      }),
    }))
  );

const mapRouteSegments = () =>
  sortById(
    routeSegments.map((segment) => ({
      id: segment.id,
      route_id: segment.routeId,
      segment_order: segment.order,
      from_place_id: segment.fromPlaceId ?? null,
      to_place_id: segment.toPlaceId ?? null,
      geometry: geometryOf(segment),
      valid_from_year: segment.validFromYear ?? null,
      valid_to_year: segment.validToYear ?? null,
      mode: segment.mode ?? null,
      season: segment.season ?? null,
      confidence_level: confidenceOf(segment),
      verification_status: statusOf(segment),
      source_ids: sourceIdsOf(segment),
      metadata: sourceMetadata("routeSegments", segment, {
        durationStatus: segment.durationStatus || "unknown",
        estimatedDurationDays: segment.estimatedDurationDays ?? null,
      }),
    }))
  );

const mapEnvironment = () =>
  sortById(
    environmentSnapshots.map((snapshot) => ({
      id: snapshot.id,
      environment_type: snapshot.environmentType,
      names: snapshot.names || {},
      descriptions: snapshot.descriptions || {},
      geometry: geometryOf(snapshot),
      valid_from_year: snapshot.validFromYear ?? null,
      valid_to_year: snapshot.validToYear ?? null,
      interpolation_allowed: Boolean(snapshot.interpolationAllowed),
      source_ids: sourceIdsOf(snapshot),
      confidence_level: confidenceOf(snapshot),
      verification_status: statusOf(snapshot),
      metadata: sourceMetadata("environmentSnapshots", snapshot, {
        screenReaderDescriptions: snapshot.screenReaderDescriptions || {},
      }),
    }))
  );

const mapHydrology = () =>
  sortById(
    hydrologySnapshots.map((snapshot) => ({
      id: snapshot.id,
      feature_id: snapshot.featureId,
      feature_type: snapshot.featureType,
      names: snapshot.names || {},
      geometry: geometryOf(snapshot),
      valid_from_year: snapshot.validFromYear ?? null,
      valid_to_year: snapshot.validToYear ?? null,
      interpolation_allowed: Boolean(snapshot.interpolationAllowed),
      source_ids: sourceIdsOf(snapshot),
      confidence_level: confidenceOf(snapshot),
      verification_status: statusOf(snapshot),
      metadata: sourceMetadata("hydrologySnapshots", snapshot),
    }))
  );

const mapArchiveMaps = () =>
  sortById(
    archiveMaps.map((map) => ({
      id: map.id,
      titles: map.titles || {},
      descriptions: map.descriptions || {},
      map_date: map.mapDate ?? null,
      map_date_precision: map.mapDatePrecision,
      source_id: map.sourceId || null,
      institution: map.institution || {},
      author: map.author ?? null,
      publisher: map.publisher ?? null,
      image_url: map.imageUrl || null,
      thumbnail_url: map.thumbnailUrl || null,
      georeference_type: map.georeferenceType,
      georeference_data: {
        bounds: map.bounds || null,
        coordinates: map.coordinates || null,
      },
      default_opacity: map.defaultOpacity ?? 0.65,
      license: map.license || { status: "unknown" },
      verification_status: statusOf(map),
      metadata: sourceMetadata("archiveMaps", map, {
        attribution: map.attribution || null,
        confidenceLevel: map.confidenceLevel || null,
        coveredArea: map.coveredArea || {},
        evidenceType: map.evidenceType || null,
        sourceIds: sourceIdsOf(map),
        validFromYear: map.validFromYear ?? null,
        validToYear: map.validToYear ?? null,
      }),
    }))
  );

const mapStories = () =>
  sortById(
    historicalStories.map((story) => ({
      id: story.id,
      titles: story.titles || {},
      descriptions: story.descriptions || {},
      target_audience: story.grade ? `grade-${story.grade}` : null,
      duration_minutes: story.durationMinutes ?? null,
      verification_status: statusOf(story),
      metadata: sourceMetadata("stories", story, {
        questionIds: story.questionIds || [],
      }),
    }))
  );

const mapStorySteps = () =>
  sortById(
    historicalStories.flatMap((story) =>
      (story.steps || []).map((step, index) => ({
        id: `${story.id}:${step.id}`,
        story_id: story.id,
        step_order: index,
        year: step.year ?? null,
        era_id: step.eraId ?? null,
        camera: step.camera || null,
        titles: step.titles || {},
        narration: step.narration || {},
        simple_narration: step.simpleNarration || {},
        source_ids: sourceIdsOf(step),
        metadata: sourceMetadata("stories", step, {
          action: step.action || null,
          activeLayers: step.activeLayers || [],
          durationMs: step.durationMs ?? null,
          entityIds: step.entityIds || [],
          eventIds: step.eventIds || [],
          personIds: step.personIds || [],
          placeIds: step.placeIds || [],
          questionId: step.questionId || null,
          sourceClaims: step.sourceClaims || [],
          storyId: story.id,
        }),
      }))
    )
  );

const questionStoryId = (questionId) =>
  historicalStories.find((story) => story.questionIds?.includes(questionId))?.id ||
  null;

const mapQuestions = () =>
  sortById(
    storyQuestions.map((question) => ({
      id: question.id,
      story_id: questionStoryId(question.id),
      question_type: question.type,
      prompts: question.prompts || {},
      options: question.options || [],
      answer: { correctOptionId: question.correctOptionId ?? null },
      explanations: question.explanations || {},
      source_ids: sourceIdsOf(question),
      verification_status: statusOf(question),
      metadata: sourceMetadata("stories", question, {
        accessiblePrompts: question.accessiblePrompts || {},
        evidenceType: question.evidenceType || null,
        statusWasMissing: !question.verificationStatus,
      }),
    }))
  );

export const buildSeedData = () => {
  const tables = {
    p2a_dataset_metadata: [
      {
        id: "historical-dataset",
        dataset_version: LOCAL_DATASET_VERSION,
        generated_from: "src/data/exhibition",
        metadata: {
          public: true,
          schemaVersion: P2A_SCHEMA_VERSION,
        },
      },
    ],
    historical_entities: mapEntities(),
    historical_names: mapNames(),
    historical_geometries: mapGeometries(),
    historical_events: mapEvents(),
    historical_people: mapPeople(),
    historical_places: mapPlaces(),
    historical_sources: mapSources(),
    source_claims: mapClaims(),
    source_claim_sources: mapClaimSources(),
    historical_routes: mapRoutes(),
    route_segments: mapRouteSegments(),
    environment_snapshots: mapEnvironment(),
    hydrology_snapshots: mapHydrology(),
    archive_maps: mapArchiveMaps(),
    educational_stories: mapStories(),
    educational_story_steps: mapStorySteps(),
    educational_questions: mapQuestions(),
  };

  return {
    datasetVersion: LOCAL_DATASET_VERSION,
    schemaVersion: P2A_SCHEMA_VERSION,
    sourceRoot: "src/data/exhibition",
    tables,
    skippedDatasets: [
      {
        dataset: "entityLabels",
        count: 24,
        reason: "Derived presentation labels; server names are generated from entities.",
      },
      {
        dataset: "timeline",
        count: 6,
        reason: "Derived client navigation snapshots; snapshot RPC reads normalized records.",
      },
      {
        dataset: "eras",
        count: 5,
        reason: "Client navigation configuration remains local in P2A.",
      },
      {
        dataset: "historicalChanges",
        count: 3,
        reason: "P1A interpretation model remains local until a normalized change schema is reviewed.",
      },
      {
        dataset: "sourceDisputes",
        count: 1,
        reason: "Demo-only dispute structure is not imported as a real scholarly dispute.",
      },
      {
        dataset: "lessons",
        count: 1,
        reason: "Legacy lesson remains local; P2A imports the newer story/question model.",
      },
      {
        dataset: "threeDModels",
        count: 1,
        reason: "Binary/media metadata is outside the read-only historical data foundation.",
      },
    ],
  };
};

export const localInventory = {
  entities: allHistoricalEntities,
  geometries: entityGeometries,
  events: historicalEvents,
  people: historicalPeople,
  places: exhibitionPlaces,
  historicalSettlements,
  routes: historicalRoutes,
  routeSegments,
  environment: environmentSnapshots,
  hydrology: hydrologySnapshots,
  sources: historicalSources,
  claims: sourceClaims,
  archiveMaps,
  stories: historicalStories,
  questions: storyQuestions,
};
