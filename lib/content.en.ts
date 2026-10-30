/* =============================================================================
 * INVESTOPIA website text — ENGLISH version (shown at /en)
 * =============================================================================
 * Same structure as lib/content.ts (Thai). Edit only the text inside "...".
 * If you add/remove a field in the Thai file, do the same here — TypeScript
 * (npm run build / tsc) will fail pointing at the missing field until both match.
 * Legal: keep the disclaimer; never promise profits or give buy/sell signals.
 * The /admin console is NOT translated (admin: CONTENT.admin is reused in Thai).
 * Course lessons, quizzes and videos are in Thai (they come from the database).
 * ========================================================================== */
import { CONTENT } from "./content";

export const CONTENT_EN: typeof CONTENT = {

  locale: { code: "en", base: "/en", dateLocale: "en-GB", switchLabel: "ไทย", switchHref: "/" },

  brand: {
    name: "INVESTOPIA"
  },

  nav: {
    links: [
      { text: "Courses",     href: "#courses" },
      { text: "For you", href: "#fit" },
      { text: "Instructor",  href: "#instructor" },
      { text: "Pricing",     href: "#pricing" },
      { text: "Tools", href: "/en/tools" },
      { text: "FAQ",         href: "#faq" }
    ],
    primary: "Start learning"
  },

  auth: {
    signIn: "Sign in with Google",
    signInShort: "Sign in",
    signOut: "Sign out",
    classroom: "Classroom",
    community: "Community",
    member: "Member",
    admin: "Admin console"
  },

  hero: {
    eyebrow: "For beginners who want to learn to read charts for investing",
    title: {
      before: "30-day challenge",
      accent: "Finish the course and still can't find support, resistance and your own entries and exits?",
      after: "I refund you 100%"
    },
    lead: "Finish 4 one-to-one sessions and still can't find support and resistance yourself? I refund you in full — 1:1 coaching plan only, conditions apply, no profit guarantee.",
    points: [
      "Understand buying and selling pressure (Demand & Supply) first — the core of every technique",
      "Step by step, from basic chart reading to splitting your entries and exits",
      "Ask the instructor right on the website — no questions lost in a chat"
    ],
    ctaFree: "Try it free",
    ctaFreeHint: "Sign in with Google and open the free lessons right away — no payment needed.",
    ctaPrimary: "See the 4-session guarantee plan",
    photo: "/hero.png",
    badges: [
      { icon: "steps",   text: "Step by step" },
      { icon: "user",    text: "Made for\nbeginners" },
      { icon: "compass", text: "Clear\nprinciples" },
      { icon: "flag",    text: "Real mistakes\nshared" },
      { icon: "bulb",    text: "Easy to follow" },
      { icon: "abc",     text: "No heavy jargon" }
    ],
    chartCaption: "Example — reading a trend from a real chart (EMA line over candlesticks)",
    chartLegend: [
      { color: "ema", text: "EMA line" },
      { color: "up",  text: "Green candle = more buying" },
      { color: "down",text: "Red candle = more selling" }
    ],
    video: {
      youtubeId: "",
      file: "",
      poster: "",
      caption: "Meet the instructor and the course overview",
      placeholderTitle: "Instructor introduction video",
      placeholderText: "Coming soon"
    }
  },

  facts: [
    "🎁 Free trial — no card needed",
    "💬 Ask the instructor on the site",
    "📺 Group live session twice a month",
    "🛡️ 1:1 coaching: 30-day skills guarantee (conditions apply)"
  ],

  courses: {
    eyebrow: "INVESTOPIA courses",
    title: "Choose a course",
    sub: "Open a course to see its lessons and which ones are free. Lessons are taught in Thai.",
    level: "Beginner friendly — no background needed",
    hasFree: "Free lessons available",
    view: "View course →",
    soon: "Coming soon",
    chart: { title: "Chart course", desc: "Trade and invest with a system — you will not need to ask anyone for support and resistance, because it will be in your head.", href: "/en/course/chart" },
    fs: { title: "Financial statements course", desc: "Find good businesses by analysing both quality and numbers, and read financial statements in plain language." },
    usp: "Being good is not enough — it has to be easy to understand and doable.",
    uspSub: "Hands-on exercises, step by step, until you can pick your own entries and exits.",
    page: {
      chip: "Course",
      back: "← Back to home",
      legendFree: "Free",
      legendFreeText: "Sign in and start right away",
      legendMember: "🔒 Members only",
      freeBadge: "Free",
      memberBadge: "🔒 Members only",
      soonBadge: "Coming soon",
      loading: "Loading...",
      memberNoteTitle: "This lesson is for members",
      memberNoteText: "Try the lessons marked “Free” first, or choose a plan to unlock every lesson.",
      seePlans: "See plans",
      cta: "Choose a plan to unlock every lesson"
    }
  },

  fit: {
    eyebrow: "Who is this course for?",
    title: "Check whether this course is right for you",
    sub: "We want you to decide on fit, not on advertising.",
    yesTitle: "It suits you if you...",
    yes: [
      "have no chart knowledge yet and want to learn",
      "only know fundamentals and want to add charts",
      "want to grow your own skills and do things yourself",
      "like plain-language explanations and will practise the exercises"
    ],
    noTitle: "It does not suit you if you...",
    no: [
      "want someone else to hand you support and resistance levels",
      "want the instructor to tell you where to buy",
      "dislike homework and will not practise after learning",
      "already know charts and have a fixed trading system"
    ]
  },

  reviews: {
    eyebrow: "What learners say",
    title: "Real reviews from people who studied with me",
    role: "Learner",
    more: "Read more",
    less: "Show less",
    items: [
      { name: "Net", avatar: "net", photo: "/reviews/net.jpg", text: "I feel he's a young person who stays focused — and I don't even know how old the teacher is, haha 555 — but he also seems really calm. If someone I know wants to learn this, I'd recommend him." },
      { name: "Fang", avatar: "fang", photo: "/reviews/fang.jpg", text: "It's all good. He teaches in a way that's easy to follow, and even people who don't know the terms aren't lost. He focuses on the basics and how to think so you can build on them — if this part is checked and done, what should come next. I think it suits people who want things easy to understand. What I got is the basics you should know, the basics few people go into detail about, like Higher High and Lower Low, and drawing trendlines. Others just tell you to try it, but nobody teaches whether what you did is right. He does, and I love that part. In future I can check by myself whether it's right or wrong, which I don't think other places ever give." },
      { name: "Mike", avatar: "mike", photo: "/reviews/mike.jpg", text: "Great teaching and solid content, exactly what I needed. It's real chart learning where you actually practise." }
    ]
  },

  instructor: {
    eyebrow: "Instructor",
    title: { before: "Learn it, then", accent: "do it yourself", after: "without depending on anyone" },
    photos: ["/instructor-1.png", "/instructor-2.png", "/instructor-3.png", "/instructor-4.png"],
    name: "Mark",
    role: "Founder and instructor, INVESTOPIA",
    bio: "I've been investing for about 5 years. I started with Thai stocks at random — no charts, no fundamentals — buying whatever sounded good when others talked about it. The result was losing tens of thousands of baht. That's when I got serious: I locked myself away to study stock charts and paid tens of thousands of baht for financial statement courses, and I keep investing in my own learning. I wanted to share what I've been through, which became my channel and these courses. People who watch my clips and my students all say I explain things in an easy way. Seeing how many people in Thailand want to start investing, have studied in many places and still don't understand or can't do it for real, I wanted to be the person — and the last person — who helps them with this.",
    cta: "Learn with me"
  },

  pricing: {
    eyebrow: "Plans",
    title: "Choose the plan that fits you",
    sub: "Choose how you want to learn: self-paced from recorded lessons, or 1:1 coaching where the instructor reviews every assignment, backed by a 30-day skills guarantee · Course content is added gradually with no fixed dates; people who already bought never pay extra for what their plan includes.",
    // ⚠️ launch / regular are no longer used (there is no Yearly plan) — keys kept so TypeScript and Pricing.tsx still compile
    launch: {
      deadline: "",
      seats: "",
      closed: "",
      full: ""
    },
    regular: { num: "", per: "", badge: "" },
    rolling: "The Easy Self-Paced plan is a launch-period option and may be withdrawn when more courses are added · Prices may change as content grows; people who already bought pay nothing extra for the period they bought",
    packages: [
      {
        id: "monthly",
        name: "Easy Self-Paced",
        for: "Learn from recorded lessons on your own — no rush, no long commitment",
        num: "990", numSuffix: "/30 days", numStrike: "",
        per: "One payment per 30 days, never auto-charged · launch-period option",
        feats: [
          { text: "Watch the recorded lessons — all open lessons plus lessons added within the 30 days (chart course)", off: false },
          { text: "Q&A in the members community", off: false },
          { text: "Group live session twice a month + replays", off: false },
          { text: "No 1:1 sessions and no individual assignment review", off: true },
          { text: "New courses not included (e.g. the financial statements course)", off: true },
          { text: "No guarantee of results and no refunds — try the free lessons before you buy", off: true }
        ],
        badge: "Launch-period option", badgeType: "limited", featured: false,
        btn: "Choose Easy Self-Paced", btnType: "ghost",
        href: "", priceLabel: "฿990 / 30 days"
      },
      {
        id: "vip",                           // plan id in the system (do not change) — now the ฿4,990 / 30-day 1:1 coaching plan
        name: "Fast-Track 1:1 in 30 Days",
        for: "Want to get good fast, with every assignment reviewed by the instructor",
        num: "4,990", numSuffix: "/30 days", numStrike: "",
        per: "Only 3 seats per month · one payment, never auto-charged",
        feats: [
          { text: "4 one-to-one sessions of 2 hours (one a week) with weekly assignments", off: false },
          { text: "Held online via Zoom or Google Meet", off: false },
          { text: "The instructor reviews every assignment himself and returns it within 24 hours (business days) — every mistake marked and explained, then you fix it until it passes", off: false },
          { text: "30-day goal: find support and resistance and set your own entry and exit points by yourself, using the method you learn", off: false },
          { text: "🛡️ 30-day skills guarantee — meet the conditions and still don't pass, and you get a full refund (this is not a profit guarantee)", off: false },
          { text: "Everything in the Easy Self-Paced plan + quick answers within 24 hours (business days)", off: false },
          { text: "🎁 The instructor's trend-reading Indicator (worth ฿2,990) — for the first 5 buyers", off: false }
        ],
        badge: "Recommended · 3 seats/month", badgeType: "best", featured: true,
        btn: "Reserve a 1:1 seat", btnType: "primary",
        href: "", priceLabel: "฿4,990 / 30 days"
      },
      {
        id: "inperson",                       // not a checkout plan — booked through LINE (has href)
        name: "In-Person 1:1",
        for: "Want to learn face to face — the instructor comes to you or meets you at a cafe, in Bangkok only",
        num: "5,990", numSuffix: "", numStrike: "",
        per: "Book through LINE · live sessions in Bangkok only · place and schedule confirmed with the instructor first",
        feats: [
          { text: "Face-to-face 1:1 coaching, live in Bangkok only (the instructor comes to you, or you meet at a place that suits you)", off: false },
          { text: "Number of sessions, place and schedule are confirmed with the instructor when you book", off: false },
          { text: "Learning coaching only, not personal investment advice", off: false }
        ],
        badge: "In person", badgeType: "limited", featured: false,
        btn: "Book via LINE", btnType: "ghost",
        href: "https://line.me/R/ti/p/@investopia", priceLabel: "฿5,990"
      }
    ],
    guarantee: {
      title: "30-day skills guarantee (Fast-Track 1:1 plan)",
      text: "Attend all 4 sessions, hand in every weekly assignment and fix each one as the instructor marks it — and if you still don't pass the end-of-course test against the criteria announced in advance (finding support and resistance and setting your own entry and exit points), ask for a full refund within 7 days of the result, under the conditions in the terms · We guarantee learning skills, not investment profits (the Easy Self-Paced plan has no guarantee and no refunds)"
    },
    note: "Every plan is a single payment per period with no automatic charge — pay with PromptPay or card · 1:1 sessions are learning coaching, not personal investment advice"
  },

  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    sub: "The questions people ask most — members can ask more in the community, and the instructor answers questions about the course content",
    items: [
      { q: "I have no background at all. Can I keep up?",
        a: "The course starts with the basics of chart reading (candlesticks, trends, Dow Theory, timeframes) and then builds up to indicators, support and resistance, and splitting entries and exits." },
      { q: "How is it different from free YouTube videos?",
        a: "The content is arranged in order and it covers the instructor's own techniques that he actually uses, such as Multi-Timeframe and Double Confirmation — you go module by module without having to piece it together yourself." },
      { q: "Which indicators do you teach?",
        a: "EMA and MACD (the ones the instructor uses most), with RSI to be added — content is being added gradually." },
      { q: "Is all the content open yet?",
        a: "Not yet — this is the launch round and content is added continuously with no fixed dates. Exercises, files and answer clips are added gradually too. Every plan gets what is added during its 30-day access period. The 1:1 coaching plan does not have to wait for lessons to be released, because the instructor takes you through the core skills (reading charts, finding support and resistance, planning entries and exits) within 30 days through the sessions and assignments." },
      { q: "If you release a new course, will I get it?",
        a: "The 1:1 coaching plan includes every new course opened during its 30-day access period (for example the financial statements course, which is in progress with no opening date). The Easy Self-Paced plan does not include new courses and is a launch-period option that may be withdrawn when more courses are added." },
      { q: "Can I get a refund if I'm not happy?",
        a: "1:1 coaching plan: there is a 30-day skills guarantee — if you attend all 4 sessions, hand in every weekly assignment and fix it as the instructor marks until it passes, but still do not pass the end-of-course test against the criteria announced in advance, you can ask for a full refund within 7 days of the result (full conditions are in the terms), and you can also be refunded before the first session · Easy Self-Paced (monthly) plan: no guarantee of results and no refunds, try the free lessons before buying · We guarantee learning skills, not investment profits." },
      { q: "What happens in the 1:1 sessions and the assignment reviews?",
        a: "It is learning coaching — for example explaining lessons you don't understand yet, reviewing every assignment, showing exactly where you went wrong and why, and having you fix it until it passes. It is not advice to buy or sell any particular stock, and we do not manage portfolios." },
      { q: "Will I be charged again when it expires?",
        a: "No — every plan is a single payment per period with no automatic charge. The site reminds you before it expires, and if you want to continue you renew yourself (both plans run for 30 days and must be renewed manually)." },
      { q: "How do I pay, and is it secure?",
        a: "We accept PromptPay (QR) and credit/debit cards. Access opens as soon as payment succeeds." },
      { q: "Where can I ask questions?",
        a: "Members can ask under each lesson video or in the members community on this site. The instructor answers questions about the course content, and answers are kept for other members to read later. 1:1 coaching members aim to get an answer within 24 hours on business days (the Easy Self-Paced plan has no stated response time)." },
      { q: "Will I definitely make a profit after learning?",
        a: "No — this course is “general investing education”, not personal investment advice, and no return is guaranteed. Investing carries risk and you make your own decisions." }
    ],
    qaTitle: "More questions?",
    qaSub: "Members can ask the instructor directly in the members community. The instructor answers questions about the course content.",
    qaButton: "Become a member to ask"
  },

  cta: {
    title: "Ready to go from “knowing” to “doing”?",
    sub: "1:1 coaching in 30 days — the instructor reviews every assignment, backed by a skills guarantee · Only 3 seats per month",
    button: "Choose your plan"
  },

  footer: {
    about: "A course on reading charts and investing for beginners who want to “do” rather than just “know” — hands-on, with purpose-built exercises.",
    menuTitle: "Menu",
    menu: [
      { text: "Curriculum", href: "#curriculum" },
      { text: "Instructor", href: "#instructor" },
      { text: "Plans",      href: "#pricing" },
      { text: "Tools", href: "/en/tools" },
      { text: "FAQ",        href: "#faq" }
    ],
    contactTitle: "Contact",
    contact: [
      { text: "investopia.admin@gmail.com", href: "mailto:investopia.admin@gmail.com" },
      { text: "Facebook",     href: "#" },
      { text: "YouTube",      href: "#" },
      { text: "LINE Official", href: "https://line.me/R/ti/p/@investopia" }
    ],
    disclaimerLabel: "Disclaimer:",
    disclaimer: "This website is for general investment education only. It is not investment advice, an offer to buy or sell, or a solicitation to buy any security. Investing carries risk; investors should decide for themselves and accept the consequences. Price volatility and past returns do not guarantee future results.",
    copyright: "© 2026 INVESTOPIA. All rights reserved."
  },

  checkout: {
    redirecting: "Taking you to checkout...",
    signInFirst: "Sign in with Google first — we will then take you straight to checkout.",
    vipFull: "Full this month",
    launchClosed: "Launch round closed",
    launchFull: "Launch seats are full",
    error: "Could not open checkout. Please try again or email us.",
    secureNote: "🔒 Payment is handled by Stripe (PromptPay / card) — this site never sees or stores your card details",
    pendingTitle: "Confirming your payment...",
    pendingText: "This normally takes a few seconds. If you paid with PromptPay and it hasn't appeared, just wait a moment.",
    successTitle: "Payment successful! Welcome to INVESTOPIA 🎉",
    successText: "Your plan:",
    until: "until",
    indicatorNote: "🎁 You are entitled to the trend-reading Indicator — message LINE @investopia to receive it",
    goLearn: "Go to the classroom →",
    cancelText: "Payment cancelled — you have not been charged. You can choose a plan again any time.",
    close: "Close",
    couponLabel: "Have a discount code?",
    couponPlaceholder: "Enter code",
    couponApply: "Apply",
    couponRemove: "Remove",
    couponApplied: "Code applied",
    couponAfter: "price after code",
    couponInvalid: "That code was not found or is no longer active",
    couponExpired: "This code has expired",
    couponUsedUp: "This code has been used the maximum number of times",
    couponNotForPlan: "This code cannot be used with this plan"
  },
  planLabels: {
    monthly: "Monthly member",
    quarterly: "3-month member",
    yearly: "Yearly member",
    vip: "1:1 coaching member"
  },

  learn: {
    title: "Classroom",
    loading: "Loading...",
    signInTitle: "Sign in to enter the classroom",
    signInText: "The classroom is for members — sign in with the Google account you used to buy a plan.",
    noMemberTitle: "This classroom is for members",
    noMemberText: "This account has no active plan, or the plan has expired — your progress is all saved. Renew and pick up where you left off.",
    seePlans: "See plans",
    welcome: "Welcome to the classroom",
    validUntil: "Valid until",
    expiringBefore: "Your plan expires in",
    expiringAfter: "days — renew before it ends to keep learning without a break.",
    renew: "Renew",
    progressLabel: "Progress",
    stepsUnit: "steps",
    continueBtn: "Continue",
    startBtn: "Start the first lesson",
    allDoneTitle: "You have finished every lesson 🎉",
    allDoneText: "Come back to review any lesson, or retake a quiz to revise.",
    modulesTitle: "Chart course modules",
    coursesTitle: "All courses",
    chartCourse: "Chart course",
    chartCourseSub: "Trade and invest with a system — you will not need to ask anyone for support and resistance, because it will be in your head.",
    fsCourse: "Financial statements course",
    fsCourseSub: "Find good businesses by analysing both quality and numbers",
    courseLevel: "Beginner friendly — no background needed",
    courseHasFree: "Free lessons available",
    courseEnter: "Enter course",
    backToCourses: "← All courses",
    backToCourse: "← Chart course",
    lessonsUnit: "lessons",
    quizTitle: "End-of-module quiz",
    passed: "Passed",
    comingSoon: "Coming soon",
    freeBadge: "Free",
    previewBadge: "Free trial",
    previewText: "You are on the free trial — only lessons marked “Free” are open. Choose a plan to unlock all the others.",
    paywallBadge: "Members only",
    paywallTitle: "This lesson is for members",
    paywallText: "Try the lessons marked “Free” — to open this lesson and all the others, choose a plan with the button below.",
    openLessons: "open:",
    openNow: "Open now",
    rollingNote: "Content is added gradually. Lessons marked “Coming soon” will open when they are ready.",
    minutesUnit: "min",
    videoSoonTitle: "Coming soon",
    videoSoonText: "This lesson's clip is still being made — read the summary below for now, and it will play in this frame when ready.",
    videoErrorTitle: "The video could not be played",
    videoRetry: "Try again",
    notesTitle: "Lesson summary",
    markDone: "Mark this lesson as done",
    doneLabel: "✓ Done",
    undoDone: "Undo",
    prev: "← Previous",
    next: "Next →",
    backToClassroom: "← Classroom",
    practiceTitle: "Hands-on task for this module",
    quizIntro: "Answer at least {pass}% correctly to pass · retake as often as you like to revise",
    submit: "Submit answers",
    answerAll: "Answer every question before submitting",
    scoreBefore: "Score",
    scoreAfter: "correct",
    passedMsg: "Passed! 🎉",
    failedMsg: "Not passed yet — read the explanations and try again",
    retake: "Retake",
    correct: "✓ Correct",
    wrongBefore: "✗ Not quite — the right answer is",
    bestScore: "Best score",
    notFound: "Lesson not found",
    lockedTitle: "This lesson is for people who received the Indicator",
    lockedText: "The Indicator is a bonus for the first 5 buyers of the 1:1 coaching plan — if you are entitled to it, this lesson opens automatically.",
    lockedBadge: "Indicator holders only",
    askLesson: "Ask about this lesson in the community",
    error: "Could not save. Please try again.",
    newBadge: "New",
    newLessonsTitle: "New lessons",
    filesTitle: "Lesson files and links",
    download: "Download",
    openLink: "Open link ↗",
    certCardTitle: "Course completion certificate",
    certCardText: "You have finished every lesson and passed every module quiz — get your certificate.",
    certCardLocked: "Finish every lesson and pass every module quiz to get your completion certificate",
    certOpen: "Open certificate",
    certNotYet: "You can't get the certificate yet — completed so far:",
    certHeading: "Certificate",
    certSub: "This is to certify that",
    certBody: "has completed every lesson of INVESTOPIA's beginner investing course and passed every end-of-module quiz.",
    certDate: "Date completed",
    certIdLabel: "No.",
    certSigner: "Mark · Instructor, INVESTOPIA",
    certNote: "This certificate confirms completion of an online course. It is not a professional licence or qualification.",
    certPrint: "Print / save as PDF",
    certNoName: "Your name"
  },

  dividend: {
    metaTitle: "Annual dividend calculator",
    metaDesc: "Choose your share in each index/fund and see roughly how much dividend you would get per year after tax — free, no sign-in needed.",
    chip: "Free tool",
    title: "Calculate the yearly dividend of the portfolio you are planning",
    lead: "Enter the share you want in each index/fund and see roughly what total dividend you would get per year after tax, compared with your own target right away.",
    steps: [
      { n: "1", t: "Enter your amount and target", d: "Optional — if you skip it you will see results as % only" },
      { n: "2", t: "Enter your share in each row", d: "The right-most box of each row; they should add up to 100%" },
      { n: "3", t: "Read the summary box", d: "Dividend after tax per year and per month, compared with your target" }
    ],
    dataAsOf: "Yield data as of",
    dataNote: "Yields change over time — check the latest data with the fund issuer before making any decision.",

    inputsTitle: "Your settings",
    amountLabel: "Amount invested (baht)",
    amountHint: "Optional",
    amountPh: "e.g. 1,000,000",
    targetLabel: "Yearly dividend target (%)",
    targetHint: "Optional — enter it to compare with the calculated result",
    targetPh: "e.g. 5",
    reset: "Clear everything",

    listTitle: "Choose your share in each item",
    colYield: "Yield",
    colTax: "Tax",
    colNet: "After tax",
    colShare: "Your share (%)",
    colContrib: "Dividend contributed to the portfolio",
    shareLabel: "Share of",
    topInGroup: "Highest after-tax in group",
    groups: {
      thEquity:     { label: "Thai stocks", blurb: "A basket of Thai stocks; dividends paid a few times a year, prices move with the market" },
      thBond:       { label: "Thai government/corporate bonds", blurb: "Pay interest in instalments; generally, higher return = higher issuer risk" },
      globalEquity: { label: "International dividend stocks", blurb: "US and global dividend-stock funds/indices; also carry currency risk" },
      reit:         { label: "REITs (real estate)", blurb: "Funds that hold rental property and usually pay out most income as dividends" },
      usBond:       { label: "US and global bonds", blurb: "Pay interest in instalments; fund prices move with interest rates" },
      coveredCall:  { label: "Covered call", blurb: "Hold shares while selling call options for extra income — high dividend, but gains from a strong price rise can be capped" }
    },

    resultTitle: "Calculated result",
    allocated: "Allocated",
    left: "left",
    over: "over",
    expectedLabel: "Dividend per year (after tax)",
    ofPortfolio: "of the whole portfolio",
    perYear: "per year",
    perMonth: "per month (average)",
    baht: "baht",
    needAmount: "Enter an amount to see it in baht",
    vsTarget: "Versus target",
    reachedMsg: "Target reached ({x}% per year above target)",
    exactMsg: "Exactly on target",
    belowMsg: "Still {x}% per year below target",
    warnOver: "Your shares add up to more than 100% — reduce by {x}% more before baht amounts are shown",
    warnUnder: "{x}% is still unallocated (counted as 0% dividend)",
    okFull: "Shares add up to 100%",
    mini: "Total",

    cautionTitle: "Before you use this result",
    caution: [
      "The numbers are a simulation based on yields at the date shown. Actual dividends may be higher or lower and are not guaranteed to stay this way.",
      "A high yield does not mean good — it often comes with higher risk, and fund prices can fall.",
      "The tax rates in the table are rough rates used for the calculation. Real tax depends on your situation and does not include fees or exchange-rate effects.",
      "This tool does not recommend any allocation or fund — you make the decision."
    ],

    learnTitle: "How to read this table",
    learn: [
      { t: "Yield", d: "Dividend (or interest) per year ÷ price. For example 4% yield = about 4 baht a year for every 100 baht invested." },
      { t: "Tax / after tax", d: "Dividends are taxed before you receive them. For example 4% yield with 15% tax leaves 4 × 0.85 = 3.4%." },
      { t: "Dividend contributed to the portfolio", d: "Share × after-tax dividend. For example 20% in an item that pays 4% = 0.8% of the whole portfolio; then add up all rows." }
    ],

    ctaTitle: "Want to understand why prices move?",
    ctaText: "Dividends are only half of the return; price movement is the other half. Learn the basics of chart reading and plan your investing yourself.",
    ctaButton: "See the curriculum",
    backHome: "← Home",
    tools: "Tools"
  },

  /* 13a) Tools hub (/tools) + stock page (/tools/stock/XXX) + Watchlist — never "buy/sell point", "signal", "recommended" */
  tools: {
    metaTitle: "Stock Tools",
    metaDesc: "Search a US stock once to see price, support & resistance and financials vs peers — plus a Watchlist and dividend calculator",
    title: "Tools",
    lead: "Search a stock once and see its price, support & resistance and financials vs peers on one page.",
    searchLabel: "Search a US stock or ETF",
    searchPh: "Type a ticker or company name, e.g. KO, Apple",
    searchBtn: "Open",
    signInTitle: "Sign in to use the tools",
    signInText: "Free — just sign in with Google first",
    back: "← All tools",
    whatTitle: "What's on a stock page",
    cards: [
      { t: "Price + support & resistance", d: "Latest price, trend, and levels where price has reacted before, with a confidence rating", tag: "Free" },
      { t: "Financials vs peers", d: "6 key ratios compared with companies in the same industry, 5 or 10 years of history", tag: "Free for 5 companies a day · unlimited for members" }
    ],
    dividendTitle: "Portfolio dividend calculator",
    dividendText: "Pick fund/index weights and see your after-tax dividend per year",
    dividendTag: "Free, no sign-in",
    open: "Open →",

    watchTitle: "My Watchlist",
    watchEmpty: "Your Watchlist is empty — open a stock page and tap \"☆ Add to Watchlist\"",
    watchCount: "{x} of {y}",
    watchFree: "Free accounts can watch 3 stocks · members get 20 plus a weekly Telegram summary",
    watchAdd: "☆ Add to Watchlist",
    watchAdded: "★ In Watchlist",
    watchRemove: "Remove",
    watchFull: "Watchlist is full ({x}) — remove one first",
    watchLoading: "Loading prices...",
    watchMissing: "Couldn't load",
    nearSupport: "Nearest support",
    nearResistance: "Nearest resistance",
    tgTitle: "Weekly Watchlist summary on Telegram, every Saturday morning",
    tgText: "Price and nearest support/resistance for each stock in your Watchlist, every week — for learning only, not a trading signal",
    tgConnect: "Connect Telegram",
    tgConnected: "Telegram connected ✓",
    tgDisconnect: "Disconnect",
    tgMemberOnly: "Members only",
    tgNotReady: "Not available yet",
    tgOpened: "Telegram opened — press Start in the bot chat to finish (the link works for 30 minutes)",
    seePlans: "See plans",

    cautionTitle: "Before you use this",
    caution: [
      "All data is historical and from public sources; it may be delayed or inaccurate — check with your broker and the original filings before deciding.",
      "Support and resistance are just areas where price has reacted before; nobody knows where price will stop or break through.",
      "These tools are not trading signals and don't recommend any stock — the decision is yours."
    ]
  },

  /* 13b) Tool: compare financials with peers (/tools/screener) — members only. Tickers/groups + instructor rules in lib/screener.ts */
  screener: {
    sectionTitle: "Financials vs peers",
    quotaUsed: "Free today: {x} of 5 companies viewed",
    quotaOut: "You've viewed 5 companies' financials today — come back tomorrow, or become a member for unlimited access",
    estNote: "≈ = estimated, because the filing doesn't show this line directly (gross profit ≈ revenue − (total costs − SG&A − depreciation) · SG&A ≈ general & admin expense). Other stock-data sites use similar methods; numbers may differ slightly.",
    metaTitle: "Compare Financials with Peers",
    metaDesc: "Search a US stock and compare 6 financial ratios with companies in the same industry — for members",
    chip: "Members",
    title: "Is this business still healthy? Compare its financials with industry peers",
    lead: "Type a ticker to see 6 financial ratios next to its competitors, the group median and the company's own trend — one number alone says little, so read them together.",
    searchLabel: "Ticker or company name (US stocks on NYSE/Nasdaq)",
    searchPh: "e.g. KO, NVDA, Apple",
    searchBtn: "Compare",
    available: "Peer groups set by the instructor (any other stock can be searched)",
    notListed: "{x} not found — type a ticker (e.g. KO) or pick from the list that appears as you type · US stocks on NYSE/Nasdaq only",
    loading: "Loading financial statements...",
    error: "Couldn't load the data. Please try again.",
    failed: "Couldn't load: {x}",
    signInTitle: "Sign in to use this tool",
    signInText: "The peer comparison tool is for members — sign in with the Google account you used to buy your plan",
    noMemberTitle: "This tool is for members",
    noMemberText: "This account has no active plan, or the plan has expired.",
    finance: "This is a financial company (bank/insurer/broker/REIT) — its statements have no cost of sales or gross profit like an ordinary business, so these ratios don't fit well. Use finance-specific measures instead.",
    noData: "No 10-K financials for {x} yet — usually a foreign company filing 20-F, a fund/SPAC, or a newly listed company.",
    noPeers: "No peers with complete financials found in the same industry code, so there is no median to compare with.",
    addPeer: "Add your own peer",
    addHint: "Ticker, e.g. PYPL",
    addBtn: "Add",
    removePeer: "Remove {x}",
    resetPeers: "Reset to default list",
    addNotFound: "{x} was not found on NYSE/Nasdaq or has no 10-K financials yet",
    addDup: "{x} is already in the table",
    addMax: "You can add up to {x} peers",
    addError: "Could not add it. Please try again.",
    sicWarn: "⚠️ These peers were picked automatically from the industry code (SIC {x}) and may not be the same business — remove any that don't fit, or add the right ones below.",
    sicCatchAll: "This code is an \"other\" bucket that mixes many businesses, so the comparison can be far off",
    edited: "You edited the peer list — the median is computed from this list",
    sicPeers: "Peers = companies in the same SEC industry code with the closest revenue (up to 7)",
    seePlans: "See plans",

    group: "Industry group",
    tableTitle: "Peer comparison (each company's latest fiscal year)",
    colCompany: "Company",
    na: "—",
    legend: "Colour only shows direction vs the peer median: green = better · grey = in line · red = weaker (it does not tell you to buy or sell)",
    gapsTitle: "Why some cells have no number (—)",
    why: {
      noItem: {
        revenue: "The filing has no total revenue line the system can read.",
        grossProfit: "No Gross Profit in the filing — some service, restaurant and software companies don't break out cost of sales, so gross profit can't be found (we don't guess).",
        sga: "The filing has no single SG&A line — some companies split it into several items or use another label.",
        operatingIncome: "No operating income line the system can read.",
        interestExpense: "No separate interest expense found — possibly very little debt, or it's reported net of interest income (we don't assume 0 — check the original filing).",
        netIncome: "No net income line the system can read.",
        depreciation: "No separate depreciation found — it may be included in another line.",
        longTermDebt: "No interest-bearing long-term debt found — possibly no debt, or a line label we don't recognise yet (we don't assume 0)."
      },
      loss: {
        revenue: "Revenue is zero or negative, so the ratio can't be computed.",
        grossProfit: "Gross profit is zero or negative — sales didn't cover cost of sales, so the ratio can't be computed (worth reading yourself, not just a blank).",
        operatingIncome: "The business had an operating loss this year, so a ratio to profit can't be computed (worth reading yourself, not just a blank).",
        netIncome: "Net loss this year, so a ratio to profit can't be computed (worth reading yourself, not just a blank)."
      }
    },
    summaryTitle: "Ratio-by-ratio summary for {x}",
    vsPeers: "Vs peers",
    peerMedian: "Peer median",
    trend: "Vs its own {x}-year average",
    avg5: "{x}-yr avg",
    span: "History",
    chartSelf: "{x} (this company)",
    chartAria: "Line chart of {x} vs peer median by year",
    yrs: "{x} years",
    rule: "Instructor's rule",
    noRule: "No rule — compare with peers",
    pass: "Pass",
    fail: "Miss",
    verdict: { better: "Better than group", similar: "In line with group", worse: "Weaker than group" },
    trendWord: { better: "Improving", similar: "Stable", worse: "Weakening" },
    times: "x",

    ratios: {
      gpm:      { name: "Gross Profit Margin", formula: "Gross profit ÷ Revenue", rule: "", d: "Out of every 100 in sales, how much is left as gross profit. High = pricing power or low costs — varies a lot by industry, so compare with peers." },
      sga:      { name: "SG&A ratio", formula: "SG&A expense ÷ Gross profit", rule: "below 30%", d: "How much of gross profit is spent on selling and admin. Lower leaves more as profit." },
      interest: { name: "Interest Expense Ratio", formula: "Interest expense ÷ Operating profit", rule: "below 15%", d: "What share of operating profit goes to interest. Lower means less work done for lenders." },
      npm:      { name: "Net Profit Margin", formula: "Net income ÷ Revenue", rule: "above 20%", d: "Out of every 100 in sales, how much ends up as net profit after everything." },
      dep:      { name: "Depreciation to Revenue", formula: "Depreciation ÷ Revenue", rule: "below 15% (above is high)", d: "How capital-heavy the business is. High = it keeps reinvesting in equipment and buildings to stay in business." },
      debt:     { name: "Long-term Debt ÷ Net Income", formula: "Interest-bearing long-term debt ÷ Net income", rule: "", d: "How many years of profit it would take to repay long-term debt. Lower = less reliance on debt." }
    },

    finTitle: "Condensed financials of {x} (USD millions)",
    fin: {
      revenue: "Revenue", grossProfit: "Gross profit", sga: "SG&A expense", operatingIncome: "Operating income",
      interestExpense: "Interest expense", netIncome: "Net income", depreciation: "Depreciation", longTermDebt: "Interest-bearing long-term debt"
    },
    source: "Source: annual reports (10-K) from SEC EDGAR · last checked {x} (updated automatically every week) · companies' fiscal years may end in different months",
    secLink: "Original filings on SEC",

    cautionTitle: "Before you use this",
    caution: [
      "Numbers are pulled automatically from SEC filings — companies label items differently, so figures may be off. Check the original filing before relying on them.",
      "The instructor's rules are a starting point, not fixed laws — some industries run high or low across the board, so weigh peers and trend too.",
      "Financial statements describe the past; they don't tell you the future share price or returns.",
      "This tool doesn't recommend buying or selling any stock — the decision is yours."
    ]
  },

  /* 13c) Current price + support & resistance (top of the stock page) — free, sign-in required · computed in lib/sr.ts */
  levels: {
    loading: "Loading price...",
    error: "The price data source isn't responding. Please try again in a moment.",
    notFound: "Couldn't find {x}, or it has too little price history — works for US stocks and ETFs (e.g. KO, AAPL, SPY).",
    vsPrev: "vs previous day",
    asOf: "As of {x}",
    marketOpen: "Market open",
    marketClosed: "Market closed — last closing price",
    delayNote: "Prices refresh about once a minute and may be delayed — not real-time.",
    stale: "The data source isn't responding; showing previously stored data.",
    trendLabel: "Trend",
    trend: { up: "Uptrend", down: "Downtrend", sideways: "Sideways" },
    horizon: { short: "Short term (1–7 days)", long: "Long term (2–8 weeks)" },
    ladderTitle: "Support & resistance",
    resistance: "Resistance",
    support: "Support",
    now: "Price now",
    confLabel: "Confidence",
    conf: { 1: "Low", 2: "Medium", 3: "High" },
    confHint: "High confidence = several methods point to the same price, and price has turned around here several times",
    noLevels: "No levels found within a sensible range"
  },

  community: {
    title: "Community",
    loading: "Loading...",
    signInTitle: "Sign in to enter the community",
    signInText: "The community is for members — sign in with the Google account you used to buy a plan.",
    noMemberTitle: "This community is for members",
    noMemberText: "This account has no active plan, or the plan has expired — renew and come right back to the conversation.",
    seePlans: "See plans",
    back: "← Back to the community",

    rulesTitle: "House rules",
    rulesShow: "Read the rules",
    rulesHide: "Hide the rules",
    rules: [
      "Ask freely about the lessons and how to read charts",
      "No recommending or asking for buy/sell advice on individual stocks, and we do not review portfolios",
      "No advertising, investment-recruiting links, or sharing other people's personal information",
      "Attached images: hide names, account numbers and balances before every post"
    ],

    nameTitle: "Set the name shown in the community",
    nameText: "A nickname is fine, no real name needed — others see only this name (your Google profile photo is not shown).",
    namePh: "Display name (2–20 characters)",
    nameSave: "Save name",
    nameInvalid: "Letters, numbers, spaces and _ . - only, 2–20 characters",
    nameReserved: "This name is reserved for the team — try another",
    nameLine: "Posting as",
    nameEdit: "Change name",

    composerPh: "Ask or share something with everyone... (no recommending individual stocks)",
    post: "Post",
    posting: "Posting...",
    addImage: "Add image",
    imagesHint: "Up to 3 images · max 5 MB each",
    removeImage: "Remove image",
    tagLabel: "Topic",
    tagGeneral: "General",
    tagLesson: "Question about a lesson",
    lessonPick: "Choose a lesson",
    lessonChip: "Lesson",

    filterAll: "All",
    searchPh: "Search the community",
    searchEmpty: "No posts match this search",
    searchHint: "Type at least 2 characters",
    pinnedLabel: "Pinned",
    empty: "No posts yet — be the first to start a conversation",
    loadMore: "Load more",

    adminBadge: "Instructor",
    edited: "edited",
    like: "Like",
    commentsTitle: "Comments",
    share: "Share link",
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
    notFound: "This post was not found (it may have been deleted or hidden)",

    notifTitle: "Notifications",
    notifMarkAll: "Mark all as read",
    notifEmpty: "No notifications yet",
    notifLikePost: "liked your post",
    notifLikeComment: "liked your comment",
    notifComment: "commented on a post",
    notifAdminReply: "The instructor replied to your post",
    notifNewPost: "New post",
    notifNewLesson: "A new lesson is out",
    notifUnread: "Unread",

    errGeneric: "That didn't work. Please try again.",
    errRateLimit: "You're posting too often — wait a moment and try again",
    errImage: "Images must be JPG/PNG/WebP and no larger than 5 MB",
    errTooLong: "That message is too long",
    errEmpty: "Nothing typed yet",
    errFile: "Files must be under 50 MB (up to 5 files)",
    errPoll: "A poll needs 2–10 options",
    errPollClosed: "This poll is closed",
    addFile: "Attach file",
    removeFile: "Remove",
    addPoll: "Create poll",
    pollTitle: "Poll (who voted for what stays private)",
    pollOption: "Option",
    pollAddOption: "+ Add option",
    pollMulti: "Allow multiple choices (e.g. voting on dates)",
    pollCloses: "Voting closes on (optional)",
    pollVoters: "voters",
    pollMultiHint: "You can pick several",
    pollClosed: "Voting closed",
    pollClosesAt: "Voting closes",
    pollVoteToSee: "Vote to see the results"
  },

  prototypeBanner: "",

  legal: {
    operator: "Naphat Jurdwichit (ณภัทร เจิดวิจิตร), founder and instructor of INVESTOPIA",
    email: "investopia.admin@gmail.com",
    updatedLabel: "Last updated",
    updated: "23 October 2026",
    chip: "Legal",
    backHome: "← Back to home",
    footerPrivacy: "Privacy policy",
    footerTerms: "Terms of use and refunds",
    checkoutAgreeBefore: "By paying you accept our",
    checkoutAgreeAnd: "and",

    privacy: {
      title: "Privacy policy",
      intro: "INVESTOPIA (\"we\") takes your personal data seriously. This policy explains what we collect, what we use it for, who we share it with, how long we keep it and what rights you have under Thailand's Personal Data Protection Act B.E. 2562 (PDPA). This English text is a translation for convenience; if it differs from the Thai version, the Thai version prevails.",
      sections: [
        { h: "1. Data controller",
          p: ["The data controller of investopiaclass.com is {operator}. For personal data matters contact {email}"], list: [] },
        { h: "2. Data we collect",
          p: ["We collect only what is needed to provide the service:"],
          list: [
            "Google account data when you sign in: name, email and profile picture (we never receive your Google password)",
            "Purchase data: the plan bought, amount paid, discount code used, purchase and expiry dates and the payment reference — we do not see or store your card number or bank account details (Stripe processes payments)",
            "Learning data: lessons completed, quiz results and completion dates (used to show progress and issue certificates)",
            "Community data: your display name (a nickname you choose), posts, comments, images, files, likes, votes and reports",
            "Technical data: what a browser normally sends, such as your IP address and device type, which our hosting and video providers may log briefly for security and delivery",
          ] },
        { h: "3. Purposes and legal bases",
          p: [],
          list: [
            "To let you sign in, learn and use the community under the plan you bought — contract",
            "To take payment, open/cancel access, refund and keep accounting and tax records — contract and legal obligation",
            "To contact you about your learning, scheduling sessions, delivering bonuses (such as the Indicator) or service changes — contract",
            "To keep the service secure, prevent rule-breaking and look after the community — legitimate interests",
            "To send news or marketing promotions — only with your consent, which you can withdraw at any time",
          ] },
        { h: "4. Providers we share data with",
          p: ["We use the following outside providers to run the website. They process data only on our instructions and for our purposes."],
          list: [
            "Google — sign-in",
            "Convex — database, back end, and storage for community images/files and lesson files",
            "Vercel — website hosting",
            "Stripe — payments (cards and PromptPay)",
            "Bunny.net — storing and delivering lesson videos",
            "Telegram — notifying the instructor: when a new community post or comment is made, its text and the author's display name are sent to the instructor through Telegram, and when a purchase is made, the buyer's name, email and plan are sent to the instructor through Telegram",
          ] },
        { h: "5. Transfers abroad",
          p: ["Some of these providers' servers are outside Thailand (for example in the United States), so your data may be stored or processed abroad. We choose providers with internationally standard data protection measures and send only what is needed to provide the service."], list: [] },
        { h: "6. How long we keep data",
          p: [],
          list: [
            "Account data, learning data and community content: kept while you have an account with us (progress is kept even after a plan expires so you can continue when you renew) and deleted when you ask us to delete your account",
            "Purchase data and payment records: kept for at least as long as accounting and tax law requires (generally 5 years), even if you ask us to delete your account",
            "Deleted posts: removed from the system together with attached images and files",
          ] },
        { h: "7. Your rights",
          p: ["You have these rights under the PDPA. Send a request to {email} and we will reply within 30 days."],
          list: [
            "Ask to access and receive a copy of your data",
            "Ask us to correct your data",
            "Ask us to delete or anonymise your data (except data the law requires us to keep)",
            "Ask us to suspend use of, or object to processing of, your data",
            "Ask for your data to be transferred",
            "Withdraw any consent you gave, at any time",
            "Complain to the Personal Data Protection Committee if you believe we have not complied with the law",
          ] },
        { h: "8. Cookies and browser storage",
          p: ["The website uses browser storage (such as local storage) only as needed to remember your sign-in and the plan you chose while you go to sign in. We currently use no advertising cookies or third-party behaviour-tracking tools. If we add any, we will tell you and ask for consent first."], list: [] },
        { h: "9. Data security",
          p: ["We use encrypted connections (HTTPS), check access rights on the server every time before giving access to member content, and limit back-end access to administrators. No system is 100% secure, however. If a data breach that risks your rights occurs, we will notify the Personal Data Protection Committee and you as the law requires."], list: [] },
        { h: "10. Minors",
          p: ["This service is designed for adults. If you are under 20, you should have a parent or guardian's consent before signing up and paying."], list: [] },
        { h: "11. Changes to this policy",
          p: ["We may update this policy from time to time and will show the last-updated date at the top. For significant changes we will let members know through the website."], list: [] },
      ],
    },

    terms: {
      title: "Terms of use and refunds",
      intro: "These terms apply to your use of investopiaclass.com and to buying INVESTOPIA course plans. Signing up or paying means you have read and accepted them. This English text is a translation for convenience; if it differs from the Thai version, the Thai version prevails and is the legally binding one.",
      sections: [
        { h: "1. Service provider",
          p: ["This service is operated by {operator}. Contact: {email}"], list: [] },
        { h: "2. Nature of the service: education only",
          p: ["INVESTOPIA is an online course teaching basic investing and chart reading. All content, including videos, documents, the community, live sessions, 1:1 coaching and the Indicator, is for educational purposes only."],
          list: [
            "It is not personal investment advice, nor an offer or solicitation to buy or sell any security or asset",
            "We do not manage or review portfolios and do not tell you to buy or sell any stock",
            "The Indicator is a trend-reading aid for learning, not a buy/sell signal",
            "Investing carries risk; past returns do not guarantee future results. Your investment decisions and their outcomes are your own responsibility",
            "We do not guarantee any profit or return from using what you learn",
          ] },
        { h: "3. Your account",
          list: [
            "Sign in with your own Google account — 1 account per person",
            "Do not share your account, resell it or let others use your access. If we find this we may suspend access without a refund",
            "You are responsible for the security of your own Google account",
          ], p: [] },
        { h: "4. Plans and payment",
          list: [
            "The price and benefits of each plan are as shown on the plans page on the date you pay",
            "A single payment per period, with no automatic charge. When the period ends, access expires and you can renew by paying again (continuing from the previous expiry date if it is the same plan)",
            "Payment is made through Stripe by card or PromptPay. Access opens automatically when payment succeeds",
            "Limited bonuses (for example the Indicator for the first 5 buyers of the 1:1 coaching plan) are counted in the order of successful payments",
            "Course content (videos, exercises, files, answer clips and new courses) is added gradually with no fixed dates. Lessons not yet open show “Coming soon”. Buyers get content added later while their access has not expired, according to their plan",
            "The Easy Self-Paced plan (monthly, ฿990 / 30 days) is a launch-period option: you learn on your own from recorded lessons, covering only the chart course. It does not include new courses (for example the financial statements course), 1:1 sessions or individual assignment review, and it does not guarantee results. We may change its price or stop selling it when more courses are added, without affecting people who have already paid until their 30 days end",
            "An Easy Self-Paced (monthly) member who wants to switch to the 1:1 coaching plan may ask for the latest monthly payment to be deducted while their monthly access has not expired, by contacting us by email before paying",
            "Answers and assignment reviews within 24 hours are a target on business days and may be slower on holidays or in unforeseen circumstances. If the instructor is late reviewing, we extend the deadline or access period by the delay. For the twice-monthly group live session, the instructor may reschedule with reasonable notice",
            "The 1:1 coaching plan (฿4,990 / 30 days) accepts a limited number of people per month as announced. It includes 4 one-to-one sessions of about 2 hours each, one per week, with weekly assignments. Dates are agreed between learner and instructor, and all sessions must be used within the 30-day access period (counted from the payment date)",
            "Discount codes are valid under each code's conditions (plan, number of uses and expiry date) and cannot be exchanged for cash",
          ], p: [] },
        { h: "5. Skills guarantee and refunds",
          p: ["We guarantee learning skills (only for the 1:1 coaching plan, under the conditions below), not investment profits."],
          list: [
            "1:1 coaching plan (30-day skills guarantee): a full refund can be requested within 7 days of the end-of-course test result when every condition below is met",
            "1:1 condition 1: you attended all 4 sessions (sessions can be rescheduled by agreement, but all must be completed within the 30-day access period)",
            "1:1 condition 2: you handed in every weekly assignment and fixed each one as the instructor marked it until it passed",
            "1:1 condition 3: you took the end-of-course test and did not meet the criteria announced in advance (finding support and resistance and setting your own entry and exit points on charts you have not seen before, using the method taught in the course)",
            "1:1 condition 4: one refund request per account. We check against your assignments, test result and progress in the system",
            "This guarantee covers learning skills only. It does not take into account the results, profits or losses of your actual investing",
            "Easy Self-Paced (monthly) plan: no guarantee of results and no refunds, because the period is short and free lessons are available to try before you buy",
            "All plans: if you are charged twice, or cannot access the course because of a system fault, we will always fix it or refund the relevant amount",
            "1:1 coaching plan: a full refund can be requested before the first session; once the first session has started, a refund is possible only under the skills guarantee conditions above",
            "How to request a refund: email {email} from the email address used to buy, stating the purchase date",
            "We refund through the original payment method; how long the money takes to arrive depends on the bank or card issuer",
            "Once refunded, access to that plan (including any bonus) ends immediately",
            "If access is suspended for breaking these terms (for example sharing an account or copying content for distribution), no refund is possible",
          ] },
        { h: "6. Intellectual property",
          list: [
            "Videos, documents, quizzes, worksheets, the Indicator and all content are the copyright of INVESTOPIA",
            "Use is for your personal learning only. Do not screen-record, download videos, copy, sell, distribute or republish in any way",
            "Lesson files offered for download may be used only for your own learning",
          ], p: [] },
        { h: "7. Community rules",
          list: [
            "Do not recommend or urge buying or selling individual stocks; no advertising or selling; no unlawful, abusive or other-people-violating content",
            "Hide personal information (account numbers, balances, etc.) before posting images",
            "You own what you post, and you allow us to display it in the community",
            "Moderators may hide or delete content that breaks the rules and suspend repeat offenders",
          ], p: [] },
        { h: "8. Changes to content and service",
          list: [
            "We may improve, add or reorder lessons for learning quality. Lessons marked \"Coming soon\" will open gradually when ready",
            "We try to keep the website available at all times, but there may be maintenance or outages caused by outside providers",
          ], p: [] },
        { h: "9. Limitation of liability",
          p: ["To the extent the law allows, we are not responsible for damage or investment losses resulting from using the content, and our total liability to you will not exceed the amount you paid for the plan concerned. This does not remove any right you have under consumer protection law."], list: [] },
        { h: "10. Changes to these terms and governing law",
          p: ["We may update these terms and will show the last-updated date at the top. Changes do not affect the plan you have already paid for. These terms are governed by Thai law."], list: [] },
        { h: "11. Contact us",
          p: ["For questions about these terms or refunds, contact {email}"], list: [] },
      ],
    },
  },

  admin: CONTENT.admin,
};
