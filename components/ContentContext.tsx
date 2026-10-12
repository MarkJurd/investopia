"use client";

/* ส่งข้อความของภาษาที่กำลังแสดง (ไทย / อังกฤษ) ให้ทุก component ฝั่ง client */
import { createContext, useContext, type ReactNode } from "react";
import { CONTENT } from "@/lib/content";

export type Content = typeof CONTENT;

const ContentContext = createContext<Content>(CONTENT);

export function ContentProvider({ value, children }: { value: Content; children: ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): Content {
  return useContext(ContentContext);
}
