import fs from "node:fs/promises";
import path from "node:path";
import { scienceDatasets, localizedName } from "./science-data.mjs";
import { getScientificReadiness } from "../../src/features/exhibition/scientificReadiness.js";
import { escapeHtml, reportDocument } from "./report-utils.mjs";
import { isDirectRun } from "./validation-utils.mjs";

export const HISTORIAN_REPORT = path.resolve(
  "review-packages/Qazaq_Heritage_Historian_Report.html"
);

const rows = (records) =>
  records
    .map(
      (record) =>
        `<tr id="${escapeHtml(record.id)}"><td><code>${escapeHtml(record.id)}</code></td><td>${escapeHtml(localizedName(record))}</td><td>${escapeHtml(record.validFromYear ?? record.startYear ?? "")}–${escapeHtml(record.validToYear ?? record.endYear ?? "")}</td><td>${escapeHtml(record.verificationStatus || "missing")}</td><td>${escapeHtml(getScientificReadiness(record))}</td><td>${escapeHtml((record.sourceIds || []).join(", "))}</td></tr>`
    )
    .join("");

export const buildHistorianReport = async (output = HISTORIAN_REPORT) => {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const body = `
<h1>Qazaq Heritage Map — отчёт для историка</h1>
<p>Автономный review-отчёт P2A.7. Он не содержит внешних CDN, секретов или пользовательских данных.</p>
<h2>Методология и временная модель</h2>
<p>Записи выбираются только внутри validFromYear/validToYear. Интерполяция гидрологии отключена. Автоматические GIS-сравнения являются образовательной визуализацией, а не историческим доказательством.</p>
<p class="warning">Все needs_review, demo_only, disputed, generalized и coarse записи требуют явного решения рецензента. Существующие статусы не повышались автоматически.</p>
<h2>Государства</h2><table><tr><th>ID</th><th>Название</th><th>Период</th><th>Status</th><th>Readiness</th><th>Sources</th></tr>${rows(scienceDatasets.entities)}</table>
<h2>Ключевые переходы</h2><table><tr><th>ID</th><th>Название</th><th>Период</th><th>Status</th><th>Readiness</th><th>Sources</th></tr>${rows(scienceDatasets.historicalChanges)}</table>
<h2>Source claims</h2><table><tr><th>ID</th><th>Название</th><th>Период</th><th>Status</th><th>Readiness</th><th>Sources</th></tr>${rows(scienceDatasets.claims)}</table>
<h2>Гидрология</h2><table><tr><th>ID</th><th>Название</th><th>Период</th><th>Status</th><th>Readiness</th><th>Sources</th></tr>${rows([...scienceDatasets.hydrology,...scienceDatasets.rivers])}</table>
<h2>Маршруты и места</h2><table><tr><th>ID</th><th>Название</th><th>Период</th><th>Status</th><th>Readiness</th><th>Sources</th></tr>${rows([...scienceDatasets.routes,...scienceDatasets.places])}</table>
<h2>Вопросы рецензенту</h2><ol><li>Что представляет каждый территориальный контур: влияние, расселение, владение или административную границу?</li><li>Какие даты и historical name intervals требуют исправления?</li><li>Какие Aral/river/environment geometries допустимы только как учебные схемы?</li><li>Какие competing interpretations следует оформить отдельно?</li></ol>
<h2>Легенда</h2><p><code>exhibition_ready</code> — допустимо для выставки; <code>educational_reconstruction</code> — только с маркировкой; <code>scientific_review_required</code> — требуется проверка; <code>disputed</code> — альтернативные версии; <code>demo_only</code> — не факт; <code>unavailable</code> — не отображать.</p>`;
  await fs.writeFile(output, reportDocument("Qazaq Heritage — historian report", body), "utf8");
  console.log(`Historian report: ${output}`);
  return output;
};

if (isDirectRun(import.meta.url)) await buildHistorianReport();

