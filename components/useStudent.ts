"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** นักเรียน = มีสิทธิ์ที่ใช้ได้ หรือเป็นแอดมิน (ตรงกับกฎเข้า /learn) · isMember = จ่ายเงินแล้วจริง (ใช้แสดงป้าย) */
export function useStudent(): { isStudent: boolean; isMember: boolean } {
  const { isAuthenticated } = useConvexAuth();
  const member = useQuery(api.payments.myMembership, isAuthenticated ? {} : "skip");
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const isMember = !!member;
  return { isMember, isStudent: isMember || !!me?.admin };
}
