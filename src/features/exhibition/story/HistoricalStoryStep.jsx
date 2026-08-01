import { getSourcesByIds } from "../../../services/historicalSourcesService.js";
import { getStoryQuestion } from "./historicalStoryModel.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function HistoricalStoryStep({
  step,
  language,
  simple,
  subtitles,
  sourceMode,
  answer,
  onAnswer,
  onToggleSources,
  onOpenEntity,
  onOpenComparison,
  onShowChange,
}) {
  const sources = getSourcesByIds(step.sourceIds);
  const question = getStoryQuestion(step.questionId);
  const questionSources = getSourcesByIds(question?.sourceIds || []);
  const narration = simple ? step.simpleNarration : step.narration;
  return (
    <article className="ex-historical-story__step">
      <div className="ex-historical-story__narration" aria-live="polite">
        <h2>{local(step.titles, language)}</h2>
        {subtitles && <p>{local(narration, language)}</p>}
      </div>
      <div className="ex-historical-story__links">
        {step.entityIds.length > 0 && (
          <button onClick={() => onOpenEntity?.(step.entityIds[0])}>
            ◇ {language === "en" ? "Open object" : language === "kk" ? "Нысанды ашу" : "Открыть объект"}
          </button>
        )}
        {step.action?.type === "comparison" && (
          <button onClick={() => onOpenComparison?.(step.action)}>
            ⇄ {language === "en" ? "Open comparison" : language === "kk" ? "Салыстыруды ашу" : "Открыть сравнение"}
          </button>
        )}
        {step.action?.type === "change" && (
          <button onClick={() => onShowChange?.(step.action.changeId)}>
            ? {language === "en" ? "Show explanation" : language === "kk" ? "Түсіндірмені көрсету" : "Показать объяснение"}
          </button>
        )}
        <button onClick={onToggleSources}>
          ▤ {language === "en" ? "Sources for this step" : language === "kk" ? "Осы қадамның дереккөздері" : "Источники этого шага"} · {sources.length}
        </button>
      </div>

      {sourceMode && (
        <div className="ex-historical-story__sources">
          {sources.map((source) => {
            const claim = step.sourceClaims?.find((item) => item.sourceId === source.id);
            return (
              <article key={source.id}>
                <strong>{source.title}</strong>
                <span>{source.author || source.organization}</span>
                <small>{source.sourceType} · {source.publicationYear || "—"} · {source.verificationStatus}</small>
                {claim && <p>{local(claim.claimsSupported, language)}</p>}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${language === "en" ? "Open source" : language === "kk" ? "Дереккөзді ашу" : "Открыть источник"}: ${source.title}`}
                >
                  ↗
                </a>
              </article>
            );
          })}
        </div>
      )}

      {question && (
        <fieldset
          className="ex-historical-story__question"
          aria-label={local(
            question.accessiblePrompts || question.prompts,
            language
          )}
        >
          <legend>{local(question.prompts, language)}</legend>
          {question.options.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className={answer?.optionId === entry.id ? "is-selected" : ""}
              onClick={() => onAnswer(question, entry.id)}
              disabled={Boolean(answer)}
            >
              {local(entry.label, language)}
            </button>
          ))}
          {answer && (
            <p className={answer.correct ? "is-correct" : "is-incorrect"} aria-live="polite">
              <strong>
                {answer.correct
                  ? language === "en" ? "Correct" : language === "kk" ? "Дұрыс" : "Верно"
                  : language === "en" ? "Review the explanation" : language === "kk" ? "Түсіндірмені қараңыз" : "Посмотрите объяснение"}
              </strong>
              {local(question.explanations, language)}
              <span className="ex-historical-story__answer-sources">
                {questionSources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title} ↗
                  </a>
                ))}
              </span>
            </p>
          )}
        </fieldset>
      )}
    </article>
  );
}
