// Ручные позиции для элементов внутри кругов.
// Ключ — нормализованный текст элемента (lowercase, без пунктуации, пробелы сведены).
// Значения: координаты `x`/`y` в пикселях относительно центра круга (локальные единицы,
// совпадают с теми, что используются в `RadarBoard` — т.е. радиус базового диаметра).
// Опционально можно задать `fontSize` и `maxWidth`.

export type ManualPos = { x: number; y: number; fontSize?: number; maxWidth?: number };

// Пример заполнения (пока пусто). Правьте эти значения вручную для каждого текста,
// который хотите расположить точно. Ключи — примеры нормализованных значений.
// Пример ключа: "РИА Новости" -> "рия новости"
export const manualPositions: Record<string, ManualPos> = {
  // Примеры начальных позиций — подгоняйте вручную по вкусу.
  "рия новости": { x: 20, y: -12, fontSize: 11, maxWidth: 90 },
  "тасс": { x: -28, y: -8, fontSize: 11, maxWidth: 80 },
  "mash": { x: -10, y: 36, fontSize: 10, maxWidth: 100 },
};

/** Вспомогательный экспортер нормализует ключ так же, как и в RadarBoard */
export const normalizeKey = (s: string) =>
  String(s)
    .normalize("NFKC")
    .replace(/\p{P}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export default manualPositions;
