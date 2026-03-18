/**
 * POST /api/stripe/webhook
 *
 * Recibe eventos de Stripe y actualiza el plan del usuario en Supabase.
 *
 * Eventos manejados:
 *   checkout.session.completed      → activa PRO al completar el pago
 *   customer.subscription.deleted   → revierte a FREE al cancelar
 *   customer.subscription.updated   → sincroniza estado (unpaid → FREE)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { serverEnv, env } from "@/lib/config";

// Desactivar body parsing — Stripe necesita el raw body para verificar la firma
export const config = { api: { bodyParser: false } };

function getStripe() {
  return new Stripe(serverEnv.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" as const });
}

function getAdminSupabase() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

async function setPlan(userId: string, plan: "FREE" | "PRO") {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, plan }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook signature failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && session.payment_status === "paid") {
          await setPlan(userId, "PRO");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await setPlan(userId, "FREE");
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          // Si el estado es unpaid/canceled → FREE, si active → PRO
          const isActive = sub.status === "active" || sub.status === "trialing";
          await setPlan(userId, isActive ? "PRO" : "FREE");
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] Error procesando evento:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
