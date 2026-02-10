"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getAnonClient } from "@/lib/supabase";
import { PlayerView } from "@/lib/types";

export function useGame(gameId: string, playerId: string | null) {
  const [view, setView] = useState<PlayerView | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState(true);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Track previous "needs action" state for notification triggers
  const prevNeedsAction = useRef(false);
  const needsAction = view
    ? (view.availableActions.length > 0) && view.phase !== "finished"
    : false;

  // Detect when it *becomes* your turn (transition from false → true)
  const justBecameMyTurn = needsAction && !prevNeedsAction.current;
  useEffect(() => {
    prevNeedsAction.current = needsAction;
  }, [needsAction]);

  const fetchState = useCallback(async () => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/game/${gameId}/state?playerId=${playerId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load game");
        return;
      }
      setView(data as PlayerView);
      setError("");
    } catch {
      setError("Network error");
    }
  }, [gameId, playerId]);

  useEffect(() => {
    fetchState();

    const supabase = getAnonClient();
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        () => {
          fetchState();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchState]);

  // Clear transient errors after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const submitAction = useCallback(
    async (body: Record<string, unknown>) => {
      if (!playerId || submitting) return;
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch(`/api/game/${gameId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, playerId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Action failed");
          return;
        }
        // Update view immediately from response
        if (data.myHand) {
          setView(data as PlayerView);
        }
      } catch {
        setError("Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [gameId, playerId, submitting]
  );

  return { view, error, submitting, submitAction, fetchState, connected, needsAction, justBecameMyTurn };
}
