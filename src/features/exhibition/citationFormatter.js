const local = (value, language) =>
  typeof value === "string" ? value : value?.[language] || value?.ru || "";

export const CITATION_FORMATS = ["short", "gost", "apa", "plain", "json"];

export const formatCitation = (source, format = "short", language = "ru") => {
  if (!source) return "";
  const author = source.author || source.organization || "Unknown author";
  const year = source.publicationYear || "n.d.";
  const title = local(source.title, language);
  if (format === "json") {
    return JSON.stringify({
      id: source.id,
      author: source.author,
      organization: source.organization,
      title,
      year: source.publicationYear,
      url: source.url,
      verificationStatus: source.verificationStatus,
    }, null, 2);
  }
  if (format === "apa") return `${author}. (${year}). ${title}. ${source.organization || ""}. ${source.url || ""}`.trim();
  if (format === "gost") return `${author}. ${title} [Электронный ресурс]. — ${year}. — URL: ${source.url || "не указан"}.`;
  if (format === "plain") return source.citation || `${author}. ${title}. ${year}.`;
  return `${author}: ${title}${source.publicationYear ? ` (${source.publicationYear})` : ""}`;
};

export const copyCitation = async (source, format, language, clipboard = navigator.clipboard) => {
  const citation = formatCitation(source, format, language);
  await clipboard.writeText(citation);
  return citation;
};

export const exportClaimsWithSources = (
  subjectType,
  subjectId,
  claims = [],
  sources = []
) => {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  return claims
    .filter((claim) => claim.subjectType === subjectType && claim.subjectId === subjectId)
    .map((claim) => ({
      ...claim,
      sources: claim.sourceIds.map((id) => sourceById.get(id)).filter(Boolean),
    }));
};

export const CITATION_SAFETY_NOTICE = {
  ru: "Автоматически сформированная библиографическая запись. Перед научной публикацией рекомендуется проверить оформление.",
  kk: "Автоматты түрде жасалған библиографиялық жазба. Ғылыми жарияланым алдында рәсімделуін тексеру ұсынылады.",
  en: "Automatically generated bibliographic record. Check the formatting before scholarly publication.",
};
