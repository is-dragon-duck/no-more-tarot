"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseCardType, parseCardValue, stagDiscardCost, stagAtonementCost, type CardType } from "@/lib/cards";

// ---- Per-type visuals ----

const STYLES: Record<CardType, { bg: string; border: string; text: string; accent: string; icon: string; label: string }> = {
  stag:         { bg: "bg-emerald-950", border: "border-emerald-700", text: "text-emerald-100",  accent: "text-emerald-400", icon: "♠", label: "Stag" },
  hunt:         { bg: "bg-red-950",     border: "border-red-700",     text: "text-red-100",      accent: "text-red-400",     icon: "♣", label: "Hunt" },
  healing:      { bg: "bg-sky-950",     border: "border-sky-700",     text: "text-sky-100",      accent: "text-sky-400",     icon: "♥", label: "Healing" },
  magi:         { bg: "bg-violet-950",  border: "border-violet-700",  text: "text-violet-100",   accent: "text-violet-400",  icon: "✦", label: "Magi" },
  tithe:        { bg: "bg-amber-950",   border: "border-amber-700",   text: "text-amber-100",    accent: "text-amber-400",   icon: "◆", label: "Tithe" },
  kingscommand: { bg: "bg-orange-950",  border: "border-orange-600",  text: "text-orange-100",   accent: "text-orange-400",  icon: "♚", label: "Command" },
};

// ---- Tooltip rules text ----

function tooltipText(cardId: string): string {
  const type = parseCardType(cardId);
  const value = parseCardValue(cardId);
  switch (type) {
    case "stag": {
      const cost = stagDiscardCost(value);
      const atone = stagAtonementCost(value);
      return `STAG ${value}\nKingdom action · Discard ${cost} card${cost > 1 ? "s" : ""} to play.\nWorth ${value} toward the 18-point goal.\nIf discarded from hand: atone ${atone}\n(unless your Healing ≥ ${value}).`;
    }
    case "hunt":
      return `HUNT ${value}\nTerritory action · Opponents discard 2 or\navert with Healing ≥ total Hunt value.\nYou draw 2 (−1 per averter).\nEach Hunt in territory adds +3 to value.`;
    case "healing":
      return `HEALING ${value}\nTerritory action · No on-play effect.\nReveal to avert a Hunt (need total ≥ Hunt).\nEach Healing in territory adds +1 value.\nPrevents Stag atonement if total ≥ Stag value.`;
    case "magi":
      return `MAGI\nTerritory action · Split 6 effects between:\n draw top, draw bottom, place hand→bottom.\n+1 hand size in territory.\nOR reveal with Healing to avert Hunt (+6).`;
    case "tithe":
      return `TITHE\nTerritory action · Everyone discards 2, draws 2.\nContribute (up to 2×) to repeat for yourself.\nIf contributed: +3 score on deck-out.`;
    case "kingscommand":
      return `KING'S COMMAND\nTerritory action · Each opponent must discard\na Stag (atoning) or reveal they have none.\nYou may take any discarded Stags.\nIn territory: Hunts discard/draw +1.`;
  }
}

// ---- Component ----

export function CardChip({
  cardId,
  small,
  selected,
  onClick,
  interactive,
}: {
  cardId: string;
  small?: boolean;
  selected?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const type = parseCardType(cardId);
  const value = parseCardValue(cardId);
  const s = STYLES[type] || STYLES.stag;
  const hasValue = type === "stag" || type === "hunt" || type === "healing";

  const clickable = interactive || !!onClick;
  const ring = selected ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-900" : "";
  const cursor = clickable ? "cursor-pointer" : "";
  const hover = clickable ? "hover:brightness-125" : "";

  // Tooltip state
  const [tip, setTip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const showTip = useCallback(() => { timer.current = setTimeout(() => setTip(true), 420); }, []);
  const hideTip = useCallback(() => { if (timer.current) clearTimeout(timer.current); setTip(false); }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (small) {
    // ---- Compact territory card ----
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={showTip}
        onMouseLeave={hideTip}
        className={`relative inline-flex flex-col items-center justify-center ${s.bg} ${s.border} border rounded-md select-none ${ring} ${cursor} ${hover}`}
        style={{ width: 52, height: 40 }}
      >
        <span className={`${s.accent} text-[10px] leading-none`}>{s.icon}</span>
        {hasValue ? (
          <span className={`${s.text} text-sm font-bold leading-tight`}>{value}</span>
        ) : (
          <span className={`${s.text} text-[8px] font-semibold leading-tight`}>{s.label}</span>
        )}
        {tip && <Tooltip text={tooltipText(cardId)} anchor={cardRef} />}
      </div>
    );
  }

  // ---- Full hand card ----
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      className={`relative inline-flex flex-col ${s.bg} ${s.border} border-2 rounded-lg select-none transition-transform ${ring} ${cursor} ${hover} ${clickable ? "active:scale-95" : ""}`}
      style={{ width: 72, height: 104 }}
    >
      {/* Top-left corner */}
      <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none`}>
        <span className={`${s.accent} text-[11px]`}>{s.icon}</span>
        {hasValue && <span className={`${s.text} text-[10px] font-bold`}>{value}</span>}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180`}>
        <span className={`${s.accent} text-[11px]`}>{s.icon}</span>
        {hasValue && <span className={`${s.text} text-[10px] font-bold`}>{value}</span>}
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {hasValue ? (
          <>
            <span className={`${s.accent} text-2xl font-black leading-none`}>{value}</span>
            <span className={`${s.text} text-[9px] mt-0.5 opacity-60`}>{s.label}</span>
          </>
        ) : (
          <>
            <span className={`${s.accent} text-lg leading-none`}>{s.icon}</span>
            <span className={`${s.text} text-[10px] font-bold mt-0.5`}>{s.label}</span>
          </>
        )}
      </div>

      {tip && <Tooltip text={tooltipText(cardId)} anchor={cardRef} />}
    </div>
  );
}

// ---- Tooltip ----

function Tooltip({ text, anchor }: { text: string; anchor: React.RefObject<HTMLDivElement | null> }) {
  const [above, setAbove] = useState(true);

  useEffect(() => {
    if (anchor.current) {
      const r = anchor.current.getBoundingClientRect();
      setAbove(r.top > window.innerHeight * 0.4);
    }
  }, [anchor]);

  return (
    <div
      className={`absolute ${above ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 -translate-x-1/2 z-50 w-52 bg-stone-800 border border-stone-600 rounded-lg shadow-xl p-2.5 text-[11px] leading-relaxed text-stone-200 whitespace-pre-line pointer-events-none`}
    >
      {text}
    </div>
  );
}
