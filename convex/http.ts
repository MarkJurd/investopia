import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// เส้นทางที่ Google ส่งผู้ใช้กลับมาหลังล็อกอิน (/api/auth/callback/google)
auth.addHttpRoutes(http);

export default http;
