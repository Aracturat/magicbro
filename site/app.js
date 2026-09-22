const translations = {
  en: {
    download: "Download userscript",
    skip: "Skip to content",
    navHow: "How it works",
    navFeatures: "Features",
    navInstall: "Install",
    navStart: "Get started",
    heroEyebrow: "Visual feedback for Codex",
    heroTitle: "Point at the UI. Say what should change. Ship it.",
    heroLead:
      "MagicBro gives Codex the exact element, screenshot, page context, and your words — so visual feedback becomes a focused code change.",
    heroCta: "Install MagicBro",
    heroSecondary: "See how it works",
    noteLocal: "Local-first",
    noteSession: "One persistent ACP session",
    noteLicense: "MIT licensed",
    mockPrompt:
      "Make this chart easier to read and add the comparison with last week.",
    mockSend: "Send to Codex",
    mockStatus: "Codex is editing 2 files",
    signalOne: "Exact DOM context",
    signalTwo: "Area & point selection",
    signalThree: "Live progress",
    signalFour: "Cancel anytime",
    workflowEyebrow: "From “this bit” to a real diff",
    workflowTitle: "A feedback loop that speaks UI.",
    workflowLead:
      "No selector hunting. No screenshot archaeology. Just show MagicBro the thing you mean.",
    stepOneTitle: "Select",
    stepOneText: "Click an element or draw around an area on the running page.",
    stepTwoTitle: "Explain",
    stepTwoText:
      "Describe the result in your own words — as briefly or precisely as you like.",
    stepThreeTitle: "Ship",
    stepThreeText:
      "Codex finds the source, edits the right files, and streams progress back.",
    featuresEyebrow: "Context without the handoff tax",
    featuresTitle: "Built for the messy middle of frontend work.",
    featureContextTitle: "More than a screenshot.",
    featureContextText:
      "MagicBro captures DOM structure, text ranges, coordinates, viewport data, loaded assets, and the visual selection.",
    featureSessionTitle: "Keeps the conversation.",
    featureSessionText:
      "One persistent ACP session carries context across every follow-up.",
    featureControlTitle: "Visible and interruptible.",
    featureControlText:
      "Watch live activity, cancel a run, and choose the model and reasoning level.",
    featureLocalTitle: "Your project stays your project.",
    featureLocalText:
      "The CLI runs from your workspace. The userscript talks to localhost. Codex edits the directory you launched MagicBro from.",
    installEyebrow: "Two minutes to first feedback",
    installTitle: "Add the script. Start the CLI. Point.",
    installLead:
      "MagicBro needs Node.js 20+, an existing Codex login, and Tampermonkey or Violentmonkey.",
    installOneTitle: "Install the CLI",
    installOneText: "Install the package globally from npm.",
    installTwoTitle: "Add the userscript",
    installTwoText: "Paste the userscript into your browser extension.",
    installThreeTitle: "Run it in your project",
    installThreeText: "Launch MagicBro from the directory Codex should edit.",
    copy: "Copy",
    copied: "Copied",
    terminalCommentOne: "# Install once",
    terminalCommentTwo: "# Run inside any project",
    terminalReady: "Codex ACP session ready",
    closingEyebrow: "Stop describing where. Start describing what.",
    closingTitle: "Your UI already knows the context.",
    closingText: "Let MagicBro hand it to Codex.",
    closingCta: "Get started",
    footer: "Point. Explain. Ship.",
  },
  ru: {
    download: "Скачать userscript",
    skip: "Перейти к содержимому",
    navHow: "Как это работает",
    navFeatures: "Возможности",
    navInstall: "Установка",
    navStart: "Начать",
    heroEyebrow: "Визуальная обратная связь для Codex",
    heroTitle: "Покажи интерфейс. Скажи, что изменить. Готово.",
    heroLead:
      "MagicBro передаёт Codex точный элемент, скриншот, контекст страницы и ваши слова — чтобы визуальный комментарий стал точным изменением в коде.",
    heroCta: "Установить MagicBro",
    heroSecondary: "Как это работает",
    noteLocal: "Работает локально",
    noteSession: "Одна постоянная ACP-сессия",
    noteLicense: "Лицензия MIT",
    mockPrompt:
      "Сделай этот график понятнее и добавь сравнение с прошлой неделей.",
    mockSend: "Отправить в Codex",
    mockStatus: "Codex изменяет 2 файла",
    signalOne: "Точный DOM-контекст",
    signalTwo: "Выбор точки и области",
    signalThree: "Живой прогресс",
    signalFour: "Отмена в любой момент",
    workflowEyebrow: "От «вот этой штуки» до реального diff",
    workflowTitle: "Обратная связь на языке интерфейса.",
    workflowLead:
      "Не нужно искать селекторы и разбирать скриншоты. Просто покажите MagicBro, что имеете в виду.",
    stepOneTitle: "Выберите",
    stepOneText:
      "Кликните по элементу или выделите область на открытой странице.",
    stepTwoTitle: "Объясните",
    stepTwoText:
      "Опишите результат своими словами — кратко или максимально точно.",
    stepThreeTitle: "Получите результат",
    stepThreeText:
      "Codex найдёт исходник, изменит нужные файлы и покажет прогресс в реальном времени.",
    featuresEyebrow: "Контекст без лишних объяснений",
    featuresTitle: "Для самой непростой части фронтенд-работы.",
    featureContextTitle: "Больше, чем скриншот.",
    featureContextText:
      "MagicBro собирает структуру DOM, диапазоны текста, координаты, данные viewport, подключённые ресурсы и визуальное выделение.",
    featureSessionTitle: "Помнит разговор.",
    featureSessionText:
      "Одна постоянная ACP-сессия сохраняет контекст между всеми уточнениями.",
    featureControlTitle: "Прозрачно и управляемо.",
    featureControlText:
      "Следите за работой, отменяйте запуск, выбирайте модель и уровень рассуждений.",
    featureLocalTitle: "Ваш проект остаётся вашим.",
    featureLocalText:
      "CLI запускается из рабочей папки. Userscript общается с localhost. Codex изменяет именно тот проект, из которого запущен MagicBro.",
    installEyebrow: "Две минуты до первого комментария",
    installTitle: "Добавьте скрипт. Запустите CLI. Покажите.",
    installLead:
      "MagicBro требует Node.js 20+, действующую авторизацию Codex и Tampermonkey или Violentmonkey.",
    installOneTitle: "Установите CLI",
    installOneText: "Установите пакет глобально из npm.",
    installTwoTitle: "Добавьте userscript",
    installTwoText: "Вставьте userscript в расширение браузера.",
    installThreeTitle: "Запустите в проекте",
    installThreeText:
      "Запустите MagicBro из папки, которую должен изменять Codex.",
    copy: "Копировать",
    copied: "Скопировано",
    terminalCommentOne: "# Установить один раз",
    terminalCommentTwo: "# Запустить в любом проекте",
    terminalReady: "ACP-сессия Codex готова",
    closingEyebrow: "Не объясняйте где. Объясняйте что.",
    closingTitle: "Интерфейс уже содержит весь контекст.",
    closingText: "Позвольте MagicBro передать его Codex.",
    closingCta: "Начать",
    footer: "Покажи. Объясни. Готово.",
  },
};

const languageButtons = document.querySelectorAll("[data-language-button]");
const translatableElements = document.querySelectorAll("[data-i18n]");

function setLanguage(language) {
  const selected = translations[language] ? language : "en";
  document.documentElement.lang = selected;
  document.documentElement.dataset.language = selected;
  document.title =
    selected === "ru"
      ? "MagicBro — Покажи. Объясни. Готово."
      : "MagicBro — Point. Explain. Ship.";
  document.querySelector('meta[name="description"]').content =
    selected === "ru"
      ? "MagicBro превращает визуальные комментарии на открытом сайте в точные изменения кода через Codex."
      : "MagicBro turns visual feedback on a running website into focused Codex code changes.";

  translatableElements.forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[selected][key])
      element.textContent = translations[selected][key];
  });
  languageButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.languageButton === selected),
    ),
  );
  try {
    localStorage.setItem("magicbro-language", selected);
  } catch {}
}

languageButtons.forEach((button) =>
  button.addEventListener("click", () =>
    setLanguage(button.dataset.languageButton),
  ),
);

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      const label = button.querySelector("[data-i18n]");
      label.textContent = translations[document.documentElement.lang].copied;
      window.setTimeout(() => {
        label.textContent = translations[document.documentElement.lang].copy;
      }, 1600);
    } catch {}
  });
});

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          }),
        { threshold: 0.12 },
      )
    : null;

document
  .querySelectorAll(".reveal")
  .forEach((element) =>
    observer ? observer.observe(element) : element.classList.add("is-visible"),
  );

let preferredLanguage = "en";
try {
  preferredLanguage =
    localStorage.getItem("magicbro-language") ||
    (navigator.language.startsWith("ru") ? "ru" : "en");
} catch {}
setLanguage(preferredLanguage);
