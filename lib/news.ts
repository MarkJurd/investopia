/* รายชื่อหุ้นที่ติดตามข่าวรายวัน (หุ้นสหรัฐฯ ที่คนไทยสนใจ) — ตั้งต้นโดย AI เจ้าของแก้ได้เอง เพิ่ม/ลบ ticker ที่นี่ที่เดียว */
export const NEWS_TICKERS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AMD", "AVGO", "NFLX",
  "PLTR", "COIN", "MSTR", "INTC", "MU", "ARM", "QCOM", "TSM", "SMCI", "ORCL",
  "JPM", "BAC", "V", "KO", "PEP", "MCD", "DIS", "NKE", "BA", "XOM",
] as const;

export const NEWS_MAX_ITEMS = 5;      // ข่าวต่อวัน
export const NEWS_PER_TICKER = 3;     // พาดหัวต่อหุ้นที่ส่งให้ AI สรุป
