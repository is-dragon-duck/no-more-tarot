"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/lib/useGame";
import { PlayerView, PublicPlayerInfo } from "@/lib/types";
import { parseCardType, parseCardValue } from "@/lib/cards";
import { CardChip } from "@/components/CardChip";
import { RulesDrawer } from "@/components/RulesDrawer";
import {
  KingdomActionPanel,
  TerritoryActionPanel,
  KingdomPickPanel,
  HuntResponsePanel,
  DiscardPanel,
  MagiChoicePanel,
  MagiPlacePanel,
  TitheContributePanel,
  KingCommandResponsePanel,
  KingCommandCollectPanel,
  WinPanel,
} from "@/components/ActionPanels";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const playerId =
    typeof window !== "undefined"
      ? localStorage.getItem(`player-${gameId}`)
      : null;

  const { view, error, submitting, submitAction, connected, needsAction, justBecameMyTurn } =
    useGame(gameId, playerId);

  if (!playerId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-red-400">No player session found.</p>
        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-stone-700 rounded">
          Back to Home
        </button>
      </main>
    );
  }

  if (!view) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-stone-400">{error || "Loading game..."}</p>
      </main>
    );
  }

  return (
    <GameBoard
      view={view}
      error={error}
      submitting={submitting}
      submitAction={submitAction}
      connected={connected}
      needsAction={needsAction}
      justBecameMyTurn={justBecameMyTurn}
    />
  );
}

// ============================================================
// Main Game Board
// ============================================================

function GameBoard({
  view,
  error,
  submitting,
  submitAction,
  connected,
  needsAction,
  justBecameMyTurn,
}: {
  view: PlayerView;
  error: string;
  submitting: boolean;
  submitAction: (body: Record<string, unknown>) => Promise<void>;
  connected: boolean;
  needsAction: boolean;
  justBecameMyTurn: boolean;
}) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [magiSplit, setMagiSplit] = useState({ drawTop: 3, drawBottom: 3, placeBottom: 0 });
  const [soundEnabled, setSoundEnabled] = useState(false);

  const actions = view.availableActions;
  const pending = view.pendingAction;
  const isFinished = view.phase === "finished";

  // ---- M9: Tab title ----
  useEffect(() => {
    if (isFinished) {
      document.title = "Game Over — No More Tarot";
    } else if (needsAction) {
      document.title = "🔴 Your Turn! — No More Tarot";
    } else {
      document.title = `Waiting — No More Tarot`;
    }
    return () => { document.title = "No More Tarot"; };
  }, [needsAction, isFinished]);

  // ---- M9: Audio ping when it becomes your turn ----
  const audioRef = useRef<AudioContext | null>(null);
  const playPing = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not available
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (justBecameMyTurn) playPing();
  }, [justBecameMyTurn, playPing]);

  function toggleCard(cardId: string) {
    setSelectedCards((prev) =>
      prev.includes(cardId) ? prev.filter((c) => c !== cardId) : [...prev, cardId]
    );
  }

  function clearSelection() {
    setSelectedCards([]);
  }

  async function doAction(body: Record<string, unknown>) {
    clearSelection();
    await submitAction(body);
  }

  // ---- M9: Contextual waiting message ----
  const waitingMessage = getWaitingMessage(view);

  // ---- Determine what UI to show ----
  let actionPanel: React.ReactNode = null;

  if (isFinished) {
    // WinPanel rendered inline, not in action bar
  } else if (actions.length === 0 && !pending) {
    actionPanel = (
      <div className="text-stone-400 text-sm py-2">
        {waitingMessage}
      </div>
    );
  } else if (actions.includes("drawCard") || actions.includes("draftKingdom") || actions.includes("playStag")) {
    actionPanel = (
      <KingdomActionPanel
        view={view}
        selectedCards={selectedCards}
        toggleCard={toggleCard}
        clearSelection={clearSelection}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("playTerritory") || actions.includes("noTerritory")) {
    actionPanel = (
      <TerritoryActionPanel
        view={view}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("draftKingdomPick") || actions.includes("stagKingdomPick")) {
    actionPanel = (
      <KingdomPickPanel
        view={view}
        doAction={doAction}
        submitting={submitting}
        actionName={actions.includes("draftKingdomPick") ? "draftKingdomPick" : "stagKingdomPick"}
      />
    );
  } else if (actions.includes("huntResponse")) {
    actionPanel = (
      <HuntResponsePanel
        view={view}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("huntDiscard") || actions.includes("titheDiscard") || actions.includes("discardToHandLimit") || actions.includes("discardForCost")) {
    const discardAction = actions[0];
    let count = 2;
    if (pending?.type === "discardToHandLimit") count = pending.mustDiscard;
    else if (pending?.type === "huntDiscard") count = pending.discardsPerPlayer;
    else if (pending?.type === "discardForCost") count = pending.mustDiscard;
    count = Math.min(count, view.myHand.length);
    actionPanel = (
      <DiscardPanel
        view={view}
        selectedCards={selectedCards}
        toggleCard={toggleCard}
        clearSelection={clearSelection}
        doAction={doAction}
        submitting={submitting}
        count={count}
        actionName={discardAction}
        reason={pending?.type === "huntDiscard" ? "Hunt" : pending?.type === "titheDiscard" ? "Tithe" : pending?.type === "discardToHandLimit" ? "Hand limit" : "Cost"}
      />
    );
  } else if (actions.includes("magiChoice")) {
    actionPanel = (
      <MagiChoicePanel
        magiSplit={magiSplit}
        setMagiSplit={setMagiSplit}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("magiPlaceCards")) {
    const count = pending?.type === "magiPlaceCards" ? pending.placeBottomCount : 1;
    actionPanel = (
      <MagiPlacePanel
        view={view}
        selectedCards={selectedCards}
        toggleCard={toggleCard}
        clearSelection={clearSelection}
        doAction={doAction}
        submitting={submitting}
        count={count}
      />
    );
  } else if (actions.includes("titheContribute")) {
    actionPanel = (
      <TitheContributePanel
        view={view}
        pending={pending as { type: "titheContribute"; contributionsSoFar: number }}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("kingCommandResponse")) {
    actionPanel = (
      <KingCommandResponsePanel
        view={view}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.includes("kingCommandCollect")) {
    actionPanel = (
      <KingCommandCollectPanel
        view={view}
        selectedCards={selectedCards}
        toggleCard={toggleCard}
        clearSelection={clearSelection}
        doAction={doAction}
        submitting={submitting}
      />
    );
  } else if (actions.length > 0) {
    actionPanel = (
      <div className="text-stone-400 text-sm">
        Available: {actions.join(", ")}
      </div>
    );
  }

  return (
    <main className={`min-h-screen p-3 max-w-5xl mx-auto ${isFinished ? "pb-8" : "pb-64"}`}>
      {/* M9: Reconnection banner */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-900/90 text-red-200 text-xs text-center py-1.5 backdrop-blur">
          Reconnecting to server…
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-stone-300">Game {view.gameId}</h1>
        <div className="flex items-center gap-2">
          {/* M9: Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-2 py-1 text-xs rounded-md border ${
              soundEnabled
                ? "bg-amber-900/40 border-amber-700 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-500"
            }`}
            title={soundEnabled ? "Sound on" : "Sound off"}
          >
            {soundEnabled ? "🔔" : "🔕"}
          </button>
          {/* M10: Rules drawer */}
          <RulesDrawer />
          {/* Turn status */}
          <div className="text-sm">
            {view.isMyTurn && !isFinished ? (
              <span className="text-amber-400 font-semibold">Your turn!</span>
            ) : isFinished ? (
              <span className="text-green-400 font-semibold">Game Over</span>
            ) : (
              <span className="text-stone-500 text-xs">{waitingMessage}</span>
            )}
          </div>
        </div>
      </div>

      {/* M10: Turn phase indicator */}
      <div className="flex gap-3 mb-3 text-xs">
        <PhaseIndicator phase={view.turnPhase} isFinished={isFinished} />
        <span className="text-stone-600">|</span>
        <span className="text-stone-500">Deck: {view.deckCount}</span>
        <span className="text-stone-500">Discard: {view.discardPile.length}</span>
        <span className="text-stone-500">Burned: {view.burnedCount}</span>
      </div>

      {/* Kingdom */}
      <section className="mb-3">
        <h2 className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Kingdom</h2>
        <div className="flex gap-2 flex-wrap min-h-[2.5rem]">
          {view.kingdom.length > 0 ? (
            view.kingdom.map((cardId) => (
              <CardChip key={cardId} cardId={cardId} />
            ))
          ) : (
            <span className="text-stone-600 text-sm">Empty</span>
          )}
        </div>
      </section>

      {/* Players */}
      <section className="mb-3 space-y-1.5">
        <h2 className="text-xs text-stone-500 uppercase tracking-wide">Players</h2>
        {view.players.map((p) => (
          <PlayerPanel
            key={p.seatIndex}
            player={p}
            isCurrentTurn={p.seatIndex === view.currentPlayerSeat && !isFinished}
          />
        ))}
      </section>

      {/* My Hand */}
      <section className="mb-3">
        <h2 className="text-xs text-stone-500 mb-1 uppercase tracking-wide">
          Your Hand{" "}
          <span className={
            view.myHand.length > view.myHandLimit
              ? "text-red-400 font-semibold"
              : view.myHand.length === view.myHandLimit
              ? "text-amber-500"
              : "text-stone-500"
          }>
            ({view.myHand.length}/{view.myHandLimit})
            {view.myHand.length > view.myHandLimit && " ⚠ over limit"}
          </span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {view.myHand.length > 0 ? (
            view.myHand.map((cardId) => {
              const isSelected = selectedCards.includes(cardId);
              return (
                <CardChip
                  key={cardId}
                  cardId={cardId}
                  selected={isSelected}
                  onClick={() => toggleCard(cardId)}
                  interactive
                />
              );
            })
          ) : (
            <span className="text-stone-600 text-sm">Empty hand</span>
          )}
        </div>
      </section>

      {/* M10: Error toast (auto-dismissing) */}
      {error && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 bg-red-900/95 border border-red-700 text-red-200 text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {error}
        </div>
      )}

      {/* Win Panel (full width, in main area) */}
      {isFinished && (
        <section className="mb-3">
          <WinPanel view={view} />
        </section>
      )}

      {/* Action panel (sticky at bottom, hidden when game over) */}
      {!isFinished && (
        <div className={`fixed bottom-0 left-0 right-0 bg-stone-900/95 border-t border-stone-700 p-3 backdrop-blur transition-all ${
          needsAction ? "border-t-amber-700/50" : ""
        }`}>
          {/* M9: Action bar pulse when you need to act */}
          {needsAction && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 animate-pulse" />
          )}
          <div className="max-w-5xl mx-auto">{actionPanel}</div>
        </div>
      )}

      {/* Game Log */}
      <section className="mb-3">
        <h2 className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Log</h2>
        <div className="bg-stone-800/40 rounded p-2 max-h-40 overflow-y-auto text-xs space-y-0.5">
          {view.log.slice().reverse().map((entry, i) => (
            <p key={i} className={logColor(entry.msg)}>{entry.msg}</p>
          ))}
        </div>
      </section>
    </main>
  );
}

// ============================================================
// M9: Contextual waiting message
// ============================================================

function getWaitingMessage(view: PlayerView): string {
  const pending = view.pendingAction;
  if (!pending) {
    if (view.isMyTurn) return "Your turn!";
    return `Waiting for ${view.currentPlayerName}…`;
  }

  const findName = (seat: number) => view.players.find((p) => p.seatIndex === seat)?.name || "someone";

  switch (pending.type) {
    case "draftKingdom":
      return `Waiting for ${findName(pending.currentDrafterSeat)} to pick from Kingdom…`;
    case "huntResponse":
      return `Waiting for ${findName(pending.respondingSeat)} to respond to Hunt…`;
    case "huntDiscard":
      return `Waiting for ${findName(pending.currentDiscardSeat)} to discard for Hunt…`;
    case "magiChoice":
      return `Waiting for ${findName(pending.playerSeat)} to choose Magi split…`;
    case "magiPlaceCards":
      return `Waiting for ${findName(pending.playerSeat)} to place cards on deck…`;
    case "titheDiscard":
      return `Waiting for ${findName(pending.currentDiscardSeat)} to discard for Tithe…`;
    case "titheContribute":
      return `Waiting for ${findName(pending.playerSeat)} to decide on Tithe contribution…`;
    case "kingCommandResponse":
      return `Waiting for ${findName(pending.respondingSeat)} to respond to King's Command…`;
    case "kingCommandCollect":
      return `Waiting for ${findName(pending.commandPlayerSeat)} to collect Stags…`;
    case "stagKingdomDraft":
      return `Waiting for ${findName(pending.currentDrafterSeat)} to pick from Kingdom…`;
    case "stagKingdomPickSelf":
      return `Waiting for ${findName(pending.stagPlayerSeat)} to pick from Kingdom…`;
    case "discardToHandLimit":
      return `Waiting for ${findName(pending.playerSeat)} to discard to hand limit…`;
    case "discardForCost":
      return `Waiting for ${findName(pending.playerSeat)} to discard…`;
    default:
      return `Waiting for ${view.currentPlayerName}…`;
  }
}

// ============================================================
// M10: Turn Phase Indicator
// ============================================================

function PhaseIndicator({ phase, isFinished }: { phase: string; isFinished: boolean }) {
  if (isFinished) return <span className="text-green-500 font-medium">Game Over</span>;

  const phases = [
    { id: "refreshKingdom", label: "Refresh" },
    { id: "kingdomAction", label: "Kingdom" },
    { id: "territoryAction", label: "Territory" },
    { id: "endOfTurn", label: "End Turn" },
  ];

  return (
    <div className="flex items-center gap-1">
      {phases.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-stone-700">›</span>}
          <span
            className={`${
              phase === p.id
                ? "text-amber-400 font-semibold"
                : "text-stone-600"
            }`}
          >
            {p.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// M10: Log color coding
// ============================================================

function logColor(msg: string): string {
  if (msg.includes("wins") || msg.includes("18 Stag") || msg.includes("Stag Points")) return "text-emerald-400";
  if (msg.includes("Hunt") || msg.includes("discard")) return "text-red-400/80";
  if (msg.includes("avert") || msg.includes("Healing")) return "text-sky-400/80";
  if (msg.includes("Magi")) return "text-violet-400/80";
  if (msg.includes("Tithe") || msg.includes("contribute")) return "text-amber-400/80";
  if (msg.includes("Command") || msg.includes("King")) return "text-orange-400/80";
  if (msg.includes("Stag")) return "text-emerald-400/80";
  if (msg.startsWith("---")) return "text-stone-500 font-medium";
  return "text-stone-400";
}

// ============================================================
// Player Panel with summarized territory
// ============================================================

function territoryStats(territory: string[], magiAsHealing: string[]) {
  let stagPoints = 0, stagCount = 0, hunts = 0, healings = 0, magis = 0, tithes = 0, kc = 0;
  const magiHealSet = new Set(magiAsHealing);
  for (const c of territory) {
    const t = parseCardType(c);
    if (t === "stag") { stagCount++; stagPoints += parseCardValue(c); }
    else if (t === "hunt") hunts++;
    else if (t === "healing") healings++;
    else if (t === "magi") { if (magiHealSet.has(c)) healings++; else magis++; }
    else if (t === "tithe") tithes++;
    else if (t === "kingscommand") kc++;
  }
  return { stagPoints, stagCount, hunts, healings, magis, tithes, kc };
}

function PlayerPanel({
  player,
  isCurrentTurn,
}: {
  player: PublicPlayerInfo;
  isCurrentTurn: boolean;
}) {
  const ts = territoryStats(player.territory, player.territoryMagiAsHealing);
  const handLimit = 5 + ts.magis; // base 5 + non-healing magi
  const crownScore = ts.stagCount + (3 * ts.tithes) + player.contributionsMade + player.ante + ts.kc;

  return (
    <div
      className={`px-3 py-2 rounded text-sm ${
        player.isMe
          ? "bg-amber-900/20 border border-amber-900/50"
          : isCurrentTurn
          ? "bg-stone-800 border border-stone-600"
          : "bg-stone-800/40"
      } ${player.eliminated ? "opacity-50" : ""}`}
    >
      {/* Top row: name + key stats */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isCurrentTurn && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          )}
          <span className="font-medium truncate">
            {player.name}
          </span>
          {player.isMe && <span className="text-amber-400 text-xs">(you)</span>}
          {player.eliminated && <span className="text-red-400 text-xs">✗ out</span>}
        </div>
        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="text-stone-400" title={`${player.handCount} cards in hand, limit ${handLimit}`}>
            ✋{player.handCount}/{handLimit}
          </span>
          <span className="text-stone-400" title={`${player.contributionsRemaining} contribution tokens remaining`}>
            🪙{player.contributionsRemaining}
          </span>
          <span className="text-amber-400" title={`Deck-out score: ${ts.stagCount} stags + ${ts.tithes * 3} tithe + ${player.contributionsMade + player.ante} contributed(incl ante) + ${ts.kc} KC = ${crownScore}`}>
            👑{crownScore}
          </span>
          <span className={`font-semibold ${ts.stagPoints >= 15 ? "text-emerald-400" : ts.stagPoints >= 10 ? "text-emerald-500" : "text-stone-400"}`}
            title={`${ts.stagPoints} Stag Points toward 18`}>
            ♠{ts.stagPoints}/18
          </span>
        </div>
      </div>

      {/* Territory summary line */}
      {player.territory.length > 0 && (
        <div className="flex gap-2.5 mt-1 text-xs flex-wrap">
          {ts.stagCount > 0 && (
            <span className="text-emerald-400" title={`${ts.stagCount} Stags, ${ts.stagPoints} points`}>
              ♠{ts.stagCount} Stag{ts.stagCount > 1 ? "s" : ""}
            </span>
          )}
          {ts.hunts > 0 && (
            <span className="text-red-400" title={`${ts.hunts} Hunts in territory; your Hunts get +${ts.hunts * 3} value`}>
              ♣+{ts.hunts * 3} Hunt
            </span>
          )}
          {ts.healings > 0 && (
            <span className="text-sky-400" title={`${ts.healings} Healing bonus; your Healing cards get +${ts.healings} value`}>
              ♥+{ts.healings} Heal
            </span>
          )}
          {ts.magis > 0 && (
            <span className="text-violet-400" title={`${ts.magis} Magi; hand size +${ts.magis}`}>
              ✦+{ts.magis} Hand
            </span>
          )}
          {ts.tithes > 0 && (
            <span className="text-amber-400" title={`${ts.tithes} Tithes; worth +${ts.tithes * 3} on deck-out`}>
              ◆{ts.tithes} Tithe{ts.tithes > 1 ? "s" : ""}
            </span>
          )}
          {ts.kc > 0 && (
            <span className="text-orange-400" title={`${ts.kc} King's Commands; Hunts discard/draw +${ts.kc}, +${ts.kc} deck-out score`}>
              ♚+{ts.kc} KC
            </span>
          )}
        </div>
      )}
    </div>
  );
}
