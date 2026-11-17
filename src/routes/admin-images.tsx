import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Hono } from 'hono';
import { getSettings, setFlash, type AppEnv } from '../app';
import { settingChanges, settings as settingsTable } from '../db/schema';
import { DEFAULT_SETTINGS, type SettingKey } from '../settings';

/** Site images an admin can replace by uploading a file. */
export const IMAGE_SETTINGS: { key: SettingKey; label: string; hint: string }[] = [
  { key: 'logoUrl', label: 'Logo', hint: '顯示在左上角站名旁，建議正方形' },
  { key: 'faviconUrl', label: 'Favicon', hint: '瀏覽器分頁上的小圖示，建議正方形 PNG' },
  { key: 'heroImageUrl', label: '頁首背景圖', hint: '每一頁最上方的大圖，建議寬 1600 像素以上' },
];

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const UPLOAD_PREFIX = '/site-files/';

/** The image type by its first bytes, whatever the file name or declared type says. */
export function detectImage(bytes: Uint8Array): { ext: string; contentType: string } | null {
  const starts = (...sig: number[]) => sig.every((byte, i) => bytes[i] === byte);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { ext: 'png', contentType: 'image/png' };
  }
  if (starts(0xff, 0xd8, 0xff)) return { ext: 'jpg', contentType: 'image/jpeg' };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { ext: 'webp', contentType: 'image/webp' };
  }
  return null;
}

/** POST /admin/settings/image; the admin guard is already applied by the caller. */
export function registerImageRoutes(admin: Hono<AppEnv>) {
  admin.post('/settings/image', async (c) => {
    const form = await c.req.parseBody();
    const target = IMAGE_SETTINGS.find((image) => image.key === form.key);
    const file = form.file instanceof File && form.file.size > 0 ? form.file : null;
    const fail = (message: string) => {
      setFlash(c, 'alert', message);
      return c.redirect('/admin/settings');
    };
    if (!target) return fail('不知道要更換哪一張圖片');
    if (!file) return fail('請選擇圖片檔案');
    if (file.size > MAX_IMAGE_BYTES) {
      return fail(`圖片須小於 ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImage(bytes);
    if (!type) return fail('只接受 PNG、JPEG 或 WebP 圖片');

    const current = (await getSettings(c))[target.key];
    const name = `${target.key}-${Date.now()}.${type.ext}`;
    await c.env.FILES.put(`site/${name}`, bytes, {
      httpMetadata: { contentType: type.contentType },
    });

    const value = `${UPLOAD_PREFIX}${name}`;
    const userId = c.get('user')!.id;
    const db = drizzle(c.env.DB);
    const row = { value, updatedBy: userId, updatedAt: new Date().toISOString() };
    await db.batch([
      db
        .insert(settingChanges)
        .values({ key: target.key, oldValue: current, newValue: value, userId }),
      db
        .insert(settingsTable)
        .values({ key: target.key, ...row })
        .onConflictDoUpdate({ target: settingsTable.key, set: row }),
    ]);
    // The image this one replaces is no longer referenced
    if (current.startsWith(UPLOAD_PREFIX)) {
      await c.env.FILES.delete(`site/${current.slice(UPLOAD_PREFIX.length)}`);
    }
    setFlash(c, 'notice', `已更換${target.label}`);
    return c.redirect('/admin/settings');
  });

  admin.post('/settings/image/reset', async (c) => {
    const form = await c.req.parseBody();
    const target = IMAGE_SETTINGS.find((image) => image.key === form.key);
    if (!target) return c.notFound();
    const current = (await getSettings(c))[target.key];
    const db = drizzle(c.env.DB);
    const [stored] = await db.select().from(settingsTable).where(eq(settingsTable.key, target.key));
    if (stored) {
      await db.batch([
        db.insert(settingChanges).values({
          key: target.key,
          oldValue: current,
          newValue: DEFAULT_SETTINGS[target.key],
          userId: c.get('user')!.id,
        }),
        db.delete(settingsTable).where(eq(settingsTable.key, target.key)),
      ]);
      if (current.startsWith(UPLOAD_PREFIX)) {
        await c.env.FILES.delete(`site/${current.slice(UPLOAD_PREFIX.length)}`);
      }
    }
    setFlash(c, 'notice', `${target.label}已恢復預設`);
    return c.redirect('/admin/settings');
  });
}
