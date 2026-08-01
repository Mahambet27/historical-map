import {
  historicalChangeById,
  historicalChanges,
} from "../../data/exhibition/historicalChanges.js";

const reverseDirection = {
  expanded: "contracted",
  contracted: "expanded",
  gained: "lost",
  lost: "gained",
  changed: "changed",
};

const withDisplayDirection = (change, reversed) => ({
  ...change,
  isReversed: reversed,
  displayFromYear: reversed ? change.toYear : change.fromYear,
  displayToYear: reversed ? change.fromYear : change.toYear,
  changes: change.changes.map((entry) => ({
    ...entry,
    displayDirection: reversed
      ? reverseDirection[entry.direction] || entry.direction
      : entry.direction,
  })),
});

export const getHistoricalChange = (fromYear, toYear) => {
  const exact = historicalChanges.find(
    (change) => change.fromYear === fromYear && change.toYear === toYear
  );
  if (exact) return withDisplayDirection(exact, false);

  const reverse = historicalChanges.find(
    (change) => change.fromYear === toYear && change.toYear === fromYear
  );
  return reverse ? withDisplayDirection(reverse, true) : null;
};

export const getAvailableComparisons = (year) =>
  historicalChanges
    .filter((change) => change.fromYear === year || change.toYear === year)
    .map((change) => ({
      id: change.id,
      fromYear: year,
      toYear: change.fromYear === year ? change.toYear : change.fromYear,
      reversed: change.toYear === year,
      verificationStatus: change.verificationStatus,
    }));

export const getChangeById = (changeId) =>
  historicalChangeById.get(changeId) || null;

export const getChangesForEntity = (entityId) =>
  historicalChanges.filter((change) => change.entityIds.includes(entityId));

export const getSignificantChangeBetweenYears = (fromYear, toYear) =>
  getHistoricalChange(fromYear, toYear);

export const shouldShowChangePrompt = ({
  fromYear,
  toYear,
  kioskAutoplay = false,
  alreadyShown = new Set(),
} = {}) => {
  const change = getSignificantChangeBetweenYears(fromYear, toYear);
  if (!change || fromYear === toYear || kioskAutoplay) return null;
  const signature = `${fromYear}:${toYear}:${change.id}`;
  return alreadyShown.has(signature) ? null : { change, signature };
};

