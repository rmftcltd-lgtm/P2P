"use client";

import { FormEvent, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Props = {
  deliveryId: string;
  amount: number;
  onPaid: () => void;
  onError: (msg: string) => void;
};

function CheckoutForm({
  deliveryId,
  onPaid,
  onError,
}: {
  deliveryId: string;
  onPaid: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/customer/deliveries/${deliveryId}?paid=1`,
      },
    });
    if (error) {
      setBusy(false);
      onError(error.message ?? "Payment failed");
      return;
    }
    if (
      paymentIntent &&
      (paymentIntent.status === "requires_capture" ||
        paymentIntent.status === "succeeded")
    ) {
      await fetch(`/api/deliveries/${deliveryId}/pay`, { method: "PATCH" });
      setBusy(false);
      onPaid();
      return;
    }
    setBusy(false);
    onError("Payment not completed");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      <button type="submit" className="btn btn-primary w-full" disabled={!stripe || busy}>
        {busy ? "Processing…" : "Pay securely"}
      </button>
      <p className="text-xs text-slate">Secured by Stripe · funds held until delivery</p>
    </form>
  );
}

export function StripePayBox({ deliveryId, amount, onPaid, onError }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "loading" | "stripe" | "mock">("idle");
  const [message, setMessage] = useState("");

  async function startPay() {
    setMode("loading");
    setMessage("");
    const res = await fetch(`/api/deliveries/${deliveryId}/pay`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMode("idle");
      onError(data.error ?? "Could not start payment");
      return;
    }
    if (data.mode === "mock") {
      setMode("mock");
      setMessage(data.message ?? "Mock payment authorized");
      onPaid();
      return;
    }
    if (!data.clientSecret || !data.publishableKey) {
      setMode("idle");
      onError("Stripe is configured without a publishable key");
      return;
    }
    setClientSecret(data.clientSecret);
    setPublishableKey(data.publishableKey);
    setMode("stripe");
  }

  if (mode === "idle") {
    return (
      <button type="button" className="btn btn-primary" onClick={() => void startPay()}>
        Pay ${amount.toFixed(2)} NZD
      </button>
    );
  }

  if (mode === "loading") {
    return <p className="text-sm text-slate">Preparing secure checkout…</p>;
  }

  if (mode === "mock") {
    return <p className="text-sm text-moss">{message}</p>;
  }

  if (!clientSecret || !publishableKey) return null;

  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm deliveryId={deliveryId} onPaid={onPaid} onError={onError} />
    </Elements>
  );
}
