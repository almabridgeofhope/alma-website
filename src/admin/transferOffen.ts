import type { Transfer } from "./types";

/**
 * Was von einem Transfer noch nicht zugeordnet ist. UGX nur, wenn die Ankunft bestaetigt ist
 * (vorher ist der UGX-Betrag nicht verlaesslich), Euro immer, sofern ein Planungskurs da ist.
 */
export const offenVonTransfer = (
  transfer: Pick<Transfer, "amount" | "original_amount" | "erhalten_bestaetigt_am">,
  assignedUgx: number,
  eurRate: number | null | undefined,
): { eur: number | null; ugx: number | null } => ({
  eur: eurRate ? Math.abs(transfer.amount) - assignedUgx / eurRate : null,
  ugx:
    transfer.erhalten_bestaetigt_am && transfer.original_amount !== null
      ? Math.abs(transfer.original_amount) - assignedUgx
      : null,
});
