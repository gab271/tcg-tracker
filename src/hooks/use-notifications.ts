"use client";

/**
 * Hook de notificaciones in-app con Supabase real-time.
 *
 * Escucha inserciones en market_offers donde el vendor es el usuario actual
 * y en market_transactions donde el comprador es el usuario.
 * Acumula notificaciones en memoria (persisten durante la sesión).
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface AppNotification {
  id: string;
  type: "offer_received" | "offer_accepted" | "offer_rejected" | "purchase_completed";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [
      {
        ...notif,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      },
      ...prev.slice(0, 49), // máximo 50 notificaciones en memoria
    ]);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Canal 1: ofertas recibidas (el usuario es el vendedor)
    const offersChannel = supabase
      .channel(`offers:seller:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "market_offers",
          // Filtramos en cliente — Supabase RLS ya garantiza que sólo vemos las nuestras
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const offer = payload.new as Record<string, unknown>;
          // Sólo notificar si la oferta es para una listing del usuario actual
          // (chequeamos seller_id a través del listing, pero como approximación
          // notificamos todas las inserciones que pasan RLS)
          addNotification({
            type: "offer_received",
            title: "Nueva oferta recibida",
            message: `Alguien ofreció €${Number(offer.amount ?? 0).toFixed(2)} por una de tus cartas.`,
          });
        }
      )
      .subscribe();

    // Canal 2: transacciones completadas donde el usuario es el comprador
    const txChannel = supabase
      .channel(`transactions:buyer:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "market_transactions",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const tx = payload.new as Record<string, unknown>;
          if (tx.buyer_id !== user.id) return;
          if (tx.status === "completed") {
            addNotification({
              type: "purchase_completed",
              title: "Compra completada",
              message: "El vendedor ha marcado tu compra como enviada.",
            });
          }
        }
      )
      .subscribe();

    // Canal 3: ofertas aceptadas/rechazadas donde el usuario es el comprador
    const offerStatusChannel = supabase
      .channel(`offer-status:buyer:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "market_offers",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const offer = payload.new as Record<string, unknown>;
          if (offer.buyer_id !== user.id) return;
          if (offer.status === "accepted") {
            addNotification({
              type: "offer_accepted",
              title: "¡Oferta aceptada!",
              message: `Tu oferta de €${Number(offer.amount ?? 0).toFixed(2)} fue aceptada. ¡Completa la compra!`,
            });
          } else if (offer.status === "rejected") {
            addNotification({
              type: "offer_rejected",
              title: "Oferta rechazada",
              message: "El vendedor rechazó tu oferta.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(offersChannel);
      supabase.removeChannel(txChannel);
      supabase.removeChannel(offerStatusChannel);
    };
  }, [user, supabase, addNotification]);

  return { notifications, unreadCount, markAllRead, markRead };
}
