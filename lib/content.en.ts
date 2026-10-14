/* =============================================================================
 * INVESTOPIA website text — ENGLISH version (shown at /en)
 * =============================================================================
 * Same structure as lib/content.ts (Thai). Edit only the text inside "...".
 * If you add/remove a field in the Thai file, do the same here — the site
 * will show a red error box pointing at the missing field until both match.
 * Legal: keep the disclaimer; never promise profits or give buy/sell signals.
 * ========================================================================== */
import type { CONTENT } from "./content";

export const CONTENT_EN: typeof CONTENT = {

  locale: { code: "en", base: "/en", dateLocale: "en-GB", switchLabel: "ไทย", switchHref: "/" },

  brand: {
    name: "INVESTOPIA"
  },

  nav: {
    links: [
      { text: "Why us",     href: "#pain" },
      { text: "Curriculum", href: "#curriculum" },
      { text: "Instructor", href: "#instructor" },
      { text: "Pricing",    href: "#pricing" },
      { text: "Dividends",  href: "/en/tools/dividend" },
      { text: "FAQ",        href: "#faq" }
    ],
    primary: "Start learning"
  },

  auth: {
    signIn: "Sign in with Google",
    signInShort: "Sign in",
    signOut: "Sign out",
    classroom: "Classroom",
    community: "Community",
    member: "Member"
  },

  hero: {
    eyebrow: "For beginners who want to invest but don't have much time",
    title: {
      before: "Stop following the crowd.",
      accent: "Start deciding for yourself",
      after: "with clear principles."
    },
    lead: "Finish fast. Use it for real. No need for lots of free time.",
    points: [
      "Understand buying vs. selling pressure (Demand & Supply) first — the core of every technique",
      "Purpose-built exercises you can follow step by step",
      "Ask questions right on the site — no answers lost in a chat thread"
    ],
    ctaPrimary: "Choose a plan",
    ctaSecondary: "See the curriculum",
    chartCaption: "Example — reading a trend on a real chart (EMA line over candlesticks)",
    chartLegend: [
      { color: "ema", text: "EMA line" },
      { color: "up",  text: "Green candle = more buying" },
      { color: "down",text: "Red candle = more selling" }
    ],
    video: {
      youtubeId: "",
      file: "",
      poster: "",
      caption: "Meet the instructor and get an overview of the course",
      placeholderTitle: "Instructor intro video",
      placeholderText: "Coming soon"
    }
  },

  marquee: {
    note: "Well-known US stocks shown for illustration only — not a recommendation to buy or sell",
    items: [
      { sym: "AAPL",  name: "Apple" },
      { sym: "MSFT",  name: "Microsoft" },
      { sym: "NVDA",  name: "NVIDIA" },
      { sym: "GOOGL", name: "Alphabet" },
      { sym: "AMZN",  name: "Amazon" },
      { sym: "META",  name: "Meta" },
      { sym: "TSLA",  name: "Tesla" },
      { sym: "BRK.B", name: "Berkshire Hathaway" },
      { sym: "JPM",   name: "JPMorgan Chase" },
      { sym: "V",     name: "Visa" },
      { sym: "KO",    name: "Coca-Cola" },
      { sym: "DIS",   name: "Disney" }
    ]
  },

  course: {
    eyebrow: "About the course",
    title: "INVESTOPIA's first course — chart reading and investment planning for beginners",
    text: "Start by understanding why prices move, then build up to reading trends, planning entries and exits, and making portfolio-level decisions — one continuous path across 8 modules.",
    points: [
      { icon: "🧱", text: "Starts from the basics — no prior knowledge needed" },
      { icon: "✍️", text: "Every module ends with a hands-on exercise" },
      { icon: "💬", text: "Ask the instructor questions right on the site" },
      { icon: "🎯", text: "Finish with a full investment plan + a 1-month simulated investment" }
    ],
    cta: "See the full curriculum"
  },

  stats: [
    { count: 8,   suffix: "",     label: "modules, from the basics up" },
    { count: 25,  suffix: "+",    label: "bite-sized lessons" },
    { count: 100, suffix: "%",    label: "of lessons include exercises" },
    { count: 15,  suffix: " min", label: "per lesson" }
  ],

  pain: {
    eyebrow: "Why learn here",
    title: "Free content is everywhere. Knowing how to actually do it is rare.",
    sub: "The problem isn't too little information — it's that nobody tells you what to do next.",
    cards: [
      { icon: "📉", title: "Watched lots of videos, still confused", text: "You know the words RSI, MACD and support — but when you open a real chart, you don't know where to start." },
      { icon: "🧭", title: "No system, no plan",                     text: "Buying because others did, selling out of fear, no clear entry or exit — the result is guesswork." },
      { icon: "✍️", title: "Nothing to practise with",               text: "Knowledge you don't apply fades within 3 days. We designed every module so you actually finish it." }
    ]
  },

  curriculum: {
    eyebrow: "8-module curriculum",
    title: "From “I don't know why prices move” to “I can plan my own investments”",
    sub: "Ordered from the very basics — every module connects into one path, not a pile of random topics.",
    modules: [
      {
        tag: "Module 0",
        badge: "The core of everything",
        core: true,
        title: "Why stock prices move — Demand & Supply",
        desc: "Before reading charts, understand that prices move with the balance of buyers (demand) and sellers (supply) — this core makes everything after it click.",
        lessons: [
          { b: "0.1 Why prices move", t: "— the balance between people who want to buy and people who want to sell" },
          { b: "Imbalance = price moves", t: "— more buying than selling, price rises / more selling than buying, price falls" },
          { b: "Demand & supply connect everything on a chart", t: "— candlesticks, trends, support/resistance and SMC are all pictures of buying and selling pressure" }
        ],
        exercise: { b: "Exercise:", t: " look at one stock's chart and say whether buyers or sellers are winning right now, based on what you see" }
      },
      {
        tag: "Module 1",
        badge: "", core: false,
        title: "Set up your playground — the tools",
        desc: "",
        lessons: [
          { b: "TradingView", t: "— the popular free charting tool for analysing stocks and other assets" },
          { b: "Timeframes", t: "— charts come in many time periods; pick one that fits how long you hold" },
          { b: "Broker app + opening an account", t: "— the tool for placing real orders, and how to open an account" }
        ],
        exercise: { b: "Exercise:", t: " account-opening checklist + set up TradingView step by step (with screenshots)" }
      },
      {
        tag: "Module 2",
        badge: "", core: false,
        title: "The alphabet and grammar of charts",
        desc: "",
        lessons: [
          { b: "Candlesticks", t: "— each candle's shape shows that period's buying vs. selling pressure and who won" },
          { b: "Dow Theory", t: "— prices move in waves, driven by ongoing imbalances of buying and selling" },
          { b: "Trendlines", t: "— draw trend lines to see the trend's direction and whether it's still intact" }
        ],
        exercise: { b: "Exercise:", t: " read 10 real candlesticks + draw the trend structure on a real chart" }
      },
      {
        tag: "Module 3",
        badge: "The heart of trend reading", core: true,
        title: "Reading trend and momentum with EMA + MACD",
        desc: "",
        lessons: [
          { b: "EMA", t: "— a moving average that weights recent prices more, used for trend direction (covers the popular 20/50/100/200)" },
          { b: "MACD basics", t: "— measures momentum with two lines and a histogram" },
          { b: "Using MACD to read and count trends", t: "— the instructor's own method (taught in detail in the videos)" },
          { b: "Divergence", t: "— price makes a new high but momentum doesn't follow; the trend may be weakening" },
          { b: "The instructor's indicator", t: "— a trend-reading tool, with a lesson on how to use it (for members who receive the Indicator with the Yearly or VIP plan)" }
        ],
        exercise: { b: "Exercise:", t: " pick one stock, read its trend with EMA/MACD and log a comparison table against reading it by eye" }
      },
      {
        tag: "Module 4",
        badge: "", core: false,
        title: "Market structure, price levels and timing",
        desc: "",
        lessons: [
          { b: "Patterns", t: "— recurring chart shapes that hint whether price may continue or reverse" },
          { b: "Fibonacci", t: "— a tool for estimating how far a pullback might go" },
          { b: "SMC", t: "— reading market structure from the big money's point of view (liquidity, order blocks, FVG)" }
        ],
        exercise: { b: "Exercise:", t: " find zones, levels and patterns on historical charts — 10 examples" }
      },
      {
        tag: "Module 5",
        badge: "", core: false,
        title: "Your trading plan: entries, exits and position sizing",
        desc: "",
        lessons: [
          { b: "Entry and exit points", t: "— clear levels based on buying/selling pressure + structure, not feelings" },
          { b: "Multi-timeframe", t: "— reading several timeframes together to build confidence before entering or exiting" },
          { b: "Exits", t: "— set your profit target and stop-loss in advance" },
          { b: "Scaling in/out + position sizing", t: "— split entries and exits, and size each position to your risk" }
        ],
        exercise: { b: "Exercise:", t: " write a one-page trading plan (entry / exit / size / risk) before every order" }
      },
      {
        tag: "Module 6",
        badge: "", core: false,
        title: "Portfolio decisions: buy the dip vs. DCA",
        desc: "",
        lessons: [
          { b: "DCA", t: "— buying in regular instalments, a solid base for most people" },
          { b: "Buy the dip", t: "— buying when price falls into a zone you assessed earlier; your edge from reading charts" },
          { b: "One combined system", t: "— when to use which, instead of rigidly picking just one" }
        ],
        exercise: { b: "Exercise (capstone):", t: " pick one stock → write a full plan → run a 1-month simulated investment" }
      },
      {
        tag: "Module 7",
        badge: "Finale · the question everyone asks", core: true,
        title: "Hold long or short — stop asking “how many months?”",
        desc: "Holding time isn't a number to guess in advance — it's the result of your timeframe + strategy + exit conditions.",
        lessons: [
          { b: "Your timeframe sets your holding period", t: "— use a timeframe you can check regularly and the holding period follows" },
          { b: "The “hold until...” rule", t: "— exit when the trend breaks / the target is hit / your reason for buying is gone" },
          { b: "Strategy → holding template", t: "— DCA (years) / swing (weeks to months) / scalp (not for beginners)" },
          { b: "Choose by real time and risk tolerance", t: "— holding longer means sitting through drops, so positions should be smaller" }
        ],
        exercise: { b: "Worksheet:", t: " “how long should I hold this stock?” — answer timeframe → strategy → exit conditions → rough months (last, because it's the result)" }
      }
    ]
  },

  instructor: {
    eyebrow: "Instructor",
    title: "Learn from someone who's been where you are",
    photo: "",
    initial: "M",
    name: "Mark",
    role: "Founder & instructor, INVESTOPIA",
    bio: "I've been investing for about 5 years. I started with Thai stocks completely at random — no charts, no fundamentals, just buying whatever sounded good when other people talked about it. I ended up losing tens of thousands of baht. I watched my own mum invest by guessing too, and at best she broke even. I know many people never start because investing looks hard and confusing — I was confused too. So I built this course to make it simple and hands-on, so beginners don't have to get burned the way I did.",
    cta: "Start learning with us"
  },

  pricing: {
    eyebrow: "Plans",
    title: "Choose the level that fits you",
    sub: "Every plan includes all the core lessons — they differ in how much support you get.",
    packages: [
      {
        id: "monthly",
        name: "Monthly",
        for: "Try it first, no commitment",
        num: "990", numSuffix: "/month", numStrike: "",
        per: "Pay month by month · no auto-renewal",
        feats: [
          { text: "Full access to all lessons", off: false },
          { text: "Q&A in the members' community", off: false },
          { text: "1 group live session + replays", off: false },
          { text: "Priority answers within 24 hours", off: true },
          { text: "Private 1:1 coaching", off: true },
          { text: "Future new courses", off: true }
        ],
        badge: "", badgeType: "best", featured: false,
        btn: "Choose monthly", btnType: "ghost",
        priceLabel: "฿990 / 30 days"
      },
      {
        id: "quarterly",
        name: "3 months",
        for: "Time to finish the course, with lives to review",
        num: "2,490", numSuffix: "", numStrike: "",
        per: "≈ ฿830/month · no auto-renewal",
        feats: [
          { text: "Full access to all lessons", off: false },
          { text: "Q&A in the members' community", off: false },
          { text: "3 group live sessions + replays", off: false },
          { text: "Priority answers within 24 hours", off: true },
          { text: "Private 1:1 coaching", off: true },
          { text: "Future new courses", off: true }
        ],
        badge: "", badgeType: "best", featured: false,
        btn: "Choose 3 months", btnType: "ghost",
        priceLabel: "฿2,490 / 90 days"
      },
      {
        id: "yearly",
        name: "Yearly",
        for: "Serious about learning, with close support all year",
        num: "4,990", numSuffix: "/year", numStrike: "11,880",
        per: "≈ ฿416/month · 58% less than monthly",
        feats: [
          { text: "Full access to all lessons", off: false },
          { text: "Q&A in the members' community", off: false },
          { text: "Monthly group lives + replays", off: false },
          { text: "Priority answers within 24 hours", off: false },
          { text: "2 private 1:1 coaching sessions (1 hour each)", off: false },
          { text: "Every new course released while you're a member", off: false },
          { text: "🎁 Pre-purchase checklist", off: false },
          { text: "🎁 First 50 members: the instructor's trend-reading indicator (worth ฿2,990)", off: false }
        ],
        badge: "Best value ★", badgeType: "best", featured: true,
        btn: "Choose yearly", btnType: "primary",
        priceLabel: "฿4,990 / 1 year"
      },
      {
        id: "vip",
        name: "VIP one-on-one",
        for: "Learn privately with the instructor — deepest and fastest",
        num: "13,990", numSuffix: "", numStrike: "",
        per: "Only 3 places per month",
        feats: [
          { text: "All 8 modules taught 1:1 (8 sessions, 1.5 hours each)", off: false },
          { text: "Full access to the lesson videos too", off: false },
          { text: "Everything in the yearly plan for 1 year", off: false },
          { text: "Priority answers within 24 hours", off: false },
          { text: "🎁 The instructor's trend-reading indicator (worth ฿2,990)", off: false },
          { text: "🎁 Pre-purchase checklist", off: false }
        ],
        badge: "3 places/month", badgeType: "limited", featured: false,
        btn: "Book a VIP place", btnType: "ghost",
        priceLabel: "฿13,990 / 1 year"
      }
    ],
    guarantee: {
      title: "7-day satisfaction guarantee",
      text: "Not happy for any reason? Tell us within 7 days of paying for a full refund. We guarantee your satisfaction with the course — not investment profits. (VIP refunds are available before your first session.)"
    },
    note: "Every plan is a one-time payment per period with no auto-renewal — pay by PromptPay or card · 1:1 sessions are learning coaching, not personalised investment advice"
  },

  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    sub: "The questions people ask most — members can ask more in the community, and the instructor answers every one.",
    items: [
      { q: "I have zero background. Can I keep up?",
        a: "Yes. Module 0 starts by explaining why stock prices move (demand & supply) and assumes you know nothing, then builds up step by step to reading charts with EMA/MACD and planning." },
      { q: "How is this different from free YouTube videos?",
        a: "Free content gives you knowledge; this course gives you a sequence plus exercises. Every module has hands-on practice — opening a real account, writing a real trading plan, and finally a 1-month simulated investment — so you know you can actually do it." },
      { q: "Do you teach EMA or MACD? Which one?",
        a: "Both. EMA covers the popular settings (20/50/100/200) plus the instructor's honest take on how to use them, and MACD covers reading and counting trends — the heart of Module 3." },
      { q: "Will I get new courses?",
        a: "Yearly members get every new course released while their membership is active (for example, a future course on reading financial statements). Monthly members get this course only." },
      { q: "Can I get a refund if I'm not happy?",
        a: "Yes — tell us within 7 days of paying for a full refund, no reason needed. (We guarantee your satisfaction with the course, not investment profits.)" },
      { q: "What can we talk about in 1:1 sessions?",
        a: "They're learning coaching: explaining lessons you're stuck on, reviewing your exercises and the trading plans you write, and ordering your study to suit you — not recommending specific stocks or managing your portfolio." },
      { q: "Will I be charged automatically when it expires?",
        a: "No. Every plan is a one-time payment per period with no auto-renewal. The site reminds you before it expires, and you renew yourself if you want to keep learning." },
      { q: "How do I pay, and is it safe?",
        a: "We accept PromptPay (QR) and credit/debit cards through Stripe. You get access as soon as payment is complete." },
      { q: "Where can I ask questions?",
        a: "Members can ask under each lesson video or in the members' community on this site. The instructor answers every question, and answers stay available for other members. Yearly members get answers within 24 hours." },
      { q: "Will I definitely make a profit after this course?",
        a: "No. This course is general investment education, not personalised investment advice, and returns are not guaranteed. Investing involves risk; you make your own decisions." }
    ],
    qaTitle: "Have another question?",
    qaSub: "Members can ask the instructor directly in the members' community — every question gets an answer.",
    qaButton: "Become a member to ask"
  },

  cta: {
    title: "Ready to go from knowing to doing?",
    sub: "Start today with Module 0 — understand why prices move, and everything on the chart starts to connect.",
    button: "Choose your plan"
  },

  footer: {
    about: "A chart-reading and investing course for beginners who want to actually do it, not just know about it — built around hands-on, purpose-designed exercises.",
    menuTitle: "Menu",
    menu: [
      { text: "Curriculum", href: "#curriculum" },
      { text: "Instructor", href: "#instructor" },
      { text: "Plans",      href: "#pricing" },
      { text: "Dividend calculator", href: "/en/tools/dividend" },
      { text: "FAQ",        href: "#faq" }
    ],
    contactTitle: "Contact",
    contact: [
      { text: "investopia.admin@gmail.com", href: "mailto:investopia.admin@gmail.com" },
      { text: "Facebook",     href: "#" },
      { text: "YouTube",      href: "#" },
      { text: "LINE Official", href: "#" }
    ],
    disclaimerLabel: "Disclaimer:",
    disclaimer: "This website is for general investment education only. Nothing here is investment advice, an offer to buy or sell, or a solicitation to buy any security. Investing involves risk; make your own decisions and accept the consequences. Past price movements and returns do not guarantee future results.",
    copyright: "© 2026 INVESTOPIA. All rights reserved."
  },

  checkout: {
    redirecting: "Taking you to checkout...",
    signInFirst: "Sign in with Google first — we'll take you straight to checkout afterwards",
    vipFull: "Full this month",
    error: "Couldn't open checkout. Please try again or contact us by email.",
    secureNote: "🔒 Payments are processed by Stripe (PromptPay / card) — we never see or store your card details",
    pendingTitle: "Confirming your payment...",
    pendingText: "This usually takes a few seconds. If you paid with PromptPay and it hasn't appeared yet, give it a moment.",
    successTitle: "Payment successful! Welcome to INVESTOPIA 🎉",
    successText: "Your access:",
    until: "until",
    indicatorNote: "🎁 You've received the trend-reading indicator — we'll email you to send it over",
    goLearn: "Go to the classroom →",
    cancelText: "Checkout cancelled — you haven't been charged. You can choose a plan any time.",
    close: "Close"
  },
  planLabels: {
    monthly: "Monthly member",
    quarterly: "3-month member",
    yearly: "Yearly member",
    vip: "VIP member"
  },

  learn: {
    title: "Classroom",
    loading: "Loading...",
    signInTitle: "Sign in to enter the classroom",
    signInText: "The classroom is for members only — sign in with the Google account you used to buy your plan",
    noMemberTitle: "This classroom is for members",
    noMemberText: "This account has no active plan, or the plan has expired. Your progress is saved — renew and pick up right where you left off.",
    seePlans: "See plans",
    welcome: "Welcome to the classroom",
    validUntil: "Valid until",
    expiringBefore: "Your plan expires in",
    expiringAfter: "days — renew before then to keep learning without a break",
    renew: "Renew",
    progressLabel: "Progress",
    stepsUnit: "steps",
    continueBtn: "Continue",
    startBtn: "Start the first lesson",
    allDoneTitle: "You've finished every lesson 🎉",
    allDoneText: "Revisit any lesson, or retake a quiz to review",
    modulesTitle: "All lessons",
    lessonsUnit: "lessons",
    quizTitle: "End-of-module quiz",
    passed: "Passed",
    comingSoon: "Coming soon",
    minutesUnit: "min",
    videoSoonTitle: "Coming soon",
    videoSoonText: "We're still recording this lesson — read the summary below for now. The video will play here once it's ready.",
    videoErrorTitle: "Couldn't load the video",
    videoRetry: "Try again",
    notesTitle: "Lesson summary",
    markDone: "Mark lesson as done",
    doneLabel: "✓ Done",
    undoDone: "Undo",
    prev: "← Previous",
    next: "Next →",
    backToClassroom: "← Classroom",
    practiceTitle: "Hands-on task for this module",
    quizIntro: "Score at least {pass}% to pass · retake as often as you like to review",
    submit: "Submit answers",
    answerAll: "Answer every question before submitting",
    scoreBefore: "You got",
    scoreAfter: "right",
    passedMsg: "Passed! 🎉",
    failedMsg: "Not passed yet — read the explanations and try again",
    retake: "Try again",
    correct: "✓ Correct",
    wrongBefore: "✗ Not quite — the right answer is",
    bestScore: "Best score",
    notFound: "Lesson not found",
    lockedTitle: "This lesson is for members who receive the Indicator",
    lockedText: "The Indicator is a bonus with the Yearly plan (first 50 members) and the VIP plan. If you have it, this lesson opens automatically.",
    lockedBadge: "Indicator holders only",
    askLesson: "Ask about this lesson in the community",
    error: "Couldn't save. Please try again."
  },

  dividend: {
    metaTitle: "Annual Dividend Calculator",
    metaDesc: "Choose your allocation across indexes and funds and see roughly how much dividend you'd get per year after tax — free, no sign-in needed.",
    chip: "Free tool",
    title: "Calculate the yearly dividend of the portfolio you're planning",
    lead: "Enter how much you'd put in each index or fund, and see your total after-tax dividend per year, compared with the target you set.",
    steps: [
      { n: "1", t: "Enter your amount and target", d: "Optional. Without an amount you'll see results as a % only." },
      { n: "2", t: "Enter your share in each row", d: "Rightmost box of each row. They should add up to 100%." },
      { n: "3", t: "Read the summary", d: "After-tax dividend per year and per month, compared with your target." }
    ],
    dataAsOf: "Yield data as of",
    dataNote: "Yields change over time — check the latest figures with the fund issuer before making decisions.",

    inputsTitle: "Your settings",
    amountLabel: "Amount to invest (THB)",
    amountHint: "Optional",
    amountPh: "e.g. 1,000,000",
    targetLabel: "Target dividend per year (%)",
    targetHint: "Optional — enter it to compare with the calculated result",
    targetPh: "e.g. 5",
    reset: "Clear everything",

    listTitle: "Choose your share in each row",
    colYield: "Yield",
    colTax: "Tax",
    colNet: "After tax",
    colShare: "Your share (%)",
    colContrib: "Dividend added to portfolio",
    shareLabel: "Share of",
    topInGroup: "Highest after-tax yield in group",
    groups: {
      thEquity:     { label: "Thai equities", blurb: "Baskets of Thai stocks. Dividends are paid a few times a year; prices move with the market." },
      thBond:       { label: "Thai bonds", blurb: "Pay interest in instalments. Generally, a higher yield means more risk from the issuer." },
      globalEquity: { label: "International dividend equities", blurb: "US and international dividend-stock funds/indexes. Exchange-rate risk applies too." },
      reit:         { label: "REITs (real estate)", blurb: "Funds that own rental property and usually pass most of the income to holders as dividends." },
      usBond:       { label: "US & global bonds", blurb: "Pay interest in instalments. Fund prices move with interest rates." },
      coveredCall:  { label: "Covered call", blurb: "Hold stocks while selling call options for extra income. High payouts, but gains from strong price rises may be capped." }
    },

    resultTitle: "Your result",
    allocated: "Allocated",
    left: "left",
    over: "over",
    expectedLabel: "Dividend per year (after tax)",
    ofPortfolio: "of your whole portfolio",
    perYear: "per year",
    perMonth: "per month (average)",
    baht: "THB",
    needAmount: "Enter an amount to see it in baht",
    vsTarget: "Versus your target",
    reachedMsg: "Target reached ({x}% per year above it)",
    exactMsg: "Exactly on target",
    belowMsg: "{x}% per year below your target",
    warnOver: "Your total is over 100% — reduce it by {x}% before the amounts can be shown.",
    warnUnder: "{x}% is still unallocated (counted as 0% dividend).",
    okFull: "Allocation adds up to 100%",
    mini: "Total",

    cautionTitle: "Before you rely on this result",
    caution: [
      "This is a simulation based on the yields on the date shown. Actual dividends may be higher or lower, and nothing guarantees they'll stay this way.",
      "A high yield does not mean a good investment — it often comes with higher risk, and the fund's price can fall.",
      "Taxes in the table are approximate rates used for the calculation. Your real tax depends on your situation, and fees and exchange-rate effects are not included.",
      "This tool doesn't recommend any allocation or fund — the decisions are yours."
    ],

    learnTitle: "How to read this table",
    learn: [
      { t: "Yield", d: "Dividend (or interest) per year ÷ price. A 4% yield means roughly 4 baht per year for every 100 baht invested." },
      { t: "Tax / after tax", d: "Dividends are taxed before you receive them. For example, a 4% yield with 15% tax leaves 4 × 0.85 = 3.4%." },
      { t: "Dividend added to portfolio", d: "Your share × the after-tax yield. For example, 20% in a row yielding 4% adds 0.8% to your whole portfolio; add up every row." }
    ],

    ctaTitle: "Want to understand why prices rise and fall?",
    ctaText: "Dividends are only half of your return — price moves are the other half. Learn the basics of reading charts and planning your own investments.",
    ctaButton: "See the course",
    backHome: "← Home",
    tools: "Tools"
  },

  community: {
    title: "Community",
    loading: "Loading...",
    signInTitle: "Sign in to join the community",
    signInText: "The community is for members only — sign in with the Google account you used to buy your plan",
    noMemberTitle: "This community is for members",
    noMemberText: "This account has no active plan, or the plan has expired — renew and come right back to the conversation.",
    seePlans: "See plans",
    back: "← Back to community",

    rulesTitle: "House rules",
    rulesShow: "Read the rules",
    rulesHide: "Hide the rules",
    rules: [
      "Ask anything about the lessons and how to read charts",
      "No recommending or asking for buy/sell advice on individual stocks, and we don't review portfolios",
      "No ads, investment-pitch links, or sharing other people's personal information",
      "Images: hide names, account numbers and balances before you post",
    ],

    nameTitle: "Choose the name shown in the community",
    nameText: "A nickname is fine, no need for your real name — others will only see this name (your Google profile photo is never shown).",
    namePh: "Display name (2–20 characters)",
    nameSave: "Save name",
    nameInvalid: "Letters, numbers, spaces and _ . - only, 2–20 characters",
    nameReserved: "That name is reserved for the team. Try another.",
    nameLine: "Posting as",
    nameEdit: "Change name",

    composerPh: "Ask or share something with everyone... (no stock tips on individual stocks)",
    post: "Post",
    posting: "Posting...",
    addImage: "Add image",
    imagesHint: "Up to 3 images · 5 MB each",
    removeImage: "Remove image",
    tagLabel: "Topic",
    tagGeneral: "General",
    tagLesson: "About a lesson",
    lessonPick: "Choose a lesson",
    lessonChip: "Lesson",

    filterAll: "All",
    searchPh: "Search the community",
    searchEmpty: "No posts match this search",
    searchHint: "Type at least 2 characters",
    pinnedLabel: "Pinned",
    empty: "No posts yet — be the first to start the conversation",
    loadMore: "Load more",

    adminBadge: "Instructor",
    edited: "edited",
    like: "Like",
    commentsTitle: "Comments",
    share: "Copy link",
    copied: "Link copied",
    more: "Options",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this permanently?",
    report: "Report",
    reported: "Reported, thank you",
    pin: "Pin",
    unpin: "Unpin",
    hide: "Hide post",
    unhide: "Unhide",
    hiddenLabel: "Hidden",
    reportsLabel: "Reports",
    adminOnlyHint: "(admins only)",
    save: "Save",
    cancel: "Cancel",

    commentPh: "Write a comment...",
    send: "Send",
    noComments: "No comments yet",
    notFound: "This post wasn't found (it may have been deleted or hidden)",

    notifTitle: "Notifications",
    notifMarkAll: "Mark all read",
    notifEmpty: "No notifications yet",
    notifLikePost: "liked your post",
    notifLikeComment: "liked your comment",
    notifComment: "commented on the post",
    notifAdminReply: "The instructor replied to your post",
    notifNewPost: "New post",
    notifUnread: "Unread",

    errGeneric: "That didn't work. Please try again.",
    errRateLimit: "You're posting too fast — wait a moment and try again",
    errImage: "Images must be JPG/PNG/WebP and under 5 MB",
    errTooLong: "That message is too long",
    errEmpty: "You haven't typed anything yet"
  },

  prototypeBanner: "🧪 Test mode — no real money is charged yet (Stripe test cards work)"

};
