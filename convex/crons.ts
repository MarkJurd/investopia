import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// เครื่องมือเทียบงบ: อัปเดตรายชื่อหุ้น + งบใหม่จาก SEC ทุกวันอาทิตย์ 19:00 UTC (= จันทร์ 02:00 เวลาไทย)
crons.weekly("screener weekly sync", { dayOfWeek: "sunday", hourUTC: 19, minuteUTC: 0 }, internal.screenerSec.syncAll, {});

// สรุป Watchlist ทาง Telegram (สมาชิกที่เชื่อมไว้) ทุกวันเสาร์ 01:00 UTC (= 08:00 เวลาไทย หลังตลาดสหรัฐฯ ปิดวันศุกร์)
crons.weekly("watchlist weekly digest", { dayOfWeek: "saturday", hourUTC: 1, minuteUTC: 0 }, internal.telegram.weeklyDigest, {});

export default crons;
