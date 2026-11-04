export const SCHOOL_INFO = {
  name: "УКТЦ Правец",
  shortName: "УКТЦ",
  academicYear: "2025/2026",
  ticketPrefix: "UKTC-2026",
};

export const PROJECT_THEME_PRESETS = [
  {
    id: "restaurant-pos",
    title: "Платформа за ресторанти и онлайн поръчки",
    category: "Full-Stack Web & POS",
    summary: "Уеб система за онлайн меню, резервация на маси, POS количка и кухненски мониторинг в реално време.",
  },
  {
    id: "music-streaming",
    title: "Аудио стрийминг платформа и музикална общност",
    category: "Multimedia / Cloud App",
    summary: "Уеб плейър с плейлисти, аудио визуализации, управление на права и анализи.",
  },
  {
    id: "developer-forum",
    title: "Технически форум за инженери и програмисти",
    category: "Community Platform",
    summary: "Форумна йерархична архитектура, форматиране на код, репутационна система и модерация.",
  },
  {
    id: "iot-smart-campus",
    title: "IoT мониторинг система за сензорни мрежи",
    category: "IoT & Hardware",
    summary: "Табло за визуализация на телеметрични данни (температура, влажност, електропотребление).",
  },
  {
    id: "ecommerce-headless",
    title: "Headless електронна търговия със склад",
    category: "Enterprise E-Commerce",
    summary: "Каталог на артикули, автоматизирана количка, складови наличности и поръчки.",
  },
  {
    id: "custom",
    title: "Индивидуална тема (ще я опиша сам)",
    category: "Персонализиран проект",
    summary: "Изберете тази опция, ако имате собствена одобрена или планирана тема.",
  },
] as const;

export const PROJECT_SCOPES = [
  {
    id: "SOFTWARE_ONLY",
    title: "Само софтуерна реализация",
    subtitle: "Изграждане на изходния код, базата данни и инструкции за стартиране.",
    badge: "Софтуер",
  },
  {
    id: "FULL_PACKAGE",
    title: "Софтуер + Пълна документация",
    subtitle: "Изходен код + официална дипломна документация според академичния стандарт.",
    badge: "Пълен пакет",
  },
] as const;

export const PROJECT_DIFFICULTIES = [
  {
    id: "BASIC",
    level: "Базово ниво",
    tagline: "Стандартна CRUD архитектура",
    description: "Релационна база, основни форми, стандартен потребителски интерфейс и сигурна автентикация.",
    recommendedBudget: "350 - 550 лв.",
  },
  {
    id: "STANDARD",
    level: "Стандартно / Оптимално",
    tagline: "Пълнофункционален съвременен софтуер",
    description: "Интерактивни компоненти, роли и права на достъп, REST/tRPC API и интерактивни графики.",
    recommendedBudget: "550 - 900 лв.",
  },
  {
    id: "ADVANCED",
    level: "Разширено / Комплексно",
    tagline: "Сложна мултимодулна система",
    description: "WebSockets в реално време, микроуслуги или IoT хардуерна интеграция и сложна бизнес логика.",
    recommendedBudget: "900 - 1500+ лв.",
  },
] as const;
