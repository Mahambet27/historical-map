const tr = (ru, kk, en) => ({ ru, kk, en });

export const evidenceStatusRegistry = {
  fact: { icon: "✓", pattern: "solid", label: tr("Факт по источнику", "Дереккөздегі факт", "Source-based fact") },
  archaeological: { icon: "◆", pattern: "dot", label: tr("Археологическое свидетельство", "Археологиялық айғақ", "Archaeological evidence") },
  reconstruction: { icon: "◇", pattern: "diagonal", label: tr("Историческая реконструкция", "Тарихи реконструкция", "Historical reconstruction") },
  interpretation: { icon: "≈", pattern: "wave", label: tr("Научная интерпретация", "Ғылыми түсіндіру", "Scholarly interpretation") },
  disputed: { icon: "⇄", pattern: "cross", label: tr("Спорная версия", "Даулы нұсқа", "Disputed interpretation") },
  needs_review: { icon: "!", pattern: "stripe", label: tr("Требуется проверка", "Тексеру қажет", "Review required") },
};

export const getEvidenceStatus = (claim) => {
  if (claim?.verificationStatus === "verified") return evidenceStatusRegistry.fact;
  if (claim?.evidenceType === "archaeological_evidence") return evidenceStatusRegistry.archaeological;
  if (claim?.verificationStatus === "disputed") return evidenceStatusRegistry.disputed;
  if (claim?.verificationStatus === "needs_review" || claim?.verificationStatus === "demo_only") {
    return evidenceStatusRegistry.needs_review;
  }
  if (claim?.evidenceType === "educational_reconstruction") return evidenceStatusRegistry.reconstruction;
  return evidenceStatusRegistry.interpretation;
};
