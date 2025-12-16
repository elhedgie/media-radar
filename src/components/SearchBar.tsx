import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../App.module.css";
import { holdingsLevelOne, tgChannels } from "../data/holdings";

type SearchResultType = "holding" | "channel";

type SearchBarProps = {
  isOpen: boolean;
  setIsSearchOpen: (param: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectSearchResult?: (id: string, type: SearchResultType) => void;
};

const normalizeText = (value: string) =>
  String(value)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "")
    .trim();

const cyrToLatMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const latToCyrChunks: Record<string, string> = {
  shch: "щ",
  sch: "щ",
  yo: "ё",
  yu: "ю",
  ya: "я",
  ye: "е",
  yi: "и",
  kh: "х",
  ts: "ц",
  ch: "ч",
  sh: "ш",
  zh: "ж",
};

const latToCyrSingle: Record<string, string> = {
  a: "а",
  b: "б",
  c: "к",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "к",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "кс",
  y: "й",
  z: "з",
};

const transliterateCyrToLat = (value: string) =>
  normalizeText(value)
    .split("")
    .map((char) => cyrToLatMap[char] ?? char)
    .join("")
    .trim();

const transliterateLatToCyr = (value: string) => {
  const lower = normalizeText(value);
  let result = "";
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (const len of [4, 3, 2]) {
      if (i + len > lower.length) continue;
      const chunk = lower.slice(i, i + len);
      if (latToCyrChunks[chunk]) {
        result += latToCyrChunks[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const char = lower[i];
      result += latToCyrSingle[char] ?? char;
      i += 1;
    }
  }
  return result.trim();
};

const buildTokens = (value: string) => {
  const variants = new Set<string>();
  const base = normalizeText(value);
  if (base) variants.add(base);
  const lat = transliterateCyrToLat(value);
  if (lat) variants.add(lat);
  const cyr = transliterateLatToCyr(value);
  if (cyr) variants.add(cyr);
  return Array.from(variants).filter(Boolean);
};

export const SearchBar: FC<SearchBarProps> = ({
  setIsSearchOpen,
  isOpen: _isOpen,
  searchQuery,
  setSearchQuery,
  onSelectSearchResult,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [results, setResults] = useState<
    Array<{ id: string; name: string; type: SearchResultType }>
  >([]);

  // Объединяем холдинги и телеграм-каналы для поиска с дополнительными токенами
  const allItems = useMemo(
    () => [
      ...holdingsLevelOne.map((h) => ({
        id: h.id,
        name: h.name,
        type: "holding" as const,
        tokens: buildTokens(h.name),
      })),
      ...tgChannels.map((t) => ({
        id: t.id,
        name: t.name,
        type: "channel" as const,
        tokens: buildTokens(t.name),
      })),
    ],
    []
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const el = containerRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (
        target instanceof Element &&
        target.closest('[data-prevent-search-close="true"]')
      ) {
        return;
      }
      if (target && !el.contains(target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [setIsSearchOpen]);

  // Обновляем результаты при изменении поискового запроса
  useEffect(() => {
    const queryTokens = buildTokens(searchQuery);
    if (queryTokens.length === 0) {
      setResults([]);
      return;
    }

    const filtered = allItems.filter((item) =>
      queryTokens.some((token) =>
        item.tokens.some((itemToken) => itemToken.includes(token))
      )
    );
    setResults(filtered.map(({ tokens, ...rest }) => rest));
  }, [searchQuery, allItems]);

  return (
    <div className={styles["search-container"]} ref={containerRef}>
      <input
        type="text"
        className={styles["search-input"]}
        placeholder="Поиск"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />

      <div className={styles["search-icon"]}>
        <svg width="19" height="21" viewBox="0 0 19 21" fill="none">
          <circle
            cx="10.479"
            cy="8.3286"
            r="7.4609"
            stroke="#262628"
            strokeWidth="1.7354"
          />
          <line
            x1="6.0976"
            y1="14.2464"
            x2="0.613551"
            y2="19.7304"
            stroke="#262628"
            strokeWidth="1.7354"
          />
        </svg>
      </div>

      {/* Список результатов поиска */}
      {results.length > 0 && (
        <div className={styles["search-results"]}>
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className={styles["search-result-item"]}
              onClick={() => {
                onSelectSearchResult?.(result.id, result.type);
              }}
            >
              <span className={styles["search-result-name"]}>{result.name}</span>
              <span className={styles["search-result-type"]}>{result.type === "holding" ? "Холдинг" : "Канал"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
