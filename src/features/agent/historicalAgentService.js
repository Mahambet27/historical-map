import { exhibitionAnswerPack } from "./exhibitionAnswerPack.js";

export const getAgentPrompts = () => exhibitionAnswerPack;

export const runLocalHistoricalAgent = (promptId, language = "ru") => {
  const item = exhibitionAnswerPack.find((answer) => answer.id === promptId);
  if (!item) {
    return {
      answer:
        language === "en"
          ? "This question is outside the reviewed exhibition pack."
          : language === "kk"
            ? "Бұл сұрақ тексерілген көрме жинағына кірмейді."
            : "Этот вопрос не входит в проверенный выставочный набор.",
      actions: [],
      grounded: false,
    };
  }
  return { answer: item.answer[language] || item.answer.ru, actions: item.actions, grounded: true };
};
