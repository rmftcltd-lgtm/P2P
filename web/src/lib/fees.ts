/** Sender service fee on the Lonelyseat base fare. */
export const SENDER_FEE_RATE = 0.1;

/** Driver platform share on the Lonelyseat base fare. */
export const DRIVER_FEE_RATE = 0.14;

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function senderFeeFromBase(baseFare: number) {
  return roundMoney(baseFare * SENDER_FEE_RATE);
}

export function driverFeeFromBase(baseFare: number) {
  return roundMoney(baseFare * DRIVER_FEE_RATE);
}

/** Total platform take (sender fee + driver fee) on a booking. */
export function platformFeeFromBase(baseFare: number) {
  return roundMoney(senderFeeFromBase(baseFare) + driverFeeFromBase(baseFare));
}

/**
 * Seat price the sender pays before Lonely Cover / donations
 * (base fare with sender fee included).
 */
export function senderSeatPrice(baseFare: number) {
  return roundMoney(baseFare + senderFeeFromBase(baseFare));
}

/** What the driver receives from the base fare after the driver fee. */
export function driverTakeFromBase(baseFare: number) {
  return roundMoney(baseFare - driverFeeFromBase(baseFare));
}

/** Recover base fare from the seat portion charged to the sender. */
export function baseFareFromSenderSeat(seatPrice: number) {
  return roundMoney(seatPrice / (1 + SENDER_FEE_RATE));
}
