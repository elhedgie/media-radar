// utils/distributeContentInCircle.ts

export type DistributedItemType = "name" | "asset" | "telegram";

export interface DistributedItem {
  id: string;
  type: DistributedItemType;
  text: string;
  angle: number; // в градусах
  radius: number; // в px в локальных координатах круга
  fontSize: number;
  maxWidth: number;
  manual?: boolean;
  // Прямые смещения в px относительно центра круга — если заданы, рендерер
  // должен использовать их вместо вычисления по углу/радиусу.
  offsetX?: number;
  offsetY?: number;
}

import { manualPositions, normalizeKey } from "../data/manualPositions";

// Фиксы: единый размер шрифта и ширины для оценки боксов — пользователь
// просил не рассчитывать ширину/шрифт для каждого элемента индивидуально.
const DEFAULT_FONT_SIZE = 10;
const DEFAULT_MAX_WIDTH = 80;

// "Россия 1, Россия 24; Москва 24" -> ["Россия 1","Россия 24","Москва 24"]
const parseList = (value?: string | null): string[] =>
  value
    ? value
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

/** Примерная оценка высоты блока текста, с учётом переносов строк */
const estimateHeight = (text: string, fontSize: number, maxWidth: number) => {
  const charWidth = fontSize * 0.6;
  const approxTextWidth = Math.max(1, text.length) * charWidth;
  const lines = Math.max(1, Math.ceil(approxTextWidth / maxWidth));
  const lineHeight = fontSize * 1.2;
  return lines * lineHeight;
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const boxesIntersect = (a: Box, b: Box): boolean => {
  const ax1 = a.x - a.width / 2;
  const ax2 = a.x + a.width / 2;
  const ay1 = a.y - a.height / 2;
  const ay2 = a.y + a.height / 2;

  const bx1 = b.x - b.width / 2;
  const bx2 = b.x + b.width / 2;
  const by1 = b.y - b.height / 2;
  const by2 = b.y + b.height / 2;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
};

const DEG2RAD = Math.PI / 180;

/**
 * После первичной раскладки слегка крутит углы элементов, если их прямоугольники пересекаются.
 * Так мы убираем редкие случаи наложений, не переписывая всю логику распределения.
 */
const resolveCollisions = (items: DistributedItem[]): DistributedItem[] => {
  const placed: { item: DistributedItem; box: Box }[] = [];

  // Можно упорядочить, например, от внешних колец к внутренним,
  // но в принципе любой порядок ок — главное, что он стабильный.
  const sorted = [...items].sort((a, b) => a.radius - b.radius);

  const MAX_ATTEMPTS = 36; // 36 * 10° = полный круг
  const ANGLE_STEP = 10; // шаг сдвига, градусов

  for (const item of sorted) {
    // если элемент помечен как ручной — используем его offset напрямую
    if (item.manual && typeof item.offsetX === "number" && typeof item.offsetY === "number") {
      const x = item.offsetX;
      const y = item.offsetY;
      const width = item.maxWidth ?? DEFAULT_MAX_WIDTH;
      const height = estimateHeight(item.text, item.fontSize ?? DEFAULT_FONT_SIZE, width);
      const box: Box = { x, y, width, height };
      placed.push({ item, box });
      continue;
    }
    let angle = item.angle;
    let attempts = 0;
    let finalBox: Box | null = null;

    while (attempts < MAX_ATTEMPTS) {
      const rad = angle * DEG2RAD;
      // если заданы offsetX/offsetY — используем их, иначе считаем по полярным координатам
      const x = typeof item.offsetX === "number" ? item.offsetX : item.radius * Math.cos(rad);
      const y = typeof item.offsetY === "number" ? item.offsetY : item.radius * Math.sin(rad);
      const width = item.maxWidth ?? DEFAULT_MAX_WIDTH;
      const height = estimateHeight(item.text, item.fontSize ?? DEFAULT_FONT_SIZE, width);
      const candidateBox: Box = { x, y, width, height };

      const hasOverlap = placed.some((p) =>
        boxesIntersect(candidateBox, p.box)
      );

      if (!hasOverlap) {
        // нашли позицию без пересечений
        finalBox = candidateBox;
        break;
      }

      angle += ANGLE_STEP;
      attempts++;
    }

    // Если даже после всех попыток пересечения остаются — оставляем как есть,
    // но такое при небольшом количестве элементов практически не случится.
    if (!finalBox) {
      const rad = item.angle * DEG2RAD;
      const x = typeof item.offsetX === "number" ? item.offsetX : item.radius * Math.cos(rad);
      const y = typeof item.offsetY === "number" ? item.offsetY : item.radius * Math.sin(rad);
      const width = item.maxWidth ?? DEFAULT_MAX_WIDTH;
      finalBox = {
        x,
        y,
        width,
        height: estimateHeight(item.text, item.fontSize ?? DEFAULT_FONT_SIZE, width),
      };
    } else {
      item.angle = angle; // фиксируем новый угол
    }

    placed.push({ item, box: finalBox });
  }

  return items;
};

/**
 * Раскладываем подписи по кругу.
 *
 * nodeName       — название холдинга (тут не используется, имя рендерится отдельно в центре)
 * keyAssetsRaw   — строка с ключевыми активами
 * keyTelegramsRaw— строка с TG-каналами
 * otherAssetsRaw — строка с остальными активами (null => 2 уровень, строка => 3 уровень)
 * circleDiameter — диаметр круга, который ты передаёшь (205, 380 или 598 — неважно, мы работаем в относительных долях)
 * includeName    — игнорируем, оставлено только ради совместимости
 */
export const distributeContentInCircle = (
  _nodeName: string,
  keyAssetsRaw: string | undefined,
  keyTelegramsRaw: string | undefined,
  otherAssetsRaw: string | undefined | null,
  circleDiameter: number,
  _includeName: boolean = true
) => {
  const circleRadius = circleDiameter / 2;

  // определяем уровень зума по наличию otherAssets
  const zoomLevel: 2 | 3 = otherAssetsRaw ? 3 : 2;

  // внутрь этой зоны НИКОГДА не кладём подписи — здесь живёт название холдинга
  // reserve smaller central area so подписи могут использовать больше внутреннего пространства
  // уменьшили с 0.6R до 0.35R — это позволяет распределять подписи ближе к центру,
  // избегая при этом прямого перекрытия названия (название рендерится отдельно)
  const innerSafeRadius = circleRadius * 0.35;

  // внешняя граница для подписей — чтобы текст не упирался в край круга
  // сдвинули немного внутрь, чтобы подписи не оказывались по самому краю круга
  const outerSafeRadius = circleRadius * 0.9;

  const keyAssets = parseList(keyAssetsRaw);
  const keyTelegrams = parseList(keyTelegramsRaw);
  const otherAssets = zoomLevel === 3 ? parseList(otherAssetsRaw) : [];

  type PayloadItem = {
    id: string;
    type: Exclude<DistributedItemType, "name">;
    text: string;
  };

  const items: PayloadItem[] = [];
  let counter = 0;

  const pushList = (list: string[], type: PayloadItem["type"]) => {
    list.forEach((text) =>
      items.push({
        id: `${type}-${counter++}`,
        type,
        text,
      })
    );
  };

  // 2 уровень: keyAssets + keyTelegrams
  // 3 уровень: keyAssets + otherAssets + keyTelegrams
  pushList(keyAssets, "asset");
  pushList(keyTelegrams, "telegram");
  pushList(otherAssets, "asset");

  if (!items.length) return [] as DistributedItem[];

  const total = items.length;

  // ================= ЧИСЛО КОЛЕЦ =================
  // Логика: чем больше элементов, тем больше колец.
  let ringCount: number;
  if (zoomLevel === 2) {
    if (total <= 4) ringCount = 1;
    else if (total <= 10) ringCount = 2;
    else ringCount = 3;
  } else {
    if (total <= 6) ringCount = 1;
    else if (total <= 12) ringCount = 2;
    else if (total <= 18) ringCount = 3;
    else ringCount = 4;
  }

  // ================= РАДИУСЫ КОЛЕЦ =================
  const ringRadii: number[] = Array.from({ length: ringCount }, (_, idx) => {
    // равномерно между innerSafe и outerSafe
    const t = (idx + 1) / (ringCount + 1); // 1/(n+1), ..., n/(n+1)
    return innerSafeRadius + (outerSafeRadius - innerSafeRadius) * t;
  });

  // ================= РАСКЛАДКА ПО КОЛЬЦАМ =================
  const itemsByRing: PayloadItem[][] = Array.from(
    { length: ringCount },
    () => []
  );

  // распределяем элементы по кольцам. Сначала сортируем по длине (большие элементы
  // равномерно попадут в разные кольца), затем используем round-robin
  const sortedItems = [...items].sort((a, b) => b.text.length - a.text.length);
  sortedItems.forEach((item, index) => {
    const ringIndex = index % ringCount;
    itemsByRing[ringIndex].push(item);
  });

  const result: DistributedItem[] = [];

  // ================= УКЛАДКА КАЖДОГО КОЛЬЦА =================
  itemsByRing.forEach((ringItems, ringIndex) => {
    if (!ringItems.length) return;

    const r = ringRadii[ringIndex];
    const n = ringItems.length;

    // базовый размер шрифта для этого кольца
    const baseFontSize = 7;

    // грубая оценка ширины символа для этого шрифта — немного более консервативная
    const charWidth = baseFontSize * 0.55;

    // оцениваем "сырые" ширины слов — уменьшаем минимальную и максимальную ширину
    const rawWidths = ringItems.map((it) => {
      const len = it.text.length || 1;
      // word-wrap по 2 строкам => делим на 1.8
      const approx = (len * charWidth) / 1.8;
      // ограничим разумным диапазоном (меньше, чтобы не упираться в край)
      return Math.min(120, Math.max(40, approx));
    });

    const circumference = 2 * Math.PI * r;
    const gap = 12; // минимальный зазор между подписями по дуге

    const avgRawWidth = rawWidths.reduce((sum, w) => sum + w, 0) / n;

    const targetWidthPerItem = (circumference - gap * n) / n;

    // если мест мало, уменьшаем шрифт (и ширину) для всего кольца
    let scale = 1;
    if (targetWidthPerItem < avgRawWidth) {
      scale = targetWidthPerItem / avgRawWidth;
      if (scale < 0.5) scale = 0.5; // не делаем текст совсем микроскопическим
    }

    const finalFontSize = Math.max(5, baseFontSize * scale);
    const finalWidths = rawWidths.map((w) => w * scale);

    // равномерный шаг по кругу
    const step = 360 / n;
    // чётные/нечётные кольца чуть сдвигаем, чтобы не было "столбиков"
    const startAngle = -90 + (ringIndex % 2) * (step / 2);

    ringItems.forEach((item, idx) => {
      const angle = startAngle + idx * step;

      // проверьте, задана ли ручная позиция для этого текста
      const key = normalizeKey(item.text);
      const mp = manualPositions[key];

      if (mp) {
        // при ручной позиции возвращаем смещения напрямую (offsetX/offsetY)
        result.push({
          id: item.id,
          type: item.type,
          text: item.text,
          angle: 0,
          radius: 0,
          fontSize: DEFAULT_FONT_SIZE,
          maxWidth: DEFAULT_MAX_WIDTH,
          manual: true,
          offsetX: mp.x,
          offsetY: mp.y,
        });
      } else {
        // вычисляем смещение и возвращаем offsetX/offsetY для ручной подгонки
        const rad = (angle * Math.PI) / 180;
        const x = r * Math.cos(rad);
        const y = r * Math.sin(rad);
        result.push({
          id: item.id,
          type: item.type,
          text: item.text,
          angle,
          radius: r,
          fontSize: DEFAULT_FONT_SIZE,
          maxWidth: DEFAULT_MAX_WIDTH,
          offsetX: x,
          offsetY: y,
        });
      }
    });
  });

  // 🔥 ВАЖНО: финальный шаг — разруливаем пересечения
  return resolveCollisions(result);
};
