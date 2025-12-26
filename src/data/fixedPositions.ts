// Жестко заданные координаты кругов относительно контейнера `.radar-board` (ширина 1440px)
// Координаты подобраны под текущий макет; при необходимости легко правятся.

export type FixedPos = { cx: number; cy: number };

export const fixedPositions: Record<string, FixedPos> = {
  // ВГТРК
  vgtrk: { cx: 200, cy: 150 },
  // НМГ
  nmg: { cx: 420, cy: 108 },
  // Газпром-медиа
  gazprom: { cx: 650, cy: 120 },
  // МИА Россия Сегодня
  ria: { cx: 880, cy: 180 },
  // ТАСС
  tass: { cx: 1100, cy: 120 },

  // Rambler&Co — нижний ряд слева
  rambler: { cx: 180, cy: 380 },
  // Shkulev Holding
  shkulev: { cx: 410, cy: 340 },
  // РБК
  rbc: { cx: 550, cy: 540 },
  // News Media Holding
  "news-media": { cx: 870, cy: 420 },
  // Коммерсантъ
  kommersant: { cx: 1100, cy: 360 },

  // Комсомольская правда — третий ряд слева
  kp: { cx: 330, cy: 550 },
  // Москва Медиа
  "msk-media": { cx: 1080, cy: 580 },

  // Новостные Telegram-каналы (акцентный)
  "tg-channels": { cx: 650, cy: 340 },
};

export const fixedMobilePositions: Record<string, FixedPos> = {
  // ВГТРК
  vgtrk: { cx: 300, cy: 140 },
  // НМГ
  nmg: { cx: 283, cy: 478 },
  // Газпром-медиа
  gazprom: { cx: 302, cy: 250 },
  // МИА Россия Сегодня
  ria: { cx: 285, cy: 366 },
  // ТАСС
  tass: { cx: 91, cy: 308 },

  // Rambler&Co — нижний ряд слева
  rambler: { cx: 92, cy: 84 },
  // Shkulev Holding
  shkulev: { cx: 209, cy: 62 },
  // РБК
  rbc: { cx: 178, cy: 503 },
  // News Media Holding
  "news-media": { cx: 197, cy: 281 },
  // Коммерсантъ
  kommersant: { cx: 65, cy: 197 },

  // Комсомольская правда — третий ряд слева
  kp: { cx: 171, cy: 392 },
  // Москва Медиа
  "msk-media": { cx: 80, cy: 454 },

  // Новостные Telegram-каналы (акцентный)
  "tg-channels": { cx: 174, cy: 167 },
};

export default fixedPositions;
