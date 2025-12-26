import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "../App.module.css";
import type { HoldingNode } from "../data/holdings";

type DetailsDrawerProps = {
  holding: HoldingNode | null;
  onClose: () => void;
};

const fallbackDescription =
  "Описание подготовим позже. Команда продолжает наполнять базу.";

export const DetailsDrawer: FC<DetailsDrawerProps> = ({ holding, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // текущее смещение при драге
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );

  const modalRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (holding) {
      setIsExpanded(false);
      setDragOffset(0);
    }
  }, [holding?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobileView(media.matches);
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  if (!holding) return null;

  const isTelegram =
    holding.subscribers != null || (holding.link || "").includes("t.me");

  const hasFullData =
    holding.keyAssets != null ||
    holding.politicalForce != null ||
    holding.subscribers != null;

  const handleStart = (clientY: number) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    lastYRef.current = clientY;
    setDragOffset(0);
  };

  const handleMove = (clientY: number) => {
    if (!isDraggingRef.current || startYRef.current === null) return;

    const delta = clientY - startYRef.current;
    lastYRef.current = clientY;
    setDragOffset(delta);
  };

  const handleEnd = (clientY: number) => {
    if (!isDraggingRef.current || startYRef.current === null) return;

    const delta = clientY - startYRef.current;

    // Определяем действие
    if (delta > 100) {
      // Сильный свайп вниз → закрыть или свернуть
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (delta < -80) {
      // Свайп вверх → развернуть
      setIsExpanded(true);
    } else {
      // Возврат к ближайшему состоянию
      if (Math.abs(delta) > 40) {
        setIsExpanded(delta < 0);
      }
    }

    // Сбрасываем
    isDraggingRef.current = false;
    startYRef.current = null;
    setDragOffset(0);
  };

  // Общий обработчик для pointer и touch
  const handlePointerDown = (e: React.PointerEvent) => {
    handleStart(e.clientY);
    modalRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    handleEnd(e.clientY);
    modalRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleStart(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      e.preventDefault(); // важно для предотвращения скролла
      handleMove(touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (touch) handleEnd(touch.clientY);
    else if (lastYRef.current !== null) handleEnd(lastYRef.current);
  };

  // Вычисляем текущую позицию модалки
  const collapsedOffset = isMobileView ? window.innerHeight * 0.65 : 0;
  const baseOffset = isExpanded ? 0 : collapsedOffset;
  const rawOffset = baseOffset + dragOffset;
  const translateY = isMobileView
    ? Math.min(Math.max(rawOffset, 0), collapsedOffset)
    : 0;

  return (
    <div
      className={styles["details-overlay"]}
      role="presentation"
      data-prevent-search-close="true"
      onClick={onClose}
    >
      <article
        ref={modalRef}
        className={`${styles["details-modal"]} ${
          isExpanded ? styles["details-modal--expanded"] : ""
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDraggingRef.current
            ? "none"
            : "transform 0.42s cubic-bezier(0.32, 0, 0.07, 1)",
        }}
        // Pointer events (мышь + стилус)
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Touch events (мобильные)
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Граббер — теперь только визуальный индикатор */}
        <div className={styles["details-modal__grabber"]} />

        {/* Остальной контент без изменений */}
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14.9165 0.895491L0.89497 14.917M14.9165 0.895491L14.9165 14.917M14.9165 0.895491L0.89497 0.895491"
                  stroke="#262628"
                  strokeWidth="1.79"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={styles["details-modal__icon-button"]}
              aria-label="Закрыть"
              onClick={onClose}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line
                  x1="1.26572"
                  y1="0.894531"
                  x2="14.6623"
                  y2="14.2911"
                  stroke="#262628"
                  strokeWidth="1.79"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="14.6621"
                  y1="1.26963"
                  x2="1.26557"
                  y2="14.6662"
                  stroke="#262628"
                  strokeWidth="1.79"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles["details-modal__content"]}>
          {/* Весь остальной контент без изменений */}
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
    </div>
  );
};
