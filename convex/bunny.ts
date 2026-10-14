/* สร้างลิงก์เล่นวิดีโอจาก Bunny Stream แบบมีลายเซ็น + วันหมดอายุ (Embed View Token Authentication)
 * สูตรตามเอกสารของ Bunny: token = SHA256_HEX( tokenKey + videoId + expires ) · expires = เวลา UNIX หน่วย "วินาที"
 * https://bunny.net/docs/stream/token-authentication
 * ⚠️ tokenKey เป็นความลับ — ตั้งด้วย `npx convex env set BUNNY_TOKEN_KEY ...` เท่านั้น ห้ามอยู่ในโค้ด/แชท */

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function signBunnyEmbedUrl(libraryId: string, tokenKey: string, videoId: string, expires: number): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${tokenKey}${videoId}${expires}`));
  return `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?token=${toHex(digest)}&expires=${expires}`;
}
