import { useEffect, useMemo, useState } from "react";

const chatText = {
  kk: {
    starters: [
      "Ашық дереккөзден факт",
      "Бұл жер неге маңызды?",
      "Турист не көре алады?",
      "Картадағы ұқсас нысандар",
      "Шағын викторина",
    ],
    button: "Чат-гид",
    title: "Тарихи карта бойынша сұрақтар",
    subtitle: "Чат-гид және ашық фактілер",
    context: "Контекст",
    facts: "Қызықты фактілер",
    lastSource: "Соңғы дереккөз",
    openWiki: "Wikipedia ашу",
    loading: "Ақпарат ізделуде...",
    placeholder: "Орын, дәуір, маршрут немесе дереккөз туралы сұраңыз...",
    greeting:
      "Сәлем! Мен картадағы чат-гидпін. Нысанды таңдасаңыз, факт, координат, маршрут, дәуір және ашық дереккөздер бойынша көмектесемін.",
    noObjects: "Бұл дәуірде көрінетін нысандар жоқ.",
    objectsPrefix: "Картада қазір бар",
    chooseObject: "Нақтырақ жауап үшін картадан нысанды таңдаңыз.",
    coordsMissing: "Бұл нысан үшін координат көрсетілмеген.",
    route:
      "Маршрут құру үшін нысан карточкасындағы GPS маршрут батырмасын басыңыз. Браузер геолокацияға рұқсат сұрайды.",
    era: "Дәуірді төмендегі сырғытпамен ауыстыруға болады.",
    sourcePrefix: "Ашық дереккөз",
    sourceLabel: "Дереккөз",
    sourceFallback:
      "Сыртқы дереккөз жүктелмеді, сондықтан картадағы кіріктірілген фактілер бойынша жауап беріп тұрмын.",
  },
  ru: {
    starters: [
      "Факт из открытых источников",
      "Почему это место важно?",
      "Что посмотреть туристу?",
      "Похожие объекты на карте",
      "Мини-викторина",
    ],
    button: "Чат-гид",
    title: "Вопросы по исторической карте",
    subtitle: "Чат-гид и открытые факты",
    context: "Контекст",
    facts: "Интересные факты",
    lastSource: "Последний источник",
    openWiki: "Открыть Wikipedia",
    loading: "Ищу информацию...",
    placeholder: "Спросите про место, эпоху, маршрут или источник...",
    greeting:
      "Привет! Я чат-гид карты. Могу отвечать по данным проекта и пробовать брать справку из открытой Wikipedia API без ключей.",
    noObjects: "Пока на этой эпохе нет видимых объектов.",
    objectsPrefix: "На карте сейчас есть",
    chooseObject: "Выбери объект на карте, и я отвечу точнее.",
    coordsMissing: "Для этого объекта координаты не указаны.",
    route:
      "Чтобы построить маршрут, нажми кнопку GPS маршрута в карточке объекта. Браузер попросит доступ к геолокации.",
    era: "Эпоху можно переключать нижним ползунком.",
    sourcePrefix: "Открытый источник",
    sourceLabel: "Источник",
    sourceFallback:
      "Не получилось загрузить внешний источник, поэтому отвечаю по встроенным фактам карты.",
  },
  en: {
    starters: [
      "Fact from open sources",
      "Why is this place important?",
      "What can a tourist see?",
      "Similar map objects",
      "Mini quiz",
    ],
    button: "Chat guide",
    title: "Questions about the historical map",
    subtitle: "Chat guide and open facts",
    context: "Context",
    facts: "Interesting facts",
    lastSource: "Latest source",
    openWiki: "Open Wikipedia",
    loading: "Looking for information...",
    placeholder: "Ask about a place, era, route, or source...",
    greeting:
      "Hi! I am the map chat guide. Select an object and I can help with facts, coordinates, routes, eras, and open sources.",
    noObjects: "There are no visible objects for this era yet.",
    objectsPrefix: "Visible on the map now",
    chooseObject: "Select an object on the map for a more precise answer.",
    coordsMissing: "Coordinates are not specified for this object.",
    route:
      "To build a route, press the GPS route button in the object card. The browser will ask for geolocation permission.",
    era: "You can switch the era with the slider at the bottom.",
    sourcePrefix: "Open source",
    sourceLabel: "Source",
    sourceFallback:
      "The external source could not be loaded, so I am answering from the built-in map facts.",
  },
};

const openSourceFacts = [
  {
    title: "Петроглифы",
    text:
      "Петроглифы - это изображения, выбитые или процарапанные на камне. Обычно они помогают понять, какие животные, обряды и символы были важны для древних людей.",
    tags: ["петроглиф", "манырак", "тас", "сурет", "rock"],
    source: "Wikipedia: Petroglyph",
    url: "https://ru.wikipedia.org/wiki/Петроглиф",
  },
  {
    title: "Курганы",
    text:
      "Курганы часто были не просто могилами, а знаками статуса. По устройству насыпи и находкам археологи восстанавливают социальную структуру древних обществ.",
    tags: ["курган", "сақ", "сак", "оба", "шилик", "алтын"],
    source: "Wikipedia: Kurgan",
    url: "https://ru.wikipedia.org/wiki/Курган",
  },
  {
    title: "Саки",
    text:
      "Саки были ираноязычными кочевыми племенами раннего железного века. Их культура известна богатым звериным стилем и сложными погребальными памятниками.",
    tags: ["сак", "сақ", "алтын", "шилик", "берел"],
    source: "Wikipedia: Saka",
    url: "https://ru.wikipedia.org/wiki/Саки",
  },
  {
    title: "Тарбагатай",
    text:
      "Тарбагатай - горная система на востоке Казахстана и у границы с Китаем. Такие хребты часто были природными ориентирами, границами пастбищ и путями сезонных переходов.",
    tags: ["тарбагатай", "тау", "гора"],
    source: "Wikipedia: Tarbagatai Mountains",
    url: "https://ru.wikipedia.org/wiki/Тарбагатай",
  },
  {
    title: "Зайсан",
    text:
      "Озеро Зайсан связано с бассейном Иртыша и издавна было важной природной точкой региона: вода, рыба, дороги и поселения часто концентрировались вокруг таких озёр.",
    tags: ["зайсан", "көл", "озеро"],
    source: "Wikipedia: Lake Zaysan",
    url: "https://ru.wikipedia.org/wiki/Зайсан_(озеро)",
  },
  {
    title: "Берел",
    text:
      "Берельские курганы известны хорошо сохранившимися находками ранних кочевников Алтая. Они показывают высокий уровень ремесла и значение коня в погребальном обряде.",
    tags: ["берел", "алтай", "курган", "сақ", "сак"],
    source: "Wikipedia: Berel",
    url: "https://ru.wikipedia.org/wiki/Берельские_курганы",
  },
  {
    title: "Звериный стиль",
    text:
      "Для степных культур раннего железного века характерен звериный стиль: изображения оленей, хищников, грифонов и других животных на украшениях, оружии и конской упряжи.",
    tags: ["сак", "сақ", "алтын", "золото", "шилик", "берел"],
    source: "Wikipedia: Animal style",
    url: "https://ru.wikipedia.org/wiki/Звериный_стиль",
  },
  {
    title: "Шёлковые и степные пути",
    text:
      "Горные проходы, речные долины и озёра Восточного Казахстана могли быть частью локальных путей обмена: по ним двигались люди, скот, металл, ткани и идеи.",
    tags: ["жол", "путь", "маршрут", "тау", "тарбагатай", "зайсан"],
    source: "Wikipedia: Silk Road",
    url: "https://ru.wikipedia.org/wiki/Великий_шёлковый_путь",
  },
  {
    title: "Древняя металлургия",
    text:
      "Медь, бронза и железо меняли жизнь степи: появлялись новые орудия, оружие, украшения и торговые связи. Поэтому памятники бронзового и раннего железного века особенно ценны.",
    tags: ["қола", "бронза", "темір", "железо", "бұғытас"],
    source: "Wikipedia: Bronze Age",
    url: "https://ru.wikipedia.org/wiki/Бронзовый_век",
  },
  {
    title: "Святилища в ландшафте",
    text:
      "Древние памятники часто ставили не случайно: выбирали заметные склоны, долины, береговые линии и места с хорошим обзором. Карта помогает увидеть эту связь.",
    tags: ["петроглиф", "бұғытас", "тау", "гора", "объект"],
    source: "Open archaeological context",
    url: "https://ru.wikipedia.org/wiki/Археологический_памятник",
  },
];

const panelStyle = {
  position: "absolute",
  inset: 0,
  zIndex: 70,
  background: "rgba(0,0,0,0.38)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  fontFamily: "system-ui, Arial",
};

const modalStyle = {
  width: 860,
  maxWidth: "calc(100vw - 36px)",
  height: 620,
  maxHeight: "calc(100vh - 36px)",
  background: "rgba(255,255,255,0.98)",
  borderRadius: 14,
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
};

const buttonStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  background: "#fff",
  color: "#111",
  cursor: "pointer",
  fontWeight: 800,
};

const normalize = (value) => String(value || "").toLowerCase();

const cleanText = (value, max = 520) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getPlaceName = (place) => cleanText(place?.name, 120) || "это место";

const getPlaceSummary = (place) => {
  return (
    cleanText(place?.short || place?.shortDescription, 560) ||
    cleanText(place?.full || place?.fullDescription, 560)
  );
};

const getCoords = (place) => {
  if (!Array.isArray(place?.coords) || place.coords.length < 2) return "";
  return `${Number(place.coords[1]).toFixed(5)}, ${Number(place.coords[0]).toFixed(5)}`;
};

const getSourceFacts = (selectedPlace, visiblePlaces) => {
  const text = normalize(
    [
      selectedPlace?.name,
      selectedPlace?.type,
      selectedPlace?.short,
      selectedPlace?.shortDescription,
      selectedPlace?.full,
      selectedPlace?.fullDescription,
    ].join(" ")
  );

  const matched = openSourceFacts.filter((fact) =>
    fact.tags.some((tag) => text.includes(normalize(tag)))
  );

  if (matched.length > 0) return matched.slice(0, 5);

  const visibleText = normalize(
    (Array.isArray(visiblePlaces) ? visiblePlaces : [])
      .map((place) => `${place?.name || ""} ${place?.shortDescription || ""}`)
      .join(" ")
  );

  const visibleMatched = openSourceFacts.filter((fact) =>
    fact.tags.some((tag) => visibleText.includes(normalize(tag)))
  );

  return (visibleMatched.length > 0 ? visibleMatched : openSourceFacts).slice(0, 6);
};

const buildPlacesList = (places, text) => {
  const names = (Array.isArray(places) ? places : [])
    .map((place) => cleanText(place?.name, 80))
    .filter(Boolean)
    .slice(0, 8);

  if (names.length === 0) return text.noObjects;
  return `${text.objectsPrefix}: ${names.join(", ")}.`;
};

const buildQuiz = (selectedPlace, facts, language) => {
  const name = getPlaceName(selectedPlace);
  const fact = facts[0];

  if (language === "en") {
    if (selectedPlace?.name && fact) {
      return [
        `Mini quiz for "${name}":`,
        "",
        "1. Is this place connected more with nature, archaeology, or military history?",
        "2. Which landscape element helps explain its value: mountain, water, road, or open view?",
        `3. ${fact.title}: why is this fact useful for understanding the object?`,
        "",
        "Try answering, then compare your ideas with the object card and the facts panel.",
      ].join("\n");
    }

    return [
      "Mini quiz for the map:",
      "",
      "1. How is a petroglyph different from an ordinary drawing?",
      "2. Why were burial mounds often built in visible places?",
      "3. How could mountains and lakes shape ancient routes?",
      "",
      "Select an object on the map to make the quiz more specific.",
    ].join("\n");
  }

  if (language === "kk") {
    if (selectedPlace?.name && fact) {
      return [
        `"${name}" нысаны бойынша шағын викторина:`,
        "",
        "1. Бұл нысан табиғатпен, археологиямен немесе әскери тарихпен көбірек байланысты ма?",
        "2. Оның маңызын қандай ландшафт элементі түсіндіреді: тау, су, жол немесе ашық көрініс?",
        `3. ${fact.title}: бұл факт нысанды түсінуге қалай көмектеседі?`,
        "",
        "Жауап беріп көріңіз, кейін карточкадағы сипаттамамен және сол жақтағы фактілермен салыстырыңыз.",
      ].join("\n");
    }

    return [
      "Карта бойынша шағын викторина:",
      "",
      "1. Петроглиф жай суреттен несімен ерекшеленеді?",
      "2. Қорғандарды неге көбіне көзге түсетін жерлерге салған?",
      "3. Тау мен көлдер ежелгі маршруттарға қалай әсер етуі мүмкін?",
      "",
      "Нысанды таңдасаңыз, викторина нақтырақ болады.",
    ].join("\n");
  }

  if (selectedPlace?.name && fact) {
    return [
      `Мини-викторина по объекту "${name}":`,
      "",
      `1. С чем может быть связан этот объект: с природой, археологией или военной историей?`,
      `2. Какой элемент местности помогает понять его значение: гора, вода, дорога или открытый обзор?`,
      `3. ${fact.title}: почему этот факт важен для понимания объекта?`,
      "",
      "Попробуй ответить, а потом сравни с описанием в карточке и фактами слева.",
    ].join("\n");
  }

  return [
    "Мини-викторина по карте:",
    "",
    "1. Чем петроглиф отличается от обычного рисунка?",
    "2. Почему курганы часто строили на заметных местах?",
    "3. Как горы и озёра могли влиять на маршруты древних людей?",
    "",
    "Выбери объект на карте, и викторина станет точнее.",
  ].join("\n");
};

const getWikipediaSearchTerms = (selectedPlace, question) => {
  const terms = [
    selectedPlace?.name,
    selectedPlace?.short,
    selectedPlace?.shortDescription,
    question,
  ]
    .map((item) => cleanText(item, 90))
    .filter(Boolean);

  return terms.length > 0 ? terms : ["история Восточного Казахстана"];
};

const fetchWikipediaSummary = async (selectedPlace, question) => {
  const terms = getWikipediaSearchTerms(selectedPlace, question);

  for (const rawTerm of terms) {
    const term = rawTerm
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!term) continue;

    const searchUrl =
      "https://ru.wikipedia.org/w/api.php?action=opensearch" +
      `&search=${encodeURIComponent(term)}` +
      "&limit=1&namespace=0&format=json&origin=*";

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) continue;

    const searchData = await searchResponse.json();
    const title = searchData?.[1]?.[0];
    if (!title) continue;

    const summaryUrl = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) continue;

    const summaryData = await summaryResponse.json();
    const extract = cleanText(summaryData?.extract, 720);
    const pageUrl = summaryData?.content_urls?.desktop?.page;

    if (extract && pageUrl) {
      return {
        title: summaryData?.title || title,
        extract,
        url: pageUrl,
      };
    }
  }

  return null;
};

const buildLocalAnswer = ({ question, selectedPlace, visiblePlaces, facts, text, language }) => {
  const q = normalize(question);
  const hasPlace = Boolean(selectedPlace?.name);
  const name = getPlaceName(selectedPlace);
  const summary = getPlaceSummary(selectedPlace);
  const coords = getCoords(selectedPlace);
  const firstFact = facts[0];

  if (q.includes("привет") || q.includes("салам") || q.includes("hello") || q.includes("hi")) {
    return text.greeting;
  }

  if (q.includes("виктор") || q.includes("тест") || q.includes("quiz")) {
    return buildQuiz(selectedPlace, facts, language);
  }

  if (q.includes("координат") || q.includes("где") || q.includes("адрес") || q.includes("where") || q.includes("coord")) {
    if (!hasPlace) return text.chooseObject;
    return coords
      ? `${name}: ${coords}.`
      : text.coordsMissing;
  }

  if (q.includes("маршрут") || q.includes("доехать") || q.includes("дорог") || q.includes("route") || q.includes("road")) {
    if (!hasPlace) return text.chooseObject;
    return text.route;
  }

  if (q.includes("похож") || q.includes("список") || q.includes("мест") || q.includes("объект") || q.includes("similar") || q.includes("list") || q.includes("object")) {
    return buildPlacesList(visiblePlaces, text);
  }

  if (q.includes("эпох") || q.includes("кезең") || q.includes("era")) {
    return text.era;
  }

  if (q.includes("турист") || q.includes("посмотреть") || q.includes("бару") || q.includes("көру") || q.includes("tourist") || q.includes("see")) {
    if (!hasPlace) return `${buildPlacesList(visiblePlaces, text)} ${text.chooseObject}`;
    return summary
      ? `${name}: ${summary}`
      : text.chooseObject;
  }

  if (q.includes("важн") || q.includes("истор") || q.includes("неге") || q.includes("маңыз") || q.includes("important") || q.includes("history")) {
    if (!hasPlace) return `${buildPlacesList(visiblePlaces, text)} ${text.chooseObject}`;
    return summary
      ? `${name}: ${summary}`
      : text.chooseObject;
  }

  if (firstFact) {
    return `${firstFact.title}: ${firstFact.text}`;
  }

  if (!hasPlace) {
    return `${buildPlacesList(visiblePlaces, text)} ${text.chooseObject}`;
  }

  return summary
    ? `${name}: ${summary}`
    : text.chooseObject;
};

export default function AiAssistant({
  selectedPlace,
  visiblePlaces,
  language = "kk",
  initialOpen = false,
}) {
  const text = chatText[language] || chatText.kk;
  const [open, setOpen] = useState(initialOpen);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceResult, setSourceResult] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: text.greeting,
    },
  ]);

  useEffect(() => {
    setMessages((items) => {
      if (items.length !== 1 || items[0].role !== "assistant") return items;
      return [{ role: "assistant", text: text.greeting }];
    });
  }, [text.greeting]);

  const contextLabel = useMemo(() => {
    if (selectedPlace?.name) return selectedPlace.name;
    if (language === "en") return "general map";
    if (language === "kk") return "жалпы карта";
    return "общая карта";
  }, [selectedPlace, language]);

  const facts = useMemo(
    () => getSourceFacts(selectedPlace, visiblePlaces),
    [selectedPlace, visiblePlaces]
  );

  const ask = async (text, options = {}) => {
    const q = String(text || question).trim();
    if (!q || loading) return;

    setQuestion("");
    setLoading(true);
    setMessages((items) => [...items, { role: "user", text: q }]);

    try {
      const shouldUseSource =
        options.source ||
        normalize(q).includes("источник") ||
        normalize(q).includes("wikipedia") ||
        normalize(q).includes("факт");

      const wiki = shouldUseSource ? await fetchWikipediaSummary(selectedPlace, q) : null;
      if (wiki) setSourceResult(wiki);

      const localAnswer = buildLocalAnswer({
        question: q,
        selectedPlace,
        visiblePlaces,
        facts,
        text,
        language,
      });

      const answer = wiki
        ? `${text.sourcePrefix}: ${wiki.title}\n${wiki.extract}\n\n${text.sourceLabel}: ${wiki.url}`
        : localAnswer;

      setMessages((items) => [...items, { role: "assistant", text: answer }]);
    } catch {
      const answer = buildLocalAnswer({
        question: q,
        selectedPlace,
        visiblePlaces,
        facts,
        text,
        language,
      });

      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: `${answer}\n\n${text.sourceFallback}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={text.button}
        style={{
          position: "absolute",
          right: 18,
          bottom: 18,
          zIndex: 32,
          minWidth: 118,
          height: 48,
          border: "none",
          borderRadius: 10,
          background: "#111",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 900,
          fontSize: 15,
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
        }}
      >
        {text.button}
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      <section style={modalStyle} aria-label={text.button}>
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>{text.subtitle}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>
              {text.title}
            </div>
            <div style={{ fontSize: 13, opacity: 0.72, marginTop: 5 }}>
              {text.context}: {contextLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Закрыть"
            style={{
              ...buttonStyle,
              width: 38,
              height: 38,
              fontSize: 20,
              lineHeight: "34px",
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 1fr)",
          }}
        >
          <aside
            style={{
              borderRight: "1px solid rgba(0,0,0,0.08)",
              padding: 14,
              overflowY: "auto",
              background: "rgba(247,247,247,0.82)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>{text.facts}</div>

            {facts.map((fact) => (
              <article
                key={fact.title}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  padding: 10,
                  background: "#fff",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14 }}>{fact.title}</div>
                <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 5 }}>
                  {fact.text}
                </div>
                <a
                  href={fact.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 7,
                    fontSize: 12,
                    color: "#2457c5",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  {fact.source}
                </a>
              </article>
            ))}

            {sourceResult && (
              <article
                style={{
                  border: "1px solid rgba(36,87,197,0.25)",
                  borderRadius: 10,
                  padding: 10,
                  background: "#eef4ff",
                  marginTop: 12,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14 }}>{text.lastSource}</div>
                <div style={{ fontSize: 12, marginTop: 5 }}>{sourceResult.title}</div>
                <a
                  href={sourceResult.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 7,
                    fontSize: 12,
                    color: "#2457c5",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  {text.openWiki}
                </a>
              </article>
            )}
          </aside>

          <main
            style={{
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 14,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
                minHeight: 0,
              }}
            >
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "86%",
                      background: isUser ? "#111" : "#f3f4f6",
                      color: isUser ? "#fff" : "#111",
                      padding: "10px 12px",
                      borderRadius: 12,
                      fontSize: 14,
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message.text}
                  </div>
                );
              })}

              {loading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: "#f3f4f6",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 14,
                    opacity: 0.75,
                  }}
                >
                  {text.loading}
                </div>
              )}
            </div>
          </main>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
            {text.starters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  ask(item, {
                    source:
                      item.toLowerCase().includes("source") ||
                      item.toLowerCase().includes("дерек") ||
                      item.toLowerCase().includes("источник") ||
                      item.toLowerCase().includes("факт") ||
                      item.toLowerCase().includes("fact"),
                  })
                }
                disabled={loading}
                style={{
                  ...buttonStyle,
                  padding: "8px 10px",
                  fontSize: 13,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={text.placeholder}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "11px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                ...buttonStyle,
                padding: "0 16px",
                background: loading || !question.trim() ? "#f1f1f1" : "#111",
                color: loading || !question.trim() ? "#777" : "#fff",
                cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              }}
            >
              OK
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
