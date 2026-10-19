/* เครื่องมือช่วยของห้องเรียน: เรียงบทเรียน + แบบทดสอบเป็น "ขั้น" ต่อกัน และสร้างลิงก์ */
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Content } from "@/components/ContentContext";

export type Overview = Extract<FunctionReturnType<typeof api.learn.overview>, { status: "ok" }>;
export type Module = Overview["modules"][number];
export type Lesson = Module["lessons"][number];
export type QuizResult = Overview["quizzes"][number];

export type Step =
  | { kind: "lesson"; id: string; module: Module; lesson: Lesson; done: boolean }
  | { kind: "quiz"; id: string; module: Module; result: QuizResult | null; done: boolean };

/** หน้ารวมบทของโมดูล: /learn/module-<id> */
/** หน้ารวมโมดูลของคอร์สกราฟ: /learn/course-chart */
export const COURSE_CHART_STEP = "course-chart";
export const MODULE_PREFIX = "module-";
export const moduleStepId = (moduleId: string) => `${MODULE_PREFIX}${moduleId}`;
/** บทที่ยังไม่มีวิดีโอ = "เร็วๆ นี้" (ยังเรียนไม่ได้ จึงไม่นับในความคืบหน้า) */
export const isSoon = (s: Step): boolean => s.kind === "lesson" && !s.lesson.locked && !s.lesson.hasVideo;

/** ล็อก = บท Indicator ที่ยังไม่ได้สิทธิ์ หรือบทที่ผู้ทดลองเรียนฟรีเปิดไม่ได้ */
export const isLocked = (s: Step): boolean => s.kind === "lesson" && (s.lesson.locked || s.lesson.paywalled);
/** ขั้นที่นับในความคืบหน้า (ไม่นับบทที่ล็อกไว้ให้ผู้ได้ Indicator) */
export const countable = (steps: Step[]): Step[] => steps.filter((s) => !isLocked(s) && !isSoon(s));

export const quizStepId = (moduleId: string) => `${moduleId}-quiz`;
/** หน้าใบประกาศเรียนจบ: /learn/certificate */
export const CERT_STEP = "certificate";

export function buildSteps(data: Overview): Step[] {
  const done = new Set(data.doneLessonIds);
  const results = new Map(data.quizzes.map((r) => [r.moduleId, r]));
  return data.modules.flatMap((m): Step[] => {
    const lessons: Step[] = m.lessons.map((l) => ({ kind: "lesson", id: l.id, module: m, lesson: l, done: done.has(l.id) }));
    if (m.quiz.length === 0) return lessons;
    const result = results.get(m.id) ?? null;
    return [...lessons, { kind: "quiz", id: quizStepId(m.id), module: m, result, done: result?.passed ?? false }];
  });
}

/** ลิงก์ในห้องเรียน: /learn/... */
export function learnPath(C: Content, stepId?: string): string {
  const base = C.locale.base === "/" ? "" : C.locale.base;
  return `${base}/learn${stepId ? `/${stepId}` : ""}`;
}

/** หน้าแรกของภาษาที่กำลังแสดง + ส่วนราคา */
export function pricingPath(C: Content): string {
  return `${C.locale.base === "/" ? "/" : `${C.locale.base}/`}#pricing`;
}
