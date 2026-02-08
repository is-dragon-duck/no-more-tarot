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
  // Winner info is in the log
  const lastLog = view.log[view.log.length - 1]?.msg || "Game over!";

  return (
    <div className="text-center py-4">
      <p className="text-xl font-bold text-amber-400 mb-2">Game Over!</p>
      <p className="text-stone-300">{lastLog}</p>
      <a href="/" className="inline-block mt-4 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-sm">
        Back to Home
      </a>
    </div>
  );
}
