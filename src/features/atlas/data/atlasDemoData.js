// UI configuration only; historical records come from HistoricalSnapshot.
const tr = (ru, kk, en) => ({ ru, kk, en });
export const atlasLayers = [
  {
    id: "territories",
    name: tr("Исторические территории", "Тарихи аумақтар", "Historical territories"),
    on: true,
  },
  {
    id: "borders",
    name: tr("Исторические границы", "Тарихи шекаралар", "Historical borders"),
    on: true,
  },
  { id: "settlements", name: tr("Населённые пункты", "Елді мекендер", "Settlements"), on: true },
  {
    id: "trade",
    name: tr("Торговые пути", "Сауда жолдары", "Trade routes"),
    on: true,
  },
  { id: "events", name: tr("События и сражения", "Оқиғалар мен шайқастар", "Events and battles"), on: true },
  { id: "labels", name: tr("Подписи территорий", "Аумақ атаулары", "Territory labels"), on: true },
  {
    id: "modern",
    name: tr("Современные границы", "Қазіргі шекаралар", "Modern borders"),
    on: false,
    future: true,
  },
  { id: "terrain", name: tr("Рельеф", "Жер бедері", "Terrain"), on: false, future: true },
  { id: "models", name: tr("3D объекты", "3D нысандар", "3D objects"), on: false, future: true },
];

export const atlasKeyDates = [-1500, -550, 552, 1219, 1465, 1731, 1917, 1991, 2026];
export const atlasLocal = (value, language) =>
  typeof value === "string" ? value : value?.[language] || value?.ru || "";
export const atlasYear = (year, language) =>
  year < 0
    ? `${Math.abs(year)} ${language === "en" ? "BCE" : language === "kk" ? "б.з.д." : "до н. э."}`
    : String(year);
