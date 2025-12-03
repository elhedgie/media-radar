import { useState, type FC } from "react";
import styles from "../App.module.css";
import { FilterDropdown } from "./FilterDropdown";
import { SearchBar } from "./SearchBar";

type FilterOption = {
  id: string;
  label: string;
  active?: boolean;
};

type AppHeaderProps = {
  isFilterOpen: boolean;
  filterOptions: FilterOption[];
  onToggleFilter: () => void;
  onCloseFilter: () => void;
  onToggleFilterOption?: (id: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
};

export const AppHeader: FC<AppHeaderProps> = ({
  isFilterOpen,
  filterOptions,
  onToggleFilter,
  onCloseFilter,
  onZoomIn,
  onZoomOut,
  onToggleFilterOption,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  return (
    <>
      <header className={styles["app__header"]}>
        <div className={styles["app__header-left"]}>
          {
            (() => {
              const selected = filterOptions.find((o) => o.active)?.label ?? "Все";
              return (
                <FilterDropdown
                  isOpen={isFilterOpen}
                  onToggle={onToggleFilter}
                  onClose={onCloseFilter}
                  options={filterOptions}
                  onToggleOption={onToggleFilterOption}
                  selectedLabel={selected}
                />
              );
            })()
          }
        </div>
        <div className={styles["toolbar__zoom"]}>
          <button onClick={onZoomIn} aria-label="Zoom In">
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
              <line
                x1="18.976"
                y1="9.70299"
                x2="8.29466e-07"
                y2="9.70299"
                stroke="#262628"
                strokeWidth="1.79269"
              />
              <line
                x1="9.1207"
                y1="18.9766"
                x2="9.1207"
                y2="0.000594004"
                stroke="#262628"
                strokeWidth="1.79269"
              />
            </svg>
          </button>
          <button onClick={onZoomOut} aria-label="Zoom Out">
            <svg width="19" height="2" viewBox="0 0 19 2" fill="none">
              <line
                x1="18.976"
                y1="0.896347"
                x2="-1.90735e-06"
                y2="0.896347"
                stroke="#262628"
                strokeWidth="1.79269"
              />
            </svg>
          </button>
        </div>

        <div className={styles["app__header-right"]}>
          <button
            className={styles["icon-button"]}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
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
          </button>
          {isSearchOpen && (
            <SearchBar
              isOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />
          )}
        </div>
      </header>
    </>
  );
};
