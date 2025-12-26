// Ручная раскладка элементов внутри каждого круга.
// Ключ — id холдинга (node.id). Значение — массив объектов для каждой подписи:
// { text, type: 'asset'|'telegram', x, y }
// Координаты `x,y` — в пикселях относительно центра круга (локальные единицы).

export type ManualLayoutItem = {
  text: string;
  type: "asset" | "telegram";
  x: number;
  y: number;
};

export const manualLayout: Record<string, ManualLayoutItem[]> = {
  // Автогенерация: статические позиции для ВСЕХ элементов из holdingsLevelOne.
  vgtrk: [
    { text: "Россия-1", type: "asset", x: -60, y: -36 },
    { text: "Россия 24", type: "asset", x: -10, y: -66 },
    { text: "Москва 24", type: "asset", x: 5, y: 76 },
    { text: "ВЕСТИ", type: "telegram", x: 0, y: -36 },
    { text: "Скабеева", type: "telegram", x: 56, y: -60 },
    { text: "Соловьев", type: "telegram", x: 40, y: 28 },
    { text: "Смотрим.ру", type: "asset", x: -70, y: 8 },
    { text: "Радио России", type: "asset", x: 44, y: 53 },
    { text: "Радио Маяк", type: "asset", x: 60, y: -18 },
    { text: "Вести ФМ", type: "asset", x: 80, y: 7 },
    { text: "Радио Культура", type: "asset", x: -40, y: 50 },
  ],

  nmg: [
    { text: "Известия", type: "asset", x: -60, y: -36 },
    { text: "Деловой Петербург", type: "asset", x: 0, y: 56 },
    { text: "78.ru", type: "asset", x: 50, y: 26 },
    { text: "IZ.RU", type: "telegram", x: 0, y: -76 },
    { text: "78 | Новости", type: "telegram", x: 40, y: -46 },
    { text: "Спорт Экспресс", type: "asset", x: 66, y: -18 },
    { text: "РЕН ТВ", type: "asset", x: -70, y: 12 },
  ],

  gazprom: [
    { text: "НТВ", type: "asset", x: -60, y: -36 },
    { text: "Матч ТВ", type: "asset", x: 0, y: -66 },
    { text: "НТВ", type: "telegram", x: -60, y: 46 },
    { text: "Матч-ТВ", type: "telegram", x: 50, y: -36 },
    { text: "ИД 7 Дней", type: "asset", x: 60, y: 46 },
    { text: "ТНТ", type: "asset", x: 0, y: 38 },
    { text: "Пятница!", type: "asset", x: -30, y: 68 },
    { text: "ТВ-3", type: "asset", x: -15, y: -28 },
    { text: "Суббота", type: "asset", x: 30, y: 68 },
  ],

  ria: [
    { text: "РИА Новости", type: "asset", x: 0, y: -80 },
    { text: "Sputnik", type: "asset", x: -35, y: -61 },
    { text: "Russia Today", type: "asset", x: 61, y: -35 },
    { text: "РИА Новости", type: "telegram", x: 10, y: -20 },
    { text: "Маргарита Симоньян", type: "telegram", x: -41, y: 35 },
    { text: "Радио Спутник", type: "telegram", x: 35, y: 51 },
    { text: "RT на русском", type: "telegram", x: 0, y: 75 },
    { text: "Прайм", type: "asset", x: -50, y: 61 },
    { text: "Arctic.ru", type: "asset", x: 71, y: 25 },
    { text: "ИноСМИ", type: "asset", x: 30, y: 20 },
    { text: "Baltnews", type: "asset", x: -61, y: -35 },
    { text: "Украина.ру", type: "asset", x: 35, y: -61 },
  ],

  tass: [
    { text: "ТАСС", type: "asset", x: 0, y: -46 },
    { text: "ТАСС", type: "telegram", x: -60, y: 36 },
    { text: "ТАСС Live", type: "telegram", x: 60, y: 36 },
  ],

  rambler: [
    { text: "Лента.ру", type: "asset", x: 69, y: 12 },
    { text: "Газета.ru", type: "asset", x: 61, y: -25 },

    { text: "Лента дня", type: "telegram", x: 0, y: 70 }, // x = 0, но |y| большое
    { text: "Лента добра", type: "telegram", x: -40, y: -64 },
    { text: "Газета.ру", type: "telegram", x: -69, y: 22 },
    { text: "Чемпионат", type: "asset", x: -61, y: -35 },
    { text: "Секрет Фирмы", type: "asset", x: -36, y: 46 },
    { text: "Ferra.ru", type: "asset", x: 24, y: -66 },
    { text: "Motor.ru", type: "asset", x: 45, y: 54 },
  ],

  shkulev: [
    { text: "E1.ru", type: "asset", x: 69, y: 22 },
    { text: "Фонтанка", type: "asset", x: 0, y: -70 },
    { text: "NGS.ru", type: "asset", x: 0, y: 70 },

    // x = 0, |y| большое
    { text: "E1.ru", type: "telegram", x: -49, y: 51 },
    { text: "НГС.ру", type: "telegram", x: -69, y: 22 },
    { text: "theGirl", type: "asset", x: -49, y: -51 },
    { text: "Marie Claire", type: "asset", x: 49, y: 51 },
    // x = 0, |y| большое
    { text: "Psychologies.ru", type: "asset", x: 49, y: -51 },
  ],

  rbc: [
    { text: "RBC.ru", type: "asset", x: 69, y: 12 },

    { text: "РБК", type: "telegram", x: -69, y: 12 },
    { text: "РБК Крипто", type: "telegram", x: -45, y: -54 },
    { text: "Сам ты инвестор", type: "telegram", x: 45, y: -34 },
    { text: "РБК ТВ", type: "asset", x: 45, y: 44 },
    { text: "РБК Нац.проекты", type: "asset", x: 0, y: 70 }, // x = 0, |y| большое
    { text: "РБК Тренды", type: "asset", x: -45, y: 44 },
  ],

  "news-media": [
    { text: "LIFE", type: "asset", x: -67, y: 22 },
    { text: "Mash", type: "telegram", x: 67, y: 22 },
    { text: "Baza", type: "telegram", x: 0, y: 70 }, // x = 0, |y| большое
    { text: "SHOT", type: "telegram", x: 41, y: -57 },
    { text: "SHOT Проверка", type: "telegram", x: -41, y: -57 },
  ],

  kommersant: [
    { text: "Коммерсантъ", type: "asset", x: -37, y: 52 },
    { text: "Коммерсантъ", type: "telegram", x: -47, y: -32 },
    { text: "Коммерсантъ FM", type: "telegram", x: 47, y: -25 },
    { text: "Коммерсантъ WEEKEND", type: "asset", x: 31, y: 27 },
    { text: "Коммерсантъ АВТОПИЛОТ", type: "asset", x: -11, y: -67 },
    { text: "Коммерсантъ ДЕНЬГИ", type: "asset", x: 20, y: 70 },
  ],

  kp: [
    { text: "Комсомольская правда", type: "asset", x: -20, y: -56 },
    { text: "Комсомольская Правда", type: "telegram", x: 20, y: 56 },
  ],

  "msk-media": [
    { text: "Москва 24", type: "asset", x: 0, y: 70 },
    { text: "Москва 24", type: "telegram", x: 0, y: -70 },
    { text: "Сити Москва 24", type: "telegram", x: -61, y: 35 },
    { text: "Москва FM", type: "telegram", x: -61, y: -35 },
    { text: "АГН Москва", type: "asset", x: 61, y: 35 },
    { text: "Москва FM", type: "asset", x: 61, y: -35 },
  ],

  // Новостные Telegram-каналы (включены имена популярных каналов)
  "tg-channels": [
    { text: "Прямой Эфир", type: "telegram", x: 0, y: -67 },
    { text: "Топор Live", type: "telegram", x: -69, y: -20 },
    { text: "Mash", type: "telegram", x: 64, y: 29 },
    { text: "РИА Новости", type: "telegram", x: 69, y: -20 },
    { text: "ТАСС", type: "telegram", x: 53, y: -46 },
    { text: "Readovka", type: "telegram", x: 10, y: -27 },
    { text: "Раньше всех. Ну почти", type: "telegram", x: 0, y: 75 },
    { text: "Правдивости", type: "telegram", x: -53, y: -46 },
    { text: "Baza", type: "telegram", x: 38, y: 59 },
    { text: "Осторожно, Новости", type: "telegram", x: -34, y: 29 },
    { text: "SHOT", type: "telegram", x: -38, y: 59 },
  ],
  // Добавляйте другие холдинги по id и списки элементов вручную.
};

export const manualMobileLayout: Record<string, ManualLayoutItem[]> = {
  // Автогенерация: статические позиции для ВСЕХ элементов из holdingsLevelOne.
  vgtrk: [
    { text: "Россия-1", type: "asset", x: -30, y: -6 },
    { text: "Россия 24", type: "asset", x: -20, y: -26 },
    { text: "Москва 24", type: "asset", x: 1, y: 36 },
    { text: "ВЕСТИ", type: "telegram", x: 0, y: -36 },
    { text: "Скабеева", type: "telegram", x: 26, y: -27 },
    { text: "Соловьев", type: "telegram", x: 25, y: 23 },
    { text: "Смотрим.ру", type: "asset", x: -30, y: 13 },
    { text: "Радио России", type: "asset", x: 35, y: 7 },
    { text: "Радио Маяк", type: "asset", x: 26, y: -12 },
    { text: "Вести ФМ", type: "asset", x: 2, y: 14 },
    { text: "Радио Культура", type: "asset", x: -20, y: 25 },
  ],

  nmg: [
    { text: "Известия", type: "asset", x: -30, y: -22 },
    { text: "Деловой Петербург", type: "asset", x: 0, y: 36 },
    { text: "78.ru", type: "asset", x: 30, y: 16 },
    { text: "IZ.RU", type: "telegram", x: 0, y: -36 },
    { text: "78 | Новости", type: "telegram", x: 27, y: -26 },
    { text: "Спорт Экспресс", type: "asset", x: 6, y: -14 },
    { text: "РЕН ТВ", type: "asset", x: -30, y: 12 },
  ],

  gazprom: [
    { text: "НТВ", type: "asset", x: -30, y: -16 },
    { text: "Матч ТВ", type: "asset", x: 0, y: -36 },
    { text: "НТВ", type: "telegram", x: -37, y: 17 },
    { text: "Матч-ТВ", type: "telegram", x: 30, y: -26 },
    { text: "ИД 7 Дней", type: "asset", x: 30, y: 26 },
    { text: "ТНТ", type: "asset", x: 0, y: 38 },
    { text: "Пятница!", type: "asset", x: -25, y: 28 },
    { text: "ТВ-3", type: "asset", x: 0, y: -10 },
    { text: "Суббота", type: "asset", x: 0, y: 18 },
  ],

  ria: [
    { text: "РИА Новости", type: "asset", x: 0, y: -40 },
    { text: "Sputnik", type: "asset", x: -25, y: -31 },
    { text: "Russia Today", type: "asset", x: 27, y: 20 },
    { text: "РИА Новости", type: "telegram", x: 10, y: -20 },
    { text: "Маргарита Симоньян", type: "telegram", x: -28, y: 25 },
    { text: "Радио Спутник", type: "telegram", x: 15, y: 33 },
    { text: "RT на русском", type: "telegram", x: 0, y: 45 },
    { text: "Прайм", type: "asset", x: -36, y: 11 },
    { text: "Arctic.ru", type: "asset", x: 35, y: 8 },
    { text: "ИноСМИ", type: "asset", x: 35, y: -8 },
    { text: "Baltnews", type: "asset", x: -35, y: -12 },
    { text: "Украина.ру", type: "asset", x: 24, y: -31 },
  ],

  tass: [
    { text: "ТАСС", type: "asset", x: 0, y: -36 },
    { text: "ТАСС", type: "telegram", x: -20, y: 26 },
    { text: "ТАСС Live", type: "telegram", x: 20, y: 26 },
  ],

  rambler: [
    { text: "Лента.ру", type: "asset", x: 13, y: 42 },
    { text: "Газета.ru", type: "asset", x: 21, y: -15 },

    { text: "Лента дня", type: "telegram", x: 20, y: -35 }, // x = 0, но |y| большое
    { text: "Лента добра", type: "telegram", x: -20, y: -24 },
    { text: "Газета.ру", type: "telegram", x: -33, y: 12 },
    { text: "Чемпионат", type: "asset", x: -5, y: 18 },
    { text: "Секрет Фирмы", type: "asset", x: -16, y: 30 },
    { text: "Ferra.ru", type: "asset", x: -10, y: -36 },
    { text: "Motor.ru", type: "asset", x: 32, y: 22 },
  ],

  shkulev: [
    { text: "E1.ru", type: "asset", x: 33, y: 18 },
    { text: "Фонтанка", type: "asset", x: 0, y: -30 },
    { text: "NGS.ru", type: "asset", x: 0, y: 40 },

    // x = 0, |y| большое
    { text: "E1.ru", type: "telegram", x: -29, y: 25 },
    { text: "НГС.ру", type: "telegram", x: -39, y: 7 },
    { text: "theGirl", type: "asset", x: -29, y: -21 },
    { text: "Marie Claire", type: "asset", x: 3, y: 12 },
    // x = 0, |y| большое
    { text: "Psychologies.ru", type: "asset", x: 29, y: -21 },
  ],

  rbc: [
    { text: "RBC.ru", type: "asset", x: 39, y: 12 },

    { text: "РБК", type: "telegram", x: -39, y: 6 },
    { text: "РБК Крипто", type: "telegram", x: -25, y: -24 },
    { text: "Сам ты инвестор", type: "telegram", x: 25, y: -14 },
    { text: "РБК ТВ", type: "asset", x: 25, y: 28 },
    { text: "РБК Нац.проекты", type: "asset", x: 0, y: 40 }, // x = 0, |y| большое
    { text: "РБК Тренды", type: "asset", x: -25, y: 24 },
  ],

  "news-media": [
    { text: "LIFE", type: "asset", x: -27, y: 22 },
    { text: "Mash", type: "telegram", x: 27, y: 22 },
    { text: "Baza", type: "telegram", x: 0, y: 40 }, // x = 0, |y| большое
    { text: "SHOT", type: "telegram", x: 17, y: -35 },
    { text: "SHOT Проверка", type: "telegram", x: -21, y: -27 },
  ],

  kommersant: [
    { text: "Коммерсантъ", type: "asset", x: -17, y: 22 },
    { text: "Коммерсантъ", type: "telegram", x: -25, y: -17 },
    { text: "Коммерсантъ FM", type: "telegram", x: 22, y: -25 },
    { text: "Коммерсантъ WEEKEND", type: "asset", x: 11, y: 37 },
    { text: "Коммерсантъ АВТОПИЛОТ", type: "asset", x: -11, y: -37 },
    { text: "Коммерсантъ ДЕНЬГИ", type: "asset", x: 25, y: 20 },
  ],

  kp: [
    { text: "Комсомольская правда", type: "asset", x: -10, y: -26 },
    { text: "Комсомольская Правда", type: "telegram", x: 20, y: 26 },
  ],

  "msk-media": [
    { text: "Москва 24", type: "asset", x: 0, y: 40 },
    { text: "Москва 24", type: "telegram", x: 0, y: -40 },
    { text: "Сити Москва 24", type: "telegram", x: -25, y: 25 },
    { text: "Москва FM", type: "telegram", x: -25, y: -25 },
    { text: "АГН Москва", type: "asset", x: 28, y: 25 },
    { text: "Москва FM", type: "asset", x: 28, y: -28 },
  ],

  // Новостные Telegram-каналы (включены имена популярных каналов)
  "tg-channels": [
    { text: "Прямой Эфир", type: "telegram", x: 7, y: -40 },
    { text: "Топор Live", type: "telegram", x: -29, y: -15 },
    { text: "Mash", type: "telegram", x: 24, y: 29 },
    { text: "РИА Новости", type: "telegram", x: 34, y: -15 },
    { text: "ТАСС", type: "telegram", x: 33, y: 16 },
    { text: "Readovka", type: "telegram", x: 14, y: -27 },
    { text: "Раньше всех. Ну почти", type: "telegram", x: 0, y: 42 },
    { text: "Правдивости", type: "telegram", x: -22, y: -31 },
    { text: "Baza", type: "telegram", x: 8, y: 19 },
    { text: "Осторожно, Новости", type: "telegram", x: -27, y: 29 },
    { text: "SHOT", type: "telegram", x: -39, y: 13 },
  ],
  // Добавляйте другие холдинги по id и списки элементов вручную.
};
