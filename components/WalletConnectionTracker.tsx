"use client";

import { useWalletConnectionTracker } from "~~/hooks/useWalletConnectionTracker";
import { usePaymentTracker } from "~~/hooks/usePaymentTracker";

/**
 * Component to track wallet connections and payments
 * This component doesn't render anything, it just tracks connections and payments
 */
export function WalletConnectionTracker() {
  useWalletConnectionTracker();
  usePaymentTracker();
  return null;
}

