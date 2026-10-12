// ถ้าไม่มีไฟล์นี้ ระบบจะมองว่าทุกคน "ยังไม่ได้ล็อกอิน" ตลอดโดยไม่มี error
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
