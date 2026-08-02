export const officialDemoScenario = Object.freeze({
  id: "official-kazakh-khanate-release-scenario",
  title: {
    ru: "Формирование и укрепление Казахского ханства",
    kk: "Қазақ хандығының құрылуы мен нығаюы",
    en: "Formation and consolidation of the Kazakh Khanate",
  },
  initialPreset: "clean",
  verificationStatus: "reviewed",
  sourceIds: ["e-history-kazakh-khanate", "cambridge-kazakh-history"],
  steps: [
    {
      id: "official-1465",
      year: 1465,
      entityIds: ["kazakh-khanate"],
      personIds: ["kerei-khan", "janibek-khan"],
      action: "show_reconstruction_status",
    },
    {
      id: "official-1511",
      year: 1511,
      entityIds: ["kazakh-khanate"],
      personIds: ["kasym-khan"],
      action: "educational_comparison",
      comparison: { firstYear: 1465, secondYear: 1511 },
    },
    {
      id: "official-sources",
      year: 1511,
      action: "open_sources",
      sourceIds: ["e-history-kasym", "cambridge-kazakh-history"],
    },
    {
      id: "official-modern",
      year: 1991,
      entityIds: ["republic-kazakhstan"],
      action: "show_historical_republic_without_modern_basemap_labels",
      sourceIds: ["adilet-independence-law"],
    },
  ],
});

