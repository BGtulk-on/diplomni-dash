export const SCHOOL_INFO = {
  name: "УКТЦ Правец",
  shortName: "УКТЦ",
  academicYear: "2025/2026",
  ticketPrefix: "UKTC-2026",
};

export const PROJECT_THEME_PRESETS = [
  {
    id: "restaurant-pos",
    title: "Ресторант и поръчки",
    category: "Web & POS",
    summary: "Меню, поръчки и резервации.",
  },
  {
    id: "music-streaming",
    title: "Музикален стрийминг",
    category: "Мултимедия",
    summary: "Плейър, плейлисти и профили.",
  },
  {
    id: "developer-forum",
    title: "Технически форум",
    category: "Общност",
    summary: "Теми, отговори и гласуване.",
  },
  {
    id: "iot-smart-campus",
    title: "IoT мониторинг",
    category: "IoT",
    summary: "Табло за сензорни данни.",
  },
  {
    id: "ecommerce-headless",
    title: "Онлайн магазин",
    category: "Е-търговия",
    summary: "Каталог, количка и склад.",
  },
  {
    id: "custom",
    title: "Собствена тема",
    category: "Индивидуална",
    summary: "Опишете своя идея.",
  },
] as const;

export const PROJECT_SCOPES = [
  {
    id: "SOFTWARE_ONLY",
    title: "Само софтуер",
    subtitle: "Код и инструкции за пускане.",
    badge: "Софтуер",
  },
  {
    id: "FULL_PACKAGE",
    title: "Софтуер + Документация",
    subtitle: "Код и пълна дипломна документация.",
    badge: "Пълен пакет",
  },
] as const;

export const PROJECT_DIFFICULTIES = [
  {
    id: "BASIC",
    level: "Базово",
    targetGrade: "лесна 5ца",
    tagline: "CRUD функции",
    description: "База данни, форми и вход в системата.",
    recommendedBudget: "150 - 250 €",   
  },
  {
    id: "STANDARD",
    level: "Стандартно",
    targetGrade: "лесна 6ца",
    tagline: "Пълен софтуер",
    description: "Интерактивен дизайн, роли и API.",
    recommendedBudget: "250 - 450 €",
  },
  {
    id: "ADVANCED",
    level: "Разширено",
    targetGrade: "за любители",
    tagline: "Комплексен проект",
    description: "Реално време и микроуслуги.",
    recommendedBudget: "450 - 600 €",   
  },
] as const;
