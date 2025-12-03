import type { FC } from "react";
import { useEffect, useRef } from "react";
import styles from "../App.module.css";

type SearchBarProps = {
  isOpen: boolean;
  setIsSearchOpen: (param: boolean) => void;
};

export const SearchBar: FC<SearchBarProps> = ({
  setIsSearchOpen,
  isOpen: _isOpen,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const el = containerRef.current;
      if (!el) return;
      const target = e.target as Node | null;
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

  return (
    <div className={styles["search-container"]} ref={containerRef}>
      <input
        type="text"
        className={styles["search-input"]}
        placeholder="Поиск"
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
    </div>
  );
};
