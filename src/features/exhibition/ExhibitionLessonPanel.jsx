import { useState } from "react";
import { lessons } from "../../data/exhibition/lessons.js";
import { educationText } from "../../i18n/educationText.js";

export default function ExhibitionLessonPanel({ language, text, onClose, onState }) {
  const lesson = lessons[0];
  const copy = educationText[language] || educationText.ru;
  const [answers, setAnswers] = useState(() => lesson.questions.map(() => ""));
  const [checked, setChecked] = useState(false);
  const local = (value) => value[language] || value.ru;
  const completed = answers.filter((answer) => answer.trim().length >= 12).length;
  return (
    <section className="ex-panel ex-lesson-panel">
      <header className="ex-panel__header"><div><span className="ex-kicker">{text.grade}</span><h2>{local(lesson.title)}</h2></div><button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button></header>
      <div className="ex-lesson-objective"><span>{copy.objective}</span><p>{local(lesson.objective)}</p></div>
      <div className="ex-lesson-steps">
        {lesson.stateIds.map((id, index) => <button key={id} onClick={() => onState(id)}><span>{index + 1}</span>{index === 0 ? "1465" : index === 1 ? "1511" : "1991"}</button>)}
      </div>
      <h3>{copy.questions}</h3>
      <div className="ex-lesson-questions">
        {lesson.questions.map((question, index) => (
          <label key={local(question)}><span>{index + 1}. {local(question)}</span><textarea value={answers[index]} onChange={(event) => setAnswers(answers.map((value, answerIndex) => answerIndex === index ? event.target.value : value))} rows="2" /></label>
        ))}
      </div>
      <div className="ex-lesson-assignment"><strong>{copy.assignment}</strong><p>{local(lesson.assignment)}</p></div>
      <button className="ex-primary ex-lesson-check" onClick={() => setChecked(true)}>{copy.check}</button>
      {checked && <p className="ex-lesson-result" aria-live="polite">{copy.result}: {completed}/3 · {completed === 3 ? "✓" : language === "en" ? "Add a short reason to each answer." : language === "kk" ? "Әр жауапқа қысқа негіздеме қосыңыз." : "Добавьте краткое обоснование к каждому ответу."}</p>}
    </section>
  );
}
