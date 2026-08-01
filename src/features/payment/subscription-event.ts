/**
 * 判断支付供应商发来的订阅周期是否早于本地已保存周期。
 *
 * 缺少任一周期起点时无法判断顺序，交给调用方按正常事件处理。
 */
export function isStaleSubscriptionEvent(
  storedPeriodStart: Date | null,
  incomingPeriodStart: Date | null
): boolean {
  return Boolean(
    storedPeriodStart &&
      incomingPeriodStart &&
      incomingPeriodStart < storedPeriodStart
  );
}
