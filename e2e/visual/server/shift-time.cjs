/**
 * 把截图服务器里的“现在”平移到固定的截图时刻
 *
 * 为什么要平移：页面上有几处是服务端按“现在”算出来的，比如页脚的年份、
 * 积分批次是否已经过期。不固定的话，过了年底或批次到期日，基线就会悄悄变化。
 *
 * 做法：通过 NODE_OPTIONS=--require 把这个文件塞进截图服务器及其所有子进程，
 * 在任何业务代码运行之前，把全局 Date 换成一个代理：
 *   - new Date() 和 Date.now() 返回“真实时间 + 偏移量”，也就是从固定时刻 VISUAL_NOW 开始往前走；
 *   - 带参数的 new Date(x)、Date.parse、Date.UTC 保持原样，所以数据库里读出的日期不受影响；
 *   - 不改 setTimeout / performance.now，定时器和耗时统计继续按真实时间走。
 *
 * 偏移量由 global-setup 算一次，经环境变量 VISUAL_TIME_OFFSET_MS 传给所有子进程，
 * 这样主进程和各个 worker 对“现在”的理解一致。
 *
 * 注意：Next 的中间件跑在独立的 Edge 沙箱里，那里的 Date 不受影响，
 * 但项目的中间件里没有依赖当前时间的逻辑。
 */

"use strict";

const OFFSET_ENV = "VISUAL_TIME_OFFSET_MS";
const APPLIED_FLAG = Symbol.for("nextdevtpl.visual.timeShifted");

function applyTimeShift() {
  const offset = Number(process.env[OFFSET_ENV]);
  if (!Number.isFinite(offset) || offset === 0) return;
  // 同一个上下文里只平移一次，避免被重复加载时偏移量叠加
  if (globalThis[APPLIED_FLAG]) return;
  globalThis[APPLIED_FLAG] = true;

  const RealDate = Date;
  const shiftedNow = () => RealDate.now() + offset;

  const ShiftedDate = new Proxy(RealDate, {
    // new Date()：无参数时返回平移后的“现在”，有参数时照常解析
    construct(target, args, newTarget) {
      if (args.length === 0) {
        return Reflect.construct(target, [shiftedNow()], newTarget);
      }
      return Reflect.construct(target, args, newTarget);
    },
    // Date()：不带 new 的调用返回当前时间的字符串
    apply() {
      return new RealDate(shiftedNow()).toString();
    },
    get(target, property, receiver) {
      if (property === "now") return shiftedNow;
      return Reflect.get(target, property, receiver);
    },
  });

  // 让 date.constructor === Date 继续成立
  Object.defineProperty(RealDate.prototype, "constructor", {
    configurable: true,
    value: ShiftedDate,
    writable: true,
  });
  globalThis.Date = ShiftedDate;
}

applyTimeShift();
