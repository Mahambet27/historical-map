import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { recordExhibitionMetric } from "../performanceTelemetry.js";
import HistoricalStoryControls from "./HistoricalStoryControls.jsx";
import HistoricalStoryStep from "./HistoricalStoryStep.jsx";
import {
  createStorySession,
  getHistoricalStory,
  getStoryScore,
  getStoryStepDelay,
  historicalStoryReducer,
  scheduleStoryAdvance,
  shouldPauseStoryForVisibility,
} from "./historicalStoryModel.js";
import { filterOfficialStorySteps } from "../officialDemoMode.js";

const local = (value, language) => value?.[language] || value?.ru || "";

export default function HistoricalStoryPlayer({
  storyId,
  story: storyOverride,
  language,
  reducedMotion,
  onStepChange,
  onExit,
  onOpenEntity,
  onOpenSources,
  onOpenComparison,
  onShowChange,
  officialDemo = false,
}) {
  const baseStory = storyOverride || getHistoricalStory(storyId);
  const story = useMemo(
    () =>
      officialDemo && baseStory
        ? { ...baseStory, steps: filterOfficialStorySteps(baseStory) }
        : baseStory,
    [baseStory, officialDemo]
  );
  const [session, dispatch] = useReducer(
    historicalStoryReducer,
    undefined,
    createStorySession
  );
  const callbacksRef = useRef({ onStepChange, onExit });

  useEffect(() => {
    callbacksRef.current = { onStepChange, onExit };
  }, [onExit, onStepChange]);

  const step = story?.steps[session.index];
  const lastIndex = Math.max(0, (story?.steps.length || 1) - 1);
  const completeStory = useCallback(() => {
    dispatch({ type: "COMPLETE" });
    recordExhibitionMetric("story_completed", 1, { storyId });
    if (storyId === "silk-road-geography") {
      recordExhibitionMetric("geography_story_completed", 1, { storyId });
    }
    if (storyId === "historical-evidence") {
      recordExhibitionMetric("evidence_story_completed", 1, { storyId });
    }
  }, [dispatch, storyId]);

  useEffect(() => {
    if (!step) return;
    callbacksRef.current.onStepChange?.(step, session.index);
    recordExhibitionMetric("story_step_changed", session.index + 1, {
      storyId,
      stepId: step.id,
    });
  }, [session.index, step, storyId]);

  useEffect(() => {
    if (!session.playing || !step) return undefined;
    return scheduleStoryAdvance({
      delay: getStoryStepDelay(step, session.speed),
      callback: () => {
        if (session.index >= lastIndex) {
          completeStory();
        } else {
          dispatch({ type: "NEXT", lastIndex });
        }
      },
    });
  }, [
    completeStory,
    lastIndex,
    session.index,
    session.playing,
    session.speed,
    step,
  ]);

  useEffect(() => {
    const handleVisibility = () => {
      if (shouldPauseStoryForVisibility(document.hidden)) {
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (event.key === "ArrowLeft") dispatch({ type: "PREVIOUS" });
      if (event.key === "ArrowRight") {
        if (session.index >= lastIndex && !session.completed) completeStory();
        else dispatch({ type: "NEXT", lastIndex });
      }
      if (event.key === " ") {
        event.preventDefault();
        dispatch({ type: session.playing ? "PAUSE" : "PLAY" });
      }
      if (event.key === "Escape") callbacksRef.current.onExit?.();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [
    completeStory,
    lastIndex,
    session.completed,
    session.index,
    session.playing,
  ]);

  if (!story || !step) return null;
  const score = getStoryScore(story, session.answers);
  const answer = step.questionId ? session.answers[step.questionId] : null;

  const answerQuestion = (question, optionId) => {
    const correct = question.correctOptionId === optionId;
    dispatch({
      type: "ANSWER",
      questionId: question.id,
      optionId,
      correct,
    });
    recordExhibitionMetric("question_answered", correct ? 1 : 0, {
      storyId,
      questionId: question.id,
      correct,
    });
  };

  const exit = () => {
    recordExhibitionMetric("story_exited", 1, {
      storyId,
      stepId: step.id,
    });
    onExit?.();
  };

  return (
    <aside
      className={`ex-historical-story ${reducedMotion ? "is-reduced-motion" : ""}`}
      aria-label={local(story.titles, language)}
    >
      <header>
        <div>
          <span className="ex-kicker">
            {language === "en"
              ? `Grade ${story.grade} · ${story.durationMinutes} min`
              : language === "kk"
                ? `${story.grade} сынып · ${story.durationMinutes} мин`
                : `${story.grade} класс · ${story.durationMinutes} мин`}
          </span>
          <strong>{local(story.titles, language)}</strong>
        </div>
        <span>{session.index + 1}/{story.steps.length}</span>
      </header>
      <progress value={session.index + 1} max={story.steps.length} />

      <HistoricalStoryStep
        {...{
          step,
          language,
          answer,
          onOpenEntity,
          onOpenComparison,
          onShowChange,
        }}
        simple={session.simple}
        subtitles={session.subtitles}
        sourceMode={session.sourceMode}
        onAnswer={answerQuestion}
        onToggleSources={() => dispatch({ type: "TOGGLE_SOURCES" })}
        onOpenSources={() => onOpenSources?.(step.sourceIds)}
      />

      <div className="ex-historical-story__preferences">
        <button
          className={session.simple ? "is-active" : ""}
          onClick={() => dispatch({ type: "TOGGLE_SIMPLE" })}
          aria-pressed={session.simple}
        >
          {language === "en" ? "Simple text" : language === "kk" ? "Қарапайым мәтін" : "Простой текст"}
        </button>
        <button
          className={session.subtitles ? "is-active" : ""}
          onClick={() => dispatch({ type: "TOGGLE_SUBTITLES" })}
          aria-pressed={session.subtitles}
        >
          {language === "en" ? "Subtitles" : language === "kk" ? "Субтитрлер" : "Субтитры"}
        </button>
      </div>

      {session.completed && (
        <div className="ex-historical-story__result" role="status">
          <strong>
            {language === "en" ? "Story complete" : language === "kk" ? "Тарих аяқталды" : "История завершена"}
          </strong>
          <span>{score.correct}/{score.total}</span>
          <button onClick={() => dispatch({ type: "RETRY_QUESTIONS" })}>
            {language === "en" ? "Retry questions" : language === "kk" ? "Сұрақтарды қайталау" : "Повторить вопросы"}
          </button>
        </div>
      )}

      <HistoricalStoryControls
        {...{
          language,
          playing: session.playing,
          speed: session.speed,
        }}
        index={session.index}
        isLast={session.index === lastIndex}
        completed={session.completed}
        onPrevious={() => dispatch({ type: "PREVIOUS" })}
        onNext={() => {
          if (session.index === lastIndex) completeStory();
          else dispatch({ type: "NEXT", lastIndex });
        }}
        onTogglePlay={() => dispatch({ type: session.playing ? "PAUSE" : "PLAY" })}
        onReplay={() => {
          dispatch({ type: "REPLAY" });
          callbacksRef.current.onStepChange?.(step, session.index);
        }}
        onSpeed={(speed) => dispatch({ type: "SPEED", speed })}
        onExit={exit}
      />
      <div className="sr-only" aria-live="polite">
        {local(step.titles, language)}. {local(
          session.simple ? step.simpleNarration : step.narration,
          language
        )}
      </div>
    </aside>
  );
}
