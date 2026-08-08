export type AlertRecordStatus = "firing" | "resolved";

export interface AlertStateEvaluation {
  cooldownUntil: Date | null;
  nextConsecutiveCount: number;
  shouldNotify: boolean;
  shouldNotifyRecovery: boolean;
  shouldResolve: boolean;
  status: AlertRecordStatus;
}

export function evaluateAlertState(input: {
  cooldownUntil: Date | null;
  isBreached: boolean;
  isRecovered?: boolean;
  now: Date;
  previousConsecutiveCount: number;
  previousStatus: AlertRecordStatus | null;
  requiredConsecutive: number;
  cooldownMinutes: number;
  hasSuccessfulNotification?: boolean;
}): AlertStateEvaluation {
  const isRecovered = input.isRecovered ?? !input.isBreached;
  if (input.previousStatus === "firing" && !isRecovered) {
    const nextConsecutiveCount = input.isBreached
      ? input.previousConsecutiveCount + 1
      : input.previousConsecutiveCount;
    const cooldownActive =
      input.cooldownUntil !== null && input.cooldownUntil > input.now;
    const shouldNotify =
      input.isBreached &&
      nextConsecutiveCount >= input.requiredConsecutive &&
      !cooldownActive;
    return {
      cooldownUntil: shouldNotify
        ? new Date(input.now.getTime() + input.cooldownMinutes * 60_000)
        : input.cooldownUntil,
      nextConsecutiveCount,
      shouldNotify,
      shouldNotifyRecovery: false,
      shouldResolve: false,
      status: "firing",
    };
  }

  if (!input.isBreached) {
    return {
      cooldownUntil: null,
      nextConsecutiveCount: 0,
      shouldNotify: false,
      shouldNotifyRecovery:
        input.previousStatus === "firing" &&
        input.hasSuccessfulNotification === true,
      shouldResolve: input.previousStatus === "firing",
      status: "resolved",
    };
  }

  const nextConsecutiveCount = input.previousConsecutiveCount + 1;
  const cooldownActive =
    input.cooldownUntil !== null && input.cooldownUntil > input.now;
  const shouldNotify =
    nextConsecutiveCount >= input.requiredConsecutive && !cooldownActive;
  return {
    cooldownUntil: shouldNotify
      ? new Date(input.now.getTime() + input.cooldownMinutes * 60_000)
      : input.cooldownUntil,
    nextConsecutiveCount,
    shouldNotify,
    shouldNotifyRecovery: false,
    shouldResolve: false,
    status: "firing",
  };
}
