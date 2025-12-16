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
    <div className={styles["details-overlay"]} role="presentation">
      <article
        className={styles["details-modal"]}
        role="dialog"
        aria-modal="true"
      >
        <header className={styles["details-modal__header"]}>
          <div>
            <h2>{holding.name}</h2>
            {(holding.subscribers != null ||
              (holding.link || "").includes("t.me")) && (
              <p className={styles["details-modal__type"]}>Telegram-канал</p>
            )}
          </div>

          <div className={styles["details-modal__header-buttons"]}>
            <button
              className={styles["details-modal__icon-button"]}
              aria-label="Открыть карточку в новом окне"
            >
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M7 19L19 7" stroke="#1E1F27" strokeWidth="1.6" />
                <path d="M11 7H19V15" stroke="#1E1F27" strokeWidth="1.6" />
              </svg>
            </button>
            <button
              className={styles["details-modal__icon-button"]}
              aria-label="Закрыть"
              onClick={onClose}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M5 5L17 17M17 5L5 17"
                  stroke="#1E1F27"
                  strokeWidth="1.6"
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
