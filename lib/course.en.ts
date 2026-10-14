/* =============================================================================
 * Classroom content (/en/learn) — ENGLISH  ·  Thai version: lib/course.ts
 * =============================================================================
 * ⚠️ This file contains the quiz answers → never import it in components/ or app/.
 *    Pages get the content through Convex (convex/learn.ts), which strips the answers
 *    and checks membership first.
 *
 * Same structure as lib/course.ts: keep every id, the number of questions and each
 * `answer` identical to the Thai file. Edit only the text.
 * Educational content only: no specific stock picks, no profit promises.
 * ========================================================================== */
import type { Course } from "./course";

export const COURSE_EN: Course = {
  modules: [
    {
      id: "m0",
      tag: "Module 0",
      title: "Why prices move — Demand & Supply",
      practice: "Pick one stock chart and say whether buyers or sellers have been in control lately, based on what you see",
      lessons: [
        { id: "m0-1", title: "What makes a price move", minutes: 0, videoId: "",
          notes: "Price comes from the balance between people who want to buy and people who want to sell at that moment." },
        { id: "m0-2", title: "Imbalance = movement", minutes: 0, videoId: "",
          notes: "More buyers than sellers, price rises. More sellers than buyers, price falls." },
        { id: "m0-3", title: "Demand & supply connect everything on the chart", minutes: 0, videoId: "",
          notes: "Candlesticks, trends, support and resistance, and SMC are all pictures of buying and selling pressure." },
      ],
      quiz: [
        { q: "If more people want to buy a stock than sell it, what usually happens to the price?",
          choices: ["It falls", "It rises", "It always stays the same", "Trading stops"], answer: 1,
          explain: "When buying pressure outweighs selling pressure, buyers have to pay more to get shares, so the price tends to rise." },
        { q: "Which best describes candlesticks, trends, and support/resistance?",
          choices: ["Market rumours", "Things that guarantee where price goes", "Different views of buying and selling pressure", "Unrelated to each other"], answer: 2,
          explain: "Every chart tool looks at buying and selling pressure from a different angle. None of them guarantees the future." },
        { q: "A sharp price drop on high volume most likely reflects what?",
          choices: ["Sellers clearly overpowering buyers", "Buyers overpowering sellers", "Nobody is interested in the stock", "Price will definitely bounce"], answer: 0,
          explain: "Falling on heavy volume means many people really were selling, not just that buyers were absent." },
      ],
    },
    {
      id: "m1",
      tag: "Module 1",
      title: "Setting up your playground — the tools",
      practice: "Account-opening checklist + set up TradingView step by step (with screenshots)",
      lessons: [
        { id: "m1-1", title: "TradingView", minutes: 0, videoId: "",
          notes: "A popular free charting tool for analysing the price of stocks and other assets." },
        { id: "m1-2", title: "Timeframes", minutes: 0, videoId: "",
          notes: "Charts come in many timeframes. Pick the one that matches how long you hold." },
        { id: "m1-3", title: "Brokerage app + opening an account", minutes: 0, videoId: "",
          notes: "The tool you actually place orders with, and how to open an account." },
      ],
      quiz: [
        { q: "What is a chart's timeframe?",
          choices: ["The stock's ticker symbol", "The trading fee", "How many shares you hold", "The period one candle represents, such as 1 day or 1 hour"], answer: 3,
          explain: "The timeframe tells you how much time each candle covers. Larger timeframes show the longer-term picture." },
        { q: "In this course, what is TradingView mainly used for?",
          choices: ["Viewing charts and analysing price", "Depositing money", "Receiving dividends", "Opening a bank account"], answer: 0,
          explain: "TradingView is for charting and analysis. Real orders go through your broker's app." },
      ],
    },
    {
      id: "m2",
      tag: "Module 2",
      title: "The alphabet and grammar of charts",
      practice: "Read 10 real candles + draw the trend structure on a real chart",
      lessons: [
        { id: "m2-1", title: "Candlesticks", minutes: 0, videoId: "",
          notes: "Each candle's shape shows buying versus selling pressure for that period and who won." },
        { id: "m2-2", title: "Dow Theory", minutes: 0, videoId: "",
          notes: "Price moves in waves, driven by a sustained imbalance between buyers and sellers." },
      ],
      quiz: [
        { q: "What does a candle that closes above its open (a green candle) tell you?",
          choices: ["Sellers won that period", "Buyers won that period", "No trading happened", "Price will definitely keep rising"], answer: 1,
          explain: "A green candle means buyers pushed the close above the open during that period. It says nothing certain about the future." },
        { q: "According to Dow Theory, what does an uptrend look like?",
          choices: ["Lower highs and lower lows", "Price moving sideways in a range", "Higher highs and higher lows", "Price rising in a straight line with no pullbacks"], answer: 2,
          explain: "An uptrend is higher highs plus higher lows. Price can pull back, but not below the previous low." },
      ],
    },
    {
      id: "m3",
      tag: "Module 3",
      title: "Reading trend and momentum with EMA + MACD",
      practice: "Pick one stock, read its trend with EMA/MACD, and compare your notes with what you see by eye",
      lessons: [
        { id: "m3-1", title: "EMA", minutes: 0, videoId: "",
          notes: "A moving average that weights recent prices more, used to read trend direction (the popular 20/50/100/200)." },
        { id: "m3-2", title: "MACD basics", minutes: 0, videoId: "",
          notes: "Measures momentum using two lines and a histogram." },
        { id: "m3-3", title: "Using MACD to read and count trends", minutes: 0, videoId: "",
          notes: "The instructor's own method (covered in detail in the video)." },
        { id: "m3-4", title: "Divergence", minutes: 0, videoId: "",
          notes: "Price makes a new high but momentum doesn't follow. The trend may be weakening." },
      ],
      quiz: [
        { q: "How does an EMA differ from a simple moving average (SMA)?",
          choices: ["It gives more weight to recent prices", "It uses future prices", "It ignores closing prices", "They are identical"], answer: 0,
          explain: "Because the EMA weights recent prices more, it reacts to changes faster than an SMA." },
        { q: "What is a bearish divergence?",
          choices: ["Price and MACD rising together", "MACD crossing above zero", "Volume increasing", "Price makes a new high but MACD does not"], answer: 3,
          explain: "It suggests momentum may be fading. Treat it as a caution, not as confirmation that price will fall." },
      ],
    },
    {
      id: "m4",
      tag: "Module 4",
      title: "Market structure, price levels and timing",
      practice: "Find zones, levels and patterns on 10 historical charts",
      lessons: [
        { id: "m4-1", title: "Patterns", minutes: 0, videoId: "",
          notes: "Recurring chart shapes that hint whether price is more likely to continue or reverse." },
        { id: "m4-2", title: "Fibonacci", minutes: 0, videoId: "",
          notes: "A tool for estimating how far a pullback might go." },
        { id: "m4-3", title: "SMC", minutes: 0, videoId: "",
          notes: "Reading market structure from the perspective of big money (liquidity, order blocks, FVG)." },
      ],
      quiz: [
        { q: "What is Fibonacci retracement used for?",
          choices: ["Telling you the exact profit", "Estimating how far a pullback might go", "Counting a stock's expiry date", "Calculating tax"], answer: 1,
          explain: "Fibonacci marks price levels worth watching during a pullback. It's an estimate, not a prediction." },
        { q: "In SMC, what does “liquidity” mean most closely?",
          choices: ["A company's dividends", "A company's net profit", "Broker commission", "Areas where many orders sit, such as lots of people's stop losses"], answer: 3,
          explain: "Liquidity is where lots of orders are waiting. Price often reaches for these areas before choosing a direction." },
      ],
    },
    {
      id: "m5",
      tag: "Module 5",
      title: "Trading plans: entries, exits and sizing",
      practice: "Write a one-page plan (entry / exit / size / risk) before every trade",
      lessons: [
        { id: "m5-1", title: "Entry and exit points", minutes: 0, videoId: "",
          notes: "Clear entry and exit levels based on buying/selling pressure and structure, not on feelings." },
        { id: "m5-2", title: "Exits", minutes: 0, videoId: "",
          notes: "Set your profit target and your stop loss in advance." },
        { id: "m5-3", title: "Scaling + position sizing", minutes: 0, videoId: "",
          notes: "Split entries and exits, and size each position to fit your risk." },
      ],
      quiz: [
        { q: "Why set a stop loss before you buy?",
          choices: ["To guarantee a profit", "To limit the damage if your reason for buying turns out wrong, without deciding emotionally", "Because brokers require it", "So you can keep buying more"], answer: 1,
          explain: "Deciding your exit while you're calm beats deciding it while the price is falling." },
        { q: "What is position sizing?",
          choices: ["Sizing a position so the loss on any one trade stays acceptable", "Buying as much as you can afford", "Choosing stocks with a low share price", "Holding as long as possible"], answer: 0,
          explain: "Sensible sizing lets you be wrong several times and still keep your portfolio intact." },
      ],
    },
    {
      id: "m6",
      tag: "Module 6",
      title: "Portfolio decisions: Buy the dip vs DCA",
      practice: "(Capstone) Pick one stock → write a full plan → simulate investing for one month",
      lessons: [
        { id: "m6-1", title: "DCA", minutes: 0, videoId: "",
          notes: "Investing a fixed amount on a regular schedule. A sound base for most people." },
        { id: "m6-2", title: "Buy the dip", minutes: 0, videoId: "",
          notes: "Buying when price falls into a zone you assessed in advance. The edge you get from reading charts." },
        { id: "m6-3", title: "Combining them into one system", minutes: 0, videoId: "",
          notes: "When to use which, rather than picking one forever." },
      ],
      quiz: [
        { q: "What is DCA?",
          choices: ["Investing a lump sum at the lowest price", "Selling everything when price drops", "Investing in regular instalments without trying to time the market", "Borrowing money to invest"], answer: 2,
          explain: "DCA removes the need to time entries and averages your price across many periods." },
        { q: "How does a disciplined “buy the dip” differ from just buying whenever price falls?",
          choices: ["You buy every time price falls", "You buy whatever others are buying", "You don't need a plan", "You buy in a zone you planned in advance, not just because price fell"], answer: 3,
          explain: "A falling price doesn't mean a cheap price. You need a zone and a reason first." },
      ],
    },
    {
      id: "m7",
      tag: "Module 7",
      title: "Long or short holds — stop asking “how many months?”",
      practice: "Worksheet “How long should I hold this?” — answer TF → strategy → exit rules → rough months (write that last)",
      lessons: [
        { id: "m7-1", title: "Timeframe sets the holding period", minutes: 0, videoId: "",
          notes: "Use a timeframe you can realistically check often, and the holding period follows." },
        { id: "m7-2", title: "The “hold until…” rule", minutes: 0, videoId: "",
          notes: "Exit when the trend breaks, the target is hit, or your reason for buying is gone." },
        { id: "m7-3", title: "Strategy → holding template", minutes: 0, videoId: "",
          notes: "DCA (years) / Swing (weeks to months) / Scalp (not for beginners)." },
        { id: "m7-4", title: "Choose by your real time and tolerance for swings", minutes: 0, videoId: "",
          notes: "Long holds mean sitting through drops along the way, so positions must be smaller." },
      ],
      quiz: [
        { q: "In this course, what should determine how long you hold?",
          choices: ["Your timeframe + strategy + exit rules", "A number of months you guess in advance", "However long your friends hold", "Until you're in profit"], answer: 0,
          explain: "Holding time is the result of timeframe, strategy and exit rules, not a number to guess up front." },
        { q: "If you plan to hold for a long time and sit through drops, how should you size the position?",
          choices: ["Bigger, because you're holding longer", "It doesn't matter", "Smaller, to match the swings you can tolerate", "Use all your money"], answer: 2,
          explain: "The longer you must tolerate swings, the smaller the position needs to be so fear doesn't drive your decisions." },
      ],
    },
  ],
};
