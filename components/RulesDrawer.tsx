"use client";

import { useState } from "react";

export function RulesDrawer() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string>("turn");

  const sections: { id: string; label: string }[] = [
    { id: "turn", label: "Turn Structure" },
    { id: "stag", label: "♠ Stag" },
    { id: "hunt", label: "♣ Hunt" },
    { id: "healing", label: "♥ Healing" },
    { id: "magi", label: "✦ Magi" },
    { id: "tithe", label: "◆ Tithe" },
    { id: "kc", label: "♚ King's Command" },
    { id: "winning", label: "Winning" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-md text-stone-400 hover:text-stone-200 transition-colors"
      >
        📖 Rules
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Drawer */}
          <div
            className="relative w-full max-w-md bg-stone-900 border-l border-stone-700 overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-200">Game Rules</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1 flex-wrap mb-4">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`px-2 py-1 text-xs rounded ${
                    section === s.id
                      ? "bg-amber-800 text-amber-100"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="text-sm text-stone-300 space-y-3 leading-relaxed">
              {section === "turn" && <TurnRules />}
              {section === "stag" && <StagRules />}
              {section === "hunt" && <HuntRules />}
              {section === "healing" && <HealingRules />}
              {section === "magi" && <MagiRules />}
              {section === "tithe" && <TitheRules />}
              {section === "kc" && <KCRules />}
              {section === "winning" && <WinningRules />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TurnRules() {
  return (
    <>
      <h3 className="font-bold text-stone-100">Turn Structure</h3>
      <p>Each turn has three steps:</p>
      <p>
        <span className="text-amber-400 font-semibold">1. Refresh Kingdom</span> — If fewer than 3 cards in the Kingdom, discard remaining Kingdom cards, burn 1, deal 3 new cards. (Automatic.)
      </p>
      <p>
        <span className="text-amber-400 font-semibold">2. Kingdom Action</span> — Choose one:
      </p>
      <p className="pl-3">
        <span className="text-blue-400">Draw a Card</span> from the deck (burn 1, deal 1 to Kingdom).
      </p>
      <p className="pl-3">
        <span className="text-amber-400">Draft Kingdom</span> — pick a Kingdom card, then each opponent picks one. Discard the rest.
      </p>
      <p className="pl-3">
        <span className="text-emerald-400">Play a Stag</span> — place a Stag into your territory, paying its discard cost. Opponents draft from Kingdom, you pick last.
      </p>
      <p>
        <span className="text-amber-400 font-semibold">3. Territory Action</span> — If you didn&apos;t play a Stag, play one non-Stag card from your hand for its effect. If you have no non-Stag cards, reveal your hand, burn 1, draw 3.
      </p>
      <p>At end of turn, discard down to your hand limit (base 6, +1 per Magi in territory).</p>
      <h3 className="font-bold text-stone-100 mt-4">Hand Size</h3>
      <p>Starting hand limit is 6. Each non-Healing Magi in your territory gives +1 to your hand limit.</p>
      <h3 className="font-bold text-stone-100 mt-4">Contributions</h3>
      <p>Each player starts with 12 contribution tokens. These are spent for atonement when discarding Stags, and for Tithe effects. If you must contribute and cannot, you are eliminated.</p>
    </>
  );
}

function StagRules() {
  return (
    <>
      <h3 className="font-bold text-emerald-400">♠ Stag (1–12)</h3>
      <p>Stags are how you win. Get 18 Stag Points in your territory and you win immediately.</p>
      <p><span className="text-stone-100 font-medium">Playing a Stag:</span> Can only be played as your Kingdom action (not Territory). You must discard cards from your hand based on the Stag&apos;s value:</p>
      <div className="grid grid-cols-2 gap-1 text-xs bg-stone-800/60 rounded p-2 my-1">
        <span>Stag 1–3:</span><span>discard 1 card</span>
        <span>Stag 4–6:</span><span>discard 2 cards</span>
        <span>Stag 7–9:</span><span>discard 4 cards</span>
        <span>Stag 10–12:</span><span>discard 8 cards</span>
      </div>
      <p><span className="text-stone-100 font-medium">Atonement:</span> When you discard a Stag from your hand for any reason, you must contribute tokens based on value:</p>
      <div className="grid grid-cols-2 gap-1 text-xs bg-stone-800/60 rounded p-2 my-1">
        <span>Stag 1–4:</span><span>contribute 1</span>
        <span>Stag 5–8:</span><span>contribute 2</span>
        <span>Stag 9–12:</span><span>contribute 3</span>
      </div>
      <p>Exception: If your territory&apos;s total Healing value ≥ the Stag value, no atonement needed.</p>
    </>
  );
}

function HuntRules() {
  return (
    <>
      <h3 className="font-bold text-red-400">♣ Hunt (1–12)</h3>
      <p>Hunts are attacks. Play as a Territory action.</p>
      <p><span className="text-stone-100 font-medium">Hunt Value:</span> Card value + 3 for each Hunt already in your territory.</p>
      <p><span className="text-stone-100 font-medium">When played:</span> Burn a card. Each opponent in turn can try to avert by revealing a Healing card (optionally with a Magi for +6). If they can&apos;t or don&apos;t avert, they must discard 2 cards.</p>
      <p><span className="text-stone-100 font-medium">You draw:</span> 2 cards, minus 1 for each opponent who averted.</p>
      <p><span className="text-stone-100 font-medium">King&apos;s Command bonus:</span> Each KC in your territory adds +1 to the discard/draw count (so opponents discard 3 and you draw 3 with 1 KC).</p>
      <p>The Hunt goes into your territory, boosting future Hunts by +3.</p>
    </>
  );
}

function HealingRules() {
  return (
    <>
      <h3 className="font-bold text-sky-400">♥ Healing (1–12)</h3>
      <p>Healing is defense. Play as a Territory action — no on-play effect, just goes into territory.</p>
      <p><span className="text-stone-100 font-medium">Averting Hunts:</span> When an opponent plays a Hunt, reveal a Healing card from your hand. Its total value = card value + 1 per Healing in your territory + 1 per Magi-as-Healing in territory. Optionally reveal a Magi for +6. If total ≥ Hunt value, you avert (no discard).</p>
      <p>Revealed Healing and Magi go to your territory for future defense.</p>
      <p><span className="text-stone-100 font-medium">Stag Protection:</span> If your territory&apos;s total Healing value ≥ a Stag&apos;s value, you don&apos;t atone when discarding that Stag.</p>
    </>
  );
}

function MagiRules() {
  return (
    <>
      <h3 className="font-bold text-violet-400">✦ Magi (×6)</h3>
      <p>Magi are versatile utility cards. Play as a Territory action.</p>
      <p><span className="text-stone-100 font-medium">Split 6 effects</span> between: draw from top of deck, draw from bottom of deck, and place cards from hand onto bottom of deck. Execute in that order.</p>
      <p>Magi goes to your territory and gives <span className="text-violet-300">+1 hand size</span>.</p>
      <p><span className="text-stone-100 font-medium">Healing alternative:</span> Instead of playing normally, reveal a Magi alongside a Healing card when an opponent Hunts to get +6 to your Healing total. The Magi goes to territory but counts as +1 Healing (not +1 hand size).</p>
    </>
  );
}

function TitheRules() {
  return (
    <>
      <h3 className="font-bold text-amber-400">◆ Tithe (×6)</h3>
      <p>Tithe churns cards. Play as a Territory action.</p>
      <p><span className="text-stone-100 font-medium">When played:</span> You discard 2 cards, draw 2. Then each opponent does the same.</p>
      <p>After that, you may contribute 1 token to discard 2 and draw 2 again (just yourself). You can do this up to twice (2 contributions max).</p>
      <p><span className="text-stone-100 font-medium">If contributed at least once:</span> Tithe goes to your territory and counts as +3 contribution toward deck-out scoring. Otherwise it&apos;s just discarded.</p>
    </>
  );
}

function KCRules() {
  return (
    <>
      <h3 className="font-bold text-orange-400">♚ King&apos;s Command (×3)</h3>
      <p>The strongest attack card. Play as a Territory action.</p>
      <p><span className="text-stone-100 font-medium">When played:</span> Each opponent must discard a Stag from their hand (atoning if necessary), or reveal a hand with no Stags.</p>
      <p>You may take any, all, or none of the discarded Stags into your hand.</p>
      <p><span className="text-stone-100 font-medium">Territory bonus:</span> Each King&apos;s Command in your territory adds +1 to the discard and draw amounts on your Hunts.</p>
    </>
  );
}

function WinningRules() {
  return (
    <>
      <h3 className="font-bold text-stone-100">Winning the Game</h3>
      <p>The game ends immediately when any of these happen:</p>
      <p><span className="text-emerald-400 font-medium">18 Stag Points:</span> If you have 18+ Stag Points in your territory, you win instantly.</p>
      <p><span className="text-red-400 font-medium">Last Standing:</span> If all other players are eliminated (can&apos;t contribute when required), you win.</p>
      <p><span className="text-amber-400 font-medium">Deck Exhaustion:</span> If the deck and discard pile run out, final scoring happens. Each player&apos;s score = number of Stags in territory + (3 × Tithes in territory) + total contributions made (including antes). Tiebreaker: most Magi, then Healing, then Hunts, then King&apos;s Commands.</p>
    </>
  );
}
