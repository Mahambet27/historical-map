export const REVIEW_STORAGE_KEY = "qhm.exhibition.evidenceReviews.v1";

export const readLocalReviews = (storage = window.localStorage) => {
  try {
    const value = JSON.parse(storage?.getItem(REVIEW_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const saveLocalReviews = (reviews, storage = window.localStorage) => {
  try {
    storage?.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
};

export const createLocalReviewRecord = ({
  itemType,
  itemId,
  status,
  note = "",
  reviewerName = "",
  now = () => new Date().toISOString(),
}) => ({
  itemType,
  itemId,
  status,
  note,
  reviewerName,
  reviewedAt: now(),
});

export const upsertLocalReview = (reviews, record) => [
  ...reviews.filter(
    (review) => !(review.itemType === record.itemType && review.itemId === record.itemId)
  ),
  record,
];

export const exportReviewReport = (reviews) => JSON.stringify({
  schema: "qhm-local-review-report-v1",
  exportedAt: new Date().toISOString(),
  records: reviews.map(({ itemType, itemId, status, note, reviewerName, reviewedAt }) => ({
    itemType, itemId, status, note, reviewerName, reviewedAt,
  })),
}, null, 2);
