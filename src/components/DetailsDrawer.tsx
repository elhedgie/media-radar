import type { FC } from "react";
import styles from "../App.module.css";
import type { HoldingNode } from "../data/holdings";

type DetailsDrawerProps = {
  holding: HoldingNode | null;
  onClose: () => void;
};

const fallbackDescription =
  "Описание подготовим позже. Команда продолжает наполнять базу.";

export const DetailsDrawer: FC<DetailsDrawerProps> = ({ holding, onClose }) => {
  if (!holding) return null;

  const isTelegram =
    holding.subscribers != null || (holding.link || "").includes("t.me");

  // Проверяем, есть ли полные данные (холдинг или телеграм-канал с информацией)
  const hasFullData =
    holding.keyAssets != null ||
    holding.politicalForce != null ||
    holding.subscribers != null;

  return (
    <div
      className={styles["details-overlay"]}
      role="presentation"
      data-prevent-search-close="true"
      onClick={onClose}
    >
      <article
        className={styles["details-modal"]}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles["details-modal__header"]}>
          <div>
            <h2>{holding.name}</h2>
            <p className={styles["details-modal__type"]}>
              {isTelegram ? "Telegram-канал" : "Холдинг"}
            </p>
          </div>

          <div className={styles["details-modal__header-buttons"]}>
            <button
              className={styles["details-modal__icon-button"]}
              aria-label="Открыть карточку в новом окне"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.9165 0.895491L0.89497 14.917M14.9165 0.895491L14.9165 14.917M14.9165 0.895491L0.89497 0.895491"
                  stroke="#262628"
                  stroke-width="1.79"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button
              className={styles["details-modal__icon-button"]}
              aria-label="Закрыть"
              onClick={onClose}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="1.26572"
                  y1="0.894531"
                  x2="14.6623"
                  y2="14.2911"
                  stroke="#262628"
                  stroke-width="1.79"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <line
                  x1="14.6621"
                  y1="1.26963"
                  x2="1.26557"
                  y2="14.6662"
                  stroke="#262628"
                  stroke-width="1.79"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles["details-modal__content"]}>
          {!hasFullData ? (
            <section>
              <p className={styles["details-description"]}>
                {holding.description ?? fallbackDescription}
              </p>
            </section>
          ) : isTelegram ? (
            <>
              <section className={styles["details-stats"]}>
                <div className={styles["details-stat"]}>
                  <p className={styles["details-stat-label"]}>Подписчики</p>
                  <p className={styles["details-stat-value"]}>
                    {holding.subscribers ?? "—"}
                  </p>
                </div>
                <div className={styles["details-stat"]}>
                  <p className={styles["details-stat-label"]}>Средний охват</p>
                  <p className={styles["details-stat-value"]}>
                    {holding.reach ?? "—"}
                  </p>
                </div>
              </section>

              <section>
                <p className={styles["details-section-title"]}>
                  Какие бренды и личности чаще упоминаются в канале
                </p>
                <p className={styles["details-description"]}>
                  {holding.mentionNotes ??
                    "Данные о брендах и персонажах дополним позднее."}
                </p>
              </section>
            </>
          ) : (
            <>
              <section className={styles["details-meta"]}>
                <div className={styles["details-meta__left"]}>
                  <div
                    className={styles["details-meta__avatar"]}
                    aria-hidden="true"
                  >
                    {holding.imagePath ? (
                      <img src={holding.imagePath} alt="фото главы холдинга" />
                    ) : null}
                  </div>
                  <p className={styles["details-meta__role"]}>Глава</p>
                  <p className={styles["details-meta__name"]}>
                    {holding.leader ?? "Уточняется"}
                  </p>
                </div>
              </section>

              <section className={styles["details-info-stack"]}>
                <div className={styles["details-info-block"]}>
                  <p className={styles["details-label"]}>
                    Ключевые активы / главреды
                  </p>
                  <p className={styles["details-value"]}>
                    {holding.keyAssets ?? holding.otherAssets ?? "Нет данных"}
                  </p>
                </div>

                <div className={styles["details-info-block"]}>
                  <p className={styles["details-label"]}>Глава холдинга</p>
                  <p className={styles["details-value"]}>
                    {holding.leader ?? "Уточняется"}
                  </p>
                </div>

                <div className={styles["details-info-block"]}>
                  <p className={styles["details-label"]}>Политическая сила</p>
                  <p className={styles["details-value"]}>
                    {holding.politicalForce ?? "Нет данных"}
                  </p>
                </div>
              </section>

              <section>
                <p className={styles["details-description"]}>
                  {holding.description ?? fallbackDescription}
                </p>
              </section>
            </>
          )}
        </div>
      </article>
      {/* Backdrop close-area removed so clicks pass through to the board. */}
    </div>
  );
};
