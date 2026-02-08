"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/lib/useGame";
import { PlayerView } from "@/lib/types";
import { parseCardType } from "@/lib/cards";
import { CardChip } from "@/components/CardChip";
import {
  KingdomActionPanel,
  TerritoryActionPanel,
  KingdomPickPanel,
  HuntResponsePanel,
  DiscardPanel,
  MagiChoicePanel,
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

  const { view, error, submitting, submitAction } = useGame(gameId, playerId);

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
}: {
  view: PlayerView;
  error: string;
  submitting: boolean;
  submitAction: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [magiSplit, setMagiSplit] = useState({ drawTop: 3, drawBottom: 3, placeBottom: 0 });

  const actions = view.availableActions;
  const pending = view.pendingAction;
  const isFinished = view.phase === "finished";

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

  // ---- Determine what UI to show ----
  let actionPanel: React.ReactNode = null;

  if (isFinished) {
    actionPanel = <WinPanel view={view} />;
  } else if (actions.length === 0 && !pending) {
    actionPanel = (
      <div className="text-stone-400 text-sm py-2">
        Waiting for {view.currentPlayerName}...
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
      <DiscardPanel
        view={view}
        selectedCards={selectedCards}
        toggleCard={toggleCard}
        clearSelection={clearSelection}
        doAction={async (body) => {
          await doAction({ action: "magiPlaceCards", cardIds: body.cardIds });
        }}
        submitting={submitting}
        count={count}
        actionName="magiPlaceCards"
        reason="Place on bottom of deck"
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
    <main className="min-h-screen p-3 max-w-5xl mx-auto pb-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-stone-300">Game {view.gameId}</h1>
        <div className="text-sm">
          {view.isMyTurn && !isFinished ? (
            <span className="text-amber-400 font-semibold">Your turn!</span>
          ) : isFinished ? (
            <span className="text-green-400 font-semibold">Game Over</span>
          ) : (
            <span className="text-stone-400">Waiting for {view.currentPlayerName}</span>
          )}
        </div>
      </div>

      {/* Zone info bar */}
      <div className="flex gap-4 mb-3 text-xs text-stone-500">
        <span>Deck: {view.deckCount}</span>
        <span>Discard: {view.discardPile.length}</span>
        <span>Burned: {view.burnedCount}</span>
        <span>Phase: {view.turnPhase}</span>
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
          <div
            key={p.seatIndex}
            className={`px-3 py-2 rounded text-sm ${
              p.isMe
                ? "bg-amber-900/20 border border-amber-900/50"
                : p.seatIndex === view.currentPlayerSeat && !isFinished
                ? "bg-stone-800 border border-stone-600"
                : "bg-stone-800/40"
            } ${p.eliminated ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {p.name}
                {p.isMe && <span className="text-amber-400 text-xs ml-1">(you)</span>}
                {p.eliminated && <span className="text-red-400 text-xs ml-1">✗ eliminated</span>}
              </span>
              <span className="text-stone-500 text-xs">
                Hand: {p.handCount} · Coins: {p.contributionsRemaining}/{p.contributionsRemaining + p.contributionsMade}
              </span>
            </div>
            {p.territory.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {p.territory.map((cardId, i) => (
                  <CardChip key={`${cardId}-${i}`} cardId={cardId} small />
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* My Hand */}
      <section className="mb-3">
        <h2 className="text-xs text-stone-500 mb-1 uppercase tracking-wide">
          Your Hand ({view.myHand.length}/{view.myHandLimit})
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

      {/* Error */}
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {/* Action panel (sticky at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-900/95 border-t border-stone-700 p-3 backdrop-blur">
        <div className="max-w-5xl mx-auto">{actionPanel}</div>
      </div>

      {/* Game Log */}
      <section className="mb-3">
        <h2 className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Log</h2>
        <div className="bg-stone-800/40 rounded p-2 max-h-40 overflow-y-auto text-xs space-y-0.5">
          {view.log.slice().reverse().map((entry, i) => (
            <p key={i} className="text-stone-400">{entry.msg}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
