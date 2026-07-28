import { useState } from "react";
import { getAgentPrompts, runLocalHistoricalAgent } from "./historicalAgentService.js";

export default function HistoricalAgent({ language, text, onAction, onClose }) {
  const [message, setMessage] = useState(text.agentIntro);
  const prompts = getAgentPrompts();

  const choosePrompt = (id) => {
    const result = runLocalHistoricalAgent(id, language);
    setMessage(result.answer);
    result.actions.forEach(onAction);
  };

  return (
    <section className="ex-panel ex-agent" aria-label={text.agent}>
      <header className="ex-panel__header">
        <div><span className="ex-kicker">LOCAL · GROUNDED</span><h2>{text.agent}</h2></div>
        <button className="ex-icon-button" onClick={onClose} aria-label={text.close}>×</button>
      </header>
      <div className="ex-agent__answer" aria-live="polite"><span>Q</span><p>{message}</p></div>
      <div className="ex-agent__prompts">
        {prompts.map((prompt) => (
          <button key={prompt.id} onClick={() => choosePrompt(prompt.id)}>
            {prompt.label[language] || prompt.label.ru}
          </button>
        ))}
      </div>
      <p className="ex-agent__note">✓ {language === "en" ? "Answers use only the reviewed local pack." : language === "kk" ? "Жауаптар тек тексерілген жергілікті жинаққа сүйенеді." : "Ответы только из проверенного локального набора."}</p>
    </section>
  );
}
