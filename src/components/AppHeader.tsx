import type { FC } from "react";
import styles from "../App.module.css";
import { FilterDropdown } from "./FilterDropdown";
import { SearchBar } from "./SearchBar";

type FilterOption = {
  id: string;
  label: string;
  active?: boolean;
};

type SearchResultType = "holding" | "channel";

type AppHeaderProps = {
  isFilterOpen: boolean;
  filterOptions: FilterOption[];
  onToggleFilter: () => void;
  onCloseFilter: () => void;
  onToggleFilterOption?: (id: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSelectSearchResult?: (id: string, type: SearchResultType) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (param: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMobile: boolean;
};

export const AppHeader: FC<AppHeaderProps> = ({
  isFilterOpen,
  filterOptions,
  onToggleFilter,
  onCloseFilter,
  onZoomIn,
  onZoomOut,
  onToggleFilterOption,
  onSelectSearchResult,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  isMobile,
}) => {
  return (
    <>
      <header className={styles["app__header"]}>
        <div className={styles["app__header-left"]}>
          {(() => {
            const activeOptions = filterOptions.filter((o) => o.active);
            let selectedLabel = "Все";
            if (activeOptions.length === 1) {
              selectedLabel = activeOptions[0].label;
            } else if (activeOptions.length > 1) {
              selectedLabel = `${activeOptions.length} фильтра`;
            }
            return (
              <FilterDropdown
                isOpen={isFilterOpen}
                onToggle={onToggleFilter}
                onClose={onCloseFilter}
                options={filterOptions}
                onToggleOption={onToggleFilterOption}
                selectedLabel={selectedLabel}
              />
            );
          })()}
        </div>
        <div className={styles["toolbar__zoom"]}>
          <button onClick={onZoomIn} aria-label="Zoom In">
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="25.0117"
                y1="12.7531"
                x2="0.780439"
                y2="12.7531"
                stroke="#262628"
                stroke-width="1.56088"
                stroke-linecap="round"
              />
              <line
                x1="12.83"
                y1="25.0125"
                x2="12.83"
                y2="0.781297"
                stroke="#262628"
                stroke-width="1.56088"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button onClick={onZoomOut} aria-label="Zoom Out">
            <svg
              width="26"
              height="2"
              viewBox="0 0 26 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="25.0116"
                y1="0.780438"
                x2="0.780319"
                y2="0.780438"
                stroke="#262628"
                stroke-width="1.56088"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles["app__header-right"]}>
          <button
            className={styles["icon-button"]}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            style={
              isMobile && isSearchOpen ? { visibility: "hidden" } : undefined
            }
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectSearchResult={onSelectSearchResult}
            />
          )}
        </div>
      </header>
    </>
  );
};
