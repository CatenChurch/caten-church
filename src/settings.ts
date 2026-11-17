import { drizzle } from 'drizzle-orm/d1';
import { settings as settingsTable } from './db/schema';

/**
 * Site content that used to be hard-coded in the Rails views. Values in the `settings` table
 * override these defaults, so a fresh database renders the same site as before.
 */
export const DEFAULT_SETTINGS = {
  siteName: '茄典教會',
  siteDescription:
    '大家好，這裡是茄典長老基督教會的網站，歡迎會友透過此網站報名活動以及查看教會最新消息!',
  legalName: '財團法人台灣基督長老教會高雄中會茄典教會',
  logoUrl: '/brand.png',
  faviconUrl: '/favicon.png',
  heroImageUrl: 'https://i.imgur.com/trfZZjX.jpg',
  shareImageUrl: 'https://i.imgur.com/Kgv2wwl.jpg',
  phone: '076178379',
  fax: '076191553',
  taxId: '20252897',
  email: 'catenforjesus@gmail.com',
  address: '826-47 高雄市梓官區茄苳里嘉展路 467 號',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3822.8183443691373!2d120.25129795923615!3d22.734788517827976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346e0f351291d611%3A0x875c9a5e732e89d4!2z6Ie654Gj5Z-6552j6ZW36ICB5pWZ5pyDIOiMhOWFuOaVmeacgw!5e0!3m2!1szh-TW!2stw!4v1501388342293',
  sundayService: '每週日 09:50 至 11:30',
  youthFellowship: '每週六 19:00 至 21:00',
  officeHours: '二 - 日 / 09:30 - 18:00',
  facebookUrl: 'https://facebook.com/caten.church.teens',
  youtubeUrl: 'https://youtube.com/channel/UC-MvdM-JEdQUsT5h7Ratc2w',
  lineUrl: 'https://line.me/R/ti/p/%40kfi8062r',
  githubUrl: 'https://github.com/CatenChurch',
  tithingBank: '梓官農會',
  tithingBankCode: '619',
  tithingAccount: '00141211139150',
  /** Google Analytics measurement id; empty disables the tag. */
  gaMeasurementId: '',
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingKey, string>;

/** How the admin settings page groups and labels the settings. */
export const SETTING_GROUPS: {
  title: string;
  note?: string;
  fields: { key: SettingKey; label: string }[];
}[] = [
  {
    title: '基本資料',
    fields: [
      { key: 'siteName', label: '站名' },
      { key: 'siteDescription', label: '網站簡介（搜尋結果與分享時顯示）' },
      { key: 'legalName', label: '法人全名（奉獻戶名）' },
    ],
  },
  {
    title: '聯絡方式',
    fields: [
      { key: 'phone', label: '電話' },
      { key: 'fax', label: '傳真' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: '地址' },
      { key: 'taxId', label: '統一編號' },
      { key: 'mapEmbedUrl', label: 'Google 地圖嵌入網址' },
    ],
  },
  {
    title: '聚會與上班時間',
    fields: [
      { key: 'sundayService', label: '主日崇拜' },
      { key: 'youthFellowship', label: '青少年團契' },
      { key: 'officeHours', label: '上班時間' },
    ],
  },
  {
    title: '網路社群',
    fields: [
      { key: 'facebookUrl', label: 'Facebook' },
      { key: 'youtubeUrl', label: 'YouTube' },
      { key: 'lineUrl', label: 'Line @' },
      { key: 'githubUrl', label: 'GitHub' },
    ],
  },
  {
    title: '奉獻帳號',
    note: '這裡的資料會直接顯示在奉獻方式頁面，改錯會讓奉獻匯到別的帳戶。修改前請再三確認，每次修改都會留下紀錄。',
    fields: [
      { key: 'tithingBank', label: '金融機構' },
      { key: 'tithingBankCode', label: '銀行代碼' },
      { key: 'tithingAccount', label: '帳戶' },
    ],
  },
  {
    title: '圖片與分析',
    fields: [
      { key: 'logoUrl', label: 'Logo 網址' },
      { key: 'faviconUrl', label: 'Favicon 網址' },
      { key: 'heroImageUrl', label: '頁首背景圖網址' },
      { key: 'shareImageUrl', label: '分享預覽圖網址' },
      { key: 'gaMeasurementId', label: 'Google Analytics 評估 ID（例如 G-XXXXXXXXXX）' },
    ],
  },
];

export async function loadSettings(db: D1Database): Promise<Settings> {
  const rows = await drizzle(db).select().from(settingsTable);
  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) merged[row.key as SettingKey] = row.value;
  }
  return merged;
}
