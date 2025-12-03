import type { FC } from "react";
import styles from "../App.module.css";

type FilterOption = {
  id: string;
  label: string;
  active?: boolean;
};

type FilterDropdownProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  options: FilterOption[];
  onToggleOption?: (id: string) => void;
  selectedLabel?: string;
};

export const FilterDropdown: FC<FilterDropdownProps> = ({
  isOpen,
  onToggle,
  onClose,
  options,
  onToggleOption,
  selectedLabel,
}) => (
  <div className={styles["toolbar"]}>
    <button
      className={styles["toolbar__dropdown"]}
      type="button"
      onClick={onToggle}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      {selectedLabel ?? "Все"}
      <svg
        className={styles["toolbar__dropdown-icon"]}
        width="15"
        height="9"
        viewBox="0 0 15 9"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13.6462 0.613281L7.12988 7.12964L0.613525 0.613281"
          stroke="black"
          strokeWidth="1.7354"
        />
      </svg>
    </button>

    {isOpen && (
      <>
        <div className={styles["filter-card"]} role="dialog" aria-modal="true">
          <ul>
            {options.map((option) => (
              <li
                key={option.id}
                role="button"
                onClick={() => onToggleOption && onToggleOption(option.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span>{option.label}</span>
                <span className={styles["filter-dot"]}>
                  {option.active && (
                    <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
                      <path
                        d="M16.1466 0.613251L7.12994 9.62995L0.61358 3.11359"
                        stroke="black"
                        strokeWidth="1.7354"
                      />
                    </svg>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          className={styles["filter-backdrop"]}
          aria-label="Закрыть фильтр"
          onClick={onClose}
        />
      </>
    )}
  </div>
);
