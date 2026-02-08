"use client";

import { cardDisplayName } from "@/lib/cards";

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
  const name = cardDisplayName(cardId);
  const type = cardId.split("-")[0];
  const colors: Record<string, string> = {
    stag: "bg-green-900/80 text-green-200 border-green-700",
    hunt: "bg-red-900/80 text-red-200 border-red-700",
    healing: "bg-blue-900/80 text-blue-200 border-blue-700",
    magi: "bg-purple-900/80 text-purple-200 border-purple-700",
    tithe: "bg-yellow-900/80 text-yellow-200 border-yellow-700",
    kingscommand: "bg-orange-900/80 text-orange-200 border-orange-700",
  };
  const color = colors[type] || "bg-stone-700 text-stone-200";
  const selectedRing = selected ? "ring-2 ring-amber-400" : "";
  const cursor = interactive || onClick ? "cursor-pointer" : "";

  return (
    <span
      onClick={onClick}
      className={`${color} border rounded ${selectedRing} ${cursor} ${
        small ? "px-1.5 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      } font-medium inline-block select-none`}
    >
      {name}
    </span>
  );
}
