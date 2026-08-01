import { useMemo, useState } from "react";
import { recordExhibitionMetric } from "../performanceTelemetry.js";
import { mergeReviewState } from "./reviewQueueModel.js";
import {
  createLocalReviewRecord,
  exportReviewReport,
  saveLocalReviews,
  upsertLocalReview,
} from "./localReviewStore.js";

const local = (value, language) => value?.[language] || value?.ru || value || "";
const statuses = ["pending", "in_review", "approved", "rejected", "needs_more_sources"];

export default function ReviewQueuePanel({
  queue,
  initialReviews,
  language,
  text,
  onReviews,
  onClose,
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewerName, setReviewerName] = useState("");
  const [notes, setNotes] = useState({});
  const items = useMemo(() => mergeReviewState(queue, reviews), [queue, reviews]);
  const update = (item, status) => {
    const record = createLocalReviewRecord({
      itemType: item.itemType,
      itemId: item.itemId,
      status,
      note: notes[`${item.itemType}:${item.itemId}`] || "",
      reviewerName,
    });
    const next = upsertLocalReview(reviews, record);
    setReviews(next);
    saveLocalReviews(next);
    onReviews(next);
    recordExhibitionMetric("review_status_changed", 1, { itemType: item.itemType, status });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportReviewReport(reviews)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "review-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="ex-panel ex-review-panel" aria-labelledby="review-title">
      <header className="ex-panel__header">
        <div><span className="ex-kicker">P1C · LOCAL</span><h2 id="review-title">{language === "en" ? "Scientific review queue" : language === "kk" ? "Ғылыми тексеру кезегі" : "Очередь научной проверки"}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <p>{language === "en" ? "Local records do not alter the curated datasets." : language === "kk" ? "Жергілікті жазбалар іріктелген деректерді өзгертпейді." : "Локальные записи не изменяют исходные curated datasets."}</p>
      <label>{language === "en" ? "Optional reviewer name" : language === "kk" ? "Рецензент аты (міндетті емес)" : "Имя проверяющего (необязательно)"}<input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} /></label>
      <div className="ex-review-list">
        {items.map((item) => {
          const key = `${item.itemType}:${item.itemId}`;
          return (
            <article key={key}>
              <span>{item.itemType} · {item.reason}</span>
              <strong>{local(item.label, language)}</strong>
              <textarea value={notes[key] || item.localReview?.note || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} aria-label={`Review note ${item.itemId}`} />
              <select value={item.localReview?.status || "pending"} onChange={(event) => update(item, event.target.value)} aria-label={`Review status ${item.itemId}`}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </article>
          );
        })}
      </div>
      <button onClick={download}>⇩ review-report.json</button>
    </section>
  );
}
