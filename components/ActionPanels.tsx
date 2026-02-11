"use client";

import { useState } from "react";
import { PlayerView } from "@/lib/types";
import { cardDisplayName, parseCardType, parseCardValue, stagDiscardCost, stagAtonementCost } from "@/lib/cards";
import { CardChip } from "@/components/CardChip";

export function KingdomActionPanel({
  view,
  selectedCards,
  toggleCard,
  clearSelection,
  doAction,
  submitting,
}: {
  view: PlayerView;
  selectedCards: string[];
  toggleCard: (id: string) => void;
  clearSelection: () => void;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const [mode, setMode] = useState<"choose" | "stag">("choose");
  const [selectedStag, setSelectedStag] = useState<string | null>(null);

  const stags = view.myHand.filter((c) => parseCardType(c) === "stag");
  const playableStags = stags.filter((s) => {
    const cost = stagDiscardCost(parseCardValue(s));
    return view.myHand.length - 1 >= cost;
  });

  if (mode === "stag" && selectedStag) {
    const cost = stagDiscardCost(parseCardValue(selectedStag));
    const canConfirm = selectedCards.length === cost && !selectedCards.includes(selectedStag);

    return (
      <div>
        <p className="text-sm text-stone-300 mb-2">
          Playing {cardDisplayName(selectedStag)} — select {cost} card{cost !== 1 ? "s" : ""} to discard:
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setMode("choose"); setSelectedStag(null); clearSelection(); }}
            className="px-3 py-1.5 bg-stone-700 rounded text-sm"
          >
            ← Cancel
          </button>
          <button
            onClick={() => doAction({ action: "playStag", cardId: selectedStag, discardIds: selectedCards })}
            disabled={!canConfirm || submitting}
            className="px-4 py-1.5 bg-green-800 hover:bg-green-700 disabled:opacity-40 rounded text-sm font-medium"
          >
            Confirm Stag ({selectedCards.length}/{cost})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">Kingdom Action — choose one:</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => doAction({ action: "drawCard" })}
          disabled={submitting}
          className="px-4 py-1.5 bg-blue-800 hover:bg-blue-700 disabled:opacity-40 rounded text-sm font-medium"
        >
          Draw from Deck
        </button>
        {view.kingdom.length > 0 && (
          <DraftKingdomButton view={view} doAction={doAction} submitting={submitting} />
        )}
        {playableStags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {playableStags.map((s) => (
              <button
                key={s}
                onClick={() => { setMode("stag"); setSelectedStag(s); clearSelection(); }}
                disabled={submitting}
                className="px-3 py-1.5 bg-green-900 hover:bg-green-800 disabled:opacity-40 rounded text-sm font-medium"
              >
                Play {cardDisplayName(s)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DraftKingdomButton({
  view,
  doAction,
  submitting,
}: {
  view: PlayerView;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const [picking, setPicking] = useState(false);

  if (picking) {
    return (
      <div className="flex gap-1 flex-wrap items-center">
        <span className="text-sm text-stone-400 mr-1">Pick:</span>
        {view.kingdom.map((c) => (
          <button
            key={c}
            onClick={() => { doAction({ action: "draftKingdom", cardId: c }); setPicking(false); }}
            disabled={submitting}
            className="hover:ring-2 ring-amber-400 rounded"
          >
            <CardChip cardId={c} interactive />
          </button>
        ))}
        <button onClick={() => setPicking(false)} className="px-2 py-1 text-xs text-stone-500">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setPicking(true)}
      disabled={submitting}
      className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 rounded text-sm font-medium"
    >
      Draft Kingdom
    </button>
  );
}

export function TerritoryActionPanel({
  view,
  doAction,
  submitting,
}: {
  view: PlayerView;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const nonStags = view.myHand.filter((c) => parseCardType(c) !== "stag");

  if (nonStags.length === 0) {
    return (
      <div>
        <p className="text-sm text-stone-300 mb-2">No playable cards — reveal hand:</p>
        <button
          onClick={() => doAction({ action: "noTerritory" })}
          disabled={submitting}
          className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 rounded text-sm"
        >
          Reveal Hand (burn 1, draw 3)
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">Territory Action — play a card:</p>
      <div className="flex gap-1.5 flex-wrap">
        {nonStags.map((c) => (
          <button
            key={c}
            onClick={() => doAction({ action: "playTerritory", cardId: c })}
            disabled={submitting}
            className="hover:ring-2 ring-amber-400 rounded"
          >
            <CardChip cardId={c} interactive />
          </button>
        ))}
      </div>
    </div>
  );
}

export function KingdomPickPanel({
  view,
  doAction,
  submitting,
  actionName,
}: {
  view: PlayerView;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
  actionName: string;
}) {
  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">Pick a card from the Kingdom:</p>
      <div className="flex gap-1.5 flex-wrap">
        {view.kingdom.map((c) => (
          <button
            key={c}
            onClick={() => doAction({ action: actionName, cardId: c })}
            disabled={submitting}
            className="hover:ring-2 ring-amber-400 rounded"
          >
            <CardChip cardId={c} interactive />
          </button>
        ))}
      </div>
    </div>
  );
}

export function HuntResponsePanel({
  view,
  doAction,
  submitting,
}: {
  view: PlayerView;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const pending = view.pendingAction as { type: "huntResponse"; huntTotalValue: number };
  const huntVal = pending.huntTotalValue;
  const healings = view.myHand.filter((c) => parseCardType(c) === "healing");
  const magis = view.myHand.filter((c) => parseCardType(c) === "magi");

  const [selectedHealing, setSelectedHealing] = useState<string | null>(null);
  const [useMagi, setUseMagi] = useState(false);

  // Territory healing bonus (applies to all Healing cards)
  const myInfo = view.players.find((p) => p.isMe)!;
  const healInTerritory = myInfo.territory.filter((c) => parseCardType(c) === "healing").length;
  const magiAsHealing = myInfo.territoryMagiAsHealing.length;
  const territoryBonus = healInTerritory + magiAsHealing;

  // Calculate selected card's total
  let healingTotal = 0;
  if (selectedHealing) {
    healingTotal = parseCardValue(selectedHealing) + territoryBonus + (useMagi ? 6 : 0);
  }

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">
        Hunt incoming! <span className="text-red-400 font-semibold">(value {huntVal})</span> — Avert or accept?
        {territoryBonus > 0 && <span className="text-stone-500 text-xs ml-1">(your Healing bonus: +{territoryBonus})</span>}
      </p>
      <div className="space-y-2">
        {healings.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 mb-1">Select Healing card to avert:</p>
            <div className="flex gap-1.5 flex-wrap">
              {healings.map((h) => {
                const base = parseCardValue(h);
                const total = base + territoryBonus;
                const canAvert = total >= huntVal;
                const canAvertWithMagi = total + 6 >= huntVal;
                return (
                  <button
                    key={h}
                    onClick={() => setSelectedHealing(selectedHealing === h ? null : h)}
                    className={`rounded flex items-center gap-1 ${selectedHealing === h ? "ring-2 ring-amber-400" : ""}`}
                  >
                    <CardChip cardId={h} interactive />
                    <span className={`text-[10px] font-medium ${canAvert ? "text-green-400" : canAvertWithMagi ? "text-amber-400" : "text-stone-600"}`}>
                      ={total}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedHealing && magis.length > 0 && (
              <label className="flex items-center gap-2 mt-1 text-sm text-stone-300">
                <input
                  type="checkbox"
                  checked={useMagi}
                  onChange={(e) => setUseMagi(e.target.checked)}
                  className="rounded"
                />
                Add Magi (+6) → total {parseCardValue(selectedHealing) + territoryBonus + 6}
              </label>
            )}
            {selectedHealing && (
              <p className="text-xs mt-1 text-stone-400">
                Healing {parseCardValue(selectedHealing)}{territoryBonus > 0 ? ` + ${territoryBonus} territory` : ""}{useMagi ? " + 6 Magi" : ""} = <span className="font-semibold text-stone-200">{healingTotal}</span>{" "}vs Hunt <span className="font-semibold text-stone-200">{huntVal}</span>{" — "}
                {healingTotal >= huntVal ? (
                  <span className="text-green-400 font-semibold">Will avert!</span>
                ) : (
                  <span className="text-red-400 font-semibold">Not enough</span>
                )}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {selectedHealing && (
            <button
              onClick={() =>
                doAction({
                  action: "huntResponse",
                  healingId: selectedHealing,
                  magiId: useMagi ? magis[0] : null,
                })
              }
              disabled={submitting}
              className="px-4 py-1.5 bg-blue-800 hover:bg-blue-700 disabled:opacity-40 rounded text-sm font-medium"
            >
              Attempt Avert
            </button>
          )}
          <button
            onClick={() => doAction({ action: "huntResponse", healingId: null, magiId: null })}
            disabled={submitting}
            className="px-4 py-1.5 bg-red-900 hover:bg-red-800 disabled:opacity-40 rounded text-sm"
          >
            Accept (discard cards)
          </button>
        </div>
      </div>
    </div>
  );
}

export function DiscardPanel({
  view,
  selectedCards,
  toggleCard,
  clearSelection,
  doAction,
  submitting,
  count,
  actionName,
  reason,
}: {
  view: PlayerView;
  selectedCards: string[];
  toggleCard: (id: string) => void;
  clearSelection: () => void;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
  count: number;
  actionName: string;
  reason: string;
}) {
  // Atonement warnings for selected Stags
  const stagWarnings = selectedCards
    .filter((c) => parseCardType(c) === "stag")
    .map((c) => {
      const val = parseCardValue(c);
      const myInfo = view.players.find((p) => p.isMe)!;
      const healCount = myInfo.territory.filter((t) => parseCardType(t) === "healing").length;
      const magiHealCount = myInfo.territoryMagiAsHealing.length;
      const totalHeal = healCount + magiHealCount;
      if (totalHeal >= val) {
        return { card: cardDisplayName(c), text: "covered by Healing", warn: false };
      }
      return { card: cardDisplayName(c), text: `atone ${stagAtonementCost(val)}`, warn: true };
    });

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">
        {reason}: Select {count} card{count !== 1 ? "s" : ""} to discard ({selectedCards.length}/{count}):
      </p>
      {stagWarnings.length > 0 && (
        <div className="text-xs mb-2 space-y-0.5">
          {stagWarnings.map((w, i) => (
            <p key={i} className={w.warn ? "text-amber-400" : "text-green-500"}>
              ⚠ {w.card}: {w.text}
            </p>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            doAction({ action: actionName, cardIds: selectedCards });
            clearSelection();
          }}
          disabled={selectedCards.length !== count || submitting}
          className="px-4 py-1.5 bg-red-800 hover:bg-red-700 disabled:opacity-40 rounded text-sm font-medium"
        >
          Confirm Discard
        </button>
        {selectedCards.length > 0 && (
          <button onClick={clearSelection} className="px-3 py-1 text-xs text-stone-500">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function MagiChoicePanel({
  magiSplit,
  setMagiSplit,
  doAction,
  submitting,
}: {
  magiSplit: { drawTop: number; drawBottom: number; placeBottom: number };
  setMagiSplit: (s: { drawTop: number; drawBottom: number; placeBottom: number }) => void;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const total = magiSplit.drawTop + magiSplit.drawBottom + magiSplit.placeBottom;

  function adjust(field: "drawTop" | "drawBottom" | "placeBottom", delta: number) {
    const newVal = Math.max(0, Math.min(6, magiSplit[field] + delta));
    const newSplit = { ...magiSplit, [field]: newVal };
    const newTotal = newSplit.drawTop + newSplit.drawBottom + newSplit.placeBottom;
    if (newTotal <= 6) setMagiSplit(newSplit);
  }

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">Magi — split 6 effects:</p>
      <div className="space-y-1 mb-2">
        {(["drawTop", "drawBottom", "placeBottom"] as const).map((field) => (
          <div key={field} className="flex items-center gap-2 text-sm">
            <button onClick={() => adjust(field, -1)} className="w-6 h-6 bg-stone-700 rounded text-center">-</button>
            <span className="w-4 text-center">{magiSplit[field]}</span>
            <button onClick={() => adjust(field, 1)} className="w-6 h-6 bg-stone-700 rounded text-center">+</button>
            <span className="text-stone-400">
              {field === "drawTop" ? "Draw from top" : field === "drawBottom" ? "Draw from bottom" : "Place from hand to bottom"}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() =>
          doAction({
            action: "magiChoice",
            drawTop: magiSplit.drawTop,
            drawBottom: magiSplit.drawBottom,
            placeBottom: magiSplit.placeBottom,
          })
        }
        disabled={total !== 6 || submitting}
        className="px-4 py-1.5 bg-purple-800 hover:bg-purple-700 disabled:opacity-40 rounded text-sm font-medium"
      >
        Confirm Split ({total}/6)
      </button>
    </div>
  );
}

export function MagiPlacePanel({
  view,
  selectedCards,
  toggleCard,
  clearSelection,
  doAction,
  submitting,
  count,
}: {
  view: PlayerView;
  selectedCards: string[];
  toggleCard: (id: string) => void;
  clearSelection: () => void;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
  count: number;
}) {
  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">
        Magi — place {count} card{count !== 1 ? "s" : ""} on the bottom of the deck ({selectedCards.length}/{count}):
      </p>
      <p className="text-xs text-stone-500 mb-2">
        These cards are not discarded — no atonement needed for Stags.
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            doAction({ action: "magiPlaceCards", cardIds: selectedCards });
            clearSelection();
          }}
          disabled={selectedCards.length !== count || submitting}
          className="px-4 py-1.5 bg-violet-800 hover:bg-violet-700 disabled:opacity-40 rounded text-sm font-medium"
        >
          Place on Bottom ({selectedCards.length}/{count})
        </button>
        {selectedCards.length > 0 && (
          <button onClick={clearSelection} className="px-3 py-1 text-xs text-stone-500">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function TitheContributePanel({
  view,
  pending,
  doAction,
  submitting,
}: {
  view: PlayerView;
  pending: { type: "titheContribute"; contributionsSoFar: number };
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const canContribute = view.myContributionsRemaining >= 1 && pending.contributionsSoFar < 2;
  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">
        Tithe: Contribute 1 to discard 2 and draw 2 again? ({pending.contributionsSoFar}/2 contributed)
      </p>
      <div className="flex gap-2">
        {canContribute && (
          <button
            onClick={() => doAction({ action: "titheContribute", contribute: true })}
            disabled={submitting}
            className="px-4 py-1.5 bg-yellow-800 hover:bg-yellow-700 disabled:opacity-40 rounded text-sm font-medium"
          >
            Contribute (cost: 1 coin)
          </button>
        )}
        <button
          onClick={() => doAction({ action: "titheContribute", contribute: false })}
          disabled={submitting}
          className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 rounded text-sm"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export function KingCommandResponsePanel({
  view,
  doAction,
  submitting,
}: {
  view: PlayerView;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const stags = view.myHand.filter((c) => parseCardType(c) === "stag");

  if (stags.length === 0) {
    return (
      <div>
        <p className="text-sm text-stone-300 mb-2">King&apos;s Command — you have no stags.</p>
        <button
          onClick={() => doAction({ action: "kingCommandResponse", stagId: null })}
          disabled={submitting}
          className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 rounded text-sm"
        >
          Reveal (no stags)
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">King&apos;s Command — you must discard a stag:</p>
      <div className="flex gap-1.5 flex-wrap">
        {stags.map((s) => (
          <button
            key={s}
            onClick={() => doAction({ action: "kingCommandResponse", stagId: s })}
            disabled={submitting}
            className="hover:ring-2 ring-red-400 rounded"
          >
            <CardChip cardId={s} interactive />
          </button>
        ))}
      </div>
    </div>
  );
}

export function KingCommandCollectPanel({
  view,
  selectedCards,
  toggleCard,
  clearSelection,
  doAction,
  submitting,
}: {
  view: PlayerView;
  selectedCards: string[];
  toggleCard: (id: string) => void;
  clearSelection: () => void;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  const pending = view.pendingAction as { type: "kingCommandCollect"; discardedStags: string[] };
  const stags = pending.discardedStags;

  return (
    <div>
      <p className="text-sm text-stone-300 mb-2">
        King&apos;s Command — select stags to take (click to toggle, then confirm):
      </p>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {stags.map((s) => (
          <button
            key={s}
            onClick={() => toggleCard(s)}
            className={`rounded ${selectedCards.includes(s) ? "ring-2 ring-amber-400" : ""}`}
          >
            <CardChip cardId={s} interactive />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { doAction({ action: "kingCommandCollect", stagIds: selectedCards }); clearSelection(); }}
          disabled={submitting}
          className="px-4 py-1.5 bg-green-800 hover:bg-green-700 disabled:opacity-40 rounded text-sm font-medium"
        >
          Take {selectedCards.length} stag{selectedCards.length !== 1 ? "s" : ""}
        </button>
        <button
          onClick={() => { doAction({ action: "kingCommandCollect", stagIds: [] }); clearSelection(); }}
          disabled={submitting}
          className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 rounded text-sm"
        >
          Take none
        </button>
      </div>
    </div>
  );
}

export function WinPanel({ view }: { view: PlayerView }) {
  const winnerPlayer = view.players.find((p) => {
    // Match by checking who the server declared winner
    // Winner ID is in view.winner; match against player names via log
    return false; // We'll use a different approach
  });

  const reason = view.winReason;

  // Compute scores for all players (useful for deckOut, informative otherwise)
  const scores = view.players
    .filter((p) => !p.eliminated)
    .map((p) => {
      let stagCount = 0, stagPoints = 0, tithes = 0, magis = 0, healings = 0, hunts = 0, kc = 0;
      for (const c of p.territory) {
        const t = parseCardType(c);
        if (t === "stag") { stagCount++; stagPoints += parseCardValue(c); }
        else if (t === "tithe") tithes++;
        else if (t === "magi") magis++;
        else if (t === "healing") healings++;
        else if (t === "hunt") hunts++;
        else if (t === "kingscommand") kc++;
      }
      const score = stagCount + (3 * tithes) + p.contributionsMade + kc;
      return { name: p.name, isMe: p.isMe, score, stagCount, stagPoints, tithes, magis, healings, hunts, kc, contributions: p.contributionsMade + p.ante };
    })
    .sort((a, b) => b.score - a.score);

  // Find winner name from the last log entries
  const lastLogs = view.log.slice(-5);
  const winLog = lastLogs.find((l) => l.msg.includes("wins"));
  const winnerName = winLog?.msg?.match(/^(.+?) wins/)?.[1] || "Someone";
  const iWon = scores.length > 0 && scores[0].isMe;

  return (
    <div className="py-4 max-w-md mx-auto">
      {/* Headline */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-amber-400 mb-1">
          {iWon ? "🎉 You Win!" : "Game Over!"}
        </p>
        <p className="text-stone-300 text-sm">
          {reason === "stag18" && `${winnerName} reached 18 Stag Points!`}
          {reason === "lastStanding" && `${winnerName} is the last player standing!`}
          {reason === "deckOut" && "The deck ran out — final scores:"}
        </p>
      </div>

      {/* Score table (always shown, most useful for deckOut) */}
      <div className="bg-stone-800/60 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-stone-500 text-xs border-b border-stone-700">
              <th className="text-left px-3 py-1.5">#</th>
              <th className="text-left px-3 py-1.5">Player</th>
              {reason === "deckOut" && (
                <>
                  <th className="text-center px-2 py-1.5" title="Stags in territory">♠</th>
                  <th className="text-center px-2 py-1.5" title="Tithes (×3 each)">◆</th>
                  <th className="text-center px-2 py-1.5" title="Contributions made">🪙</th>
                  <th className="text-center px-2 py-1.5" title="King's Commands (+1 each)">♚</th>
                </>
              )}
              {reason === "stag18" && (
                <th className="text-center px-2 py-1.5">♠ Points</th>
              )}
              <th className="text-right px-3 py-1.5">Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr
                key={s.name}
                className={`border-b border-stone-700/50 ${i === 0 ? "bg-amber-900/20" : ""} ${s.isMe ? "font-medium" : ""}`}
              >
                <td className="px-3 py-1.5 text-stone-500">{i + 1}</td>
                <td className="px-3 py-1.5">
                  {s.name}
                  {s.isMe && <span className="text-amber-400 text-xs ml-1">(you)</span>}
                  {i === 0 && <span className="text-amber-400 text-xs ml-1">👑</span>}
                </td>
                {reason === "deckOut" && (
                  <>
                    <td className="text-center px-2 py-1.5 text-emerald-400">{s.stagCount}</td>
                    <td className="text-center px-2 py-1.5 text-amber-400">
                      {s.tithes > 0 ? `${s.tithes}(+${s.tithes * 3})` : "—"}
                    </td>
                    <td className="text-center px-2 py-1.5 text-stone-400">{s.contributions}</td>
                    <td className="text-center px-2 py-1.5 text-orange-400">{s.kc > 0 ? s.kc : "—"}</td>
                  </>
                )}
                {reason === "stag18" && (
                  <td className="text-center px-2 py-1.5 text-emerald-400">{s.stagPoints}</td>
                )}
                <td className="text-right px-3 py-1.5 font-bold text-stone-200">{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Eliminated players */}
      {view.players.some((p) => p.eliminated) && (
        <div className="text-xs text-stone-600 mb-4 text-center">
          Eliminated: {view.players.filter((p) => p.eliminated).map((p) => p.name).join(", ")}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <a
          href="/"
          className="px-5 py-2 bg-amber-700 hover:bg-amber-600 rounded font-medium text-sm"
        >
          Play Again
        </a>
        <a
          href="/"
          className="px-5 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm"
        >
          Home
        </a>
      </div>
    </div>
  );
}
