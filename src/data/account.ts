import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { profiles } from '../db/schema';

export type Profile = typeof profiles.$inferSelect;

export const SEXES = ['男', '女'] as const;

export const PROFILE_LABELS = {
  name: '姓名',
  sex: '性別',
  birth: '生日',
  idNumber: '身分證字號',
  phone: '電話',
  cellphone: '行動電話',
  emergencyContact: '緊急聯絡人電話',
  address: '地址',
  education: '學歷',
} as const;

export type ProfileField = keyof typeof PROFILE_LABELS;
export type ProfileInput = Record<ProfileField, string>;
export type ProfileErrors = Partial<Record<ProfileField | 'terms', string>>;

const FIELDS = Object.keys(PROFILE_LABELS) as ProfileField[];

/** Trimmed text for every profile field from a submitted form. */
export function readProfileForm(form: Record<string, unknown>): ProfileInput {
  return Object.fromEntries(
    FIELDS.map((field) => [field, typeof form[field] === 'string' ? form[field].trim() : '']),
  ) as ProfileInput;
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Name, sex and birth are required and the terms must be accepted. The ID number is optional
 * but must be well-formed when given.
 */
export function validateProfile(
  input: ProfileInput,
  options: { termsAccepted: boolean },
): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!input.name) errors.name = '請填寫姓名';
  if (!(SEXES as readonly string[]).includes(input.sex)) errors.sex = '請選擇性別';
  if (!input.birth) errors.birth = '請填寫生日';
  else if (!isRealDate(input.birth)) errors.birth = '生日格式應為 2000-01-31';
  else if (input.birth > new Date().toISOString().slice(0, 10)) errors.birth = '生日不能是未來';

  const idNumberOk = /^[a-z][12]\d{8}$/i.test(input.idNumber);
  if (input.idNumber && !idNumberOk) {
    errors.idNumber = '身分證字號為 10 碼：第 1 碼英文字母，第 2 碼 1 或 2，後 8 碼數字';
  }
  if (!options.termsAccepted) errors.terms = '請閱讀並接受隱私條款';
  return errors;
}

export async function findProfile(d1: D1Database, userId: number) {
  const [row] = await drizzle(d1)
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row;
}

export async function saveProfile(d1: D1Database, userId: number, input: ProfileInput) {
  const values = {
    name: input.name,
    sex: input.sex,
    birth: input.birth,
    idNumber: input.idNumber.toUpperCase() || null,
    phone: input.phone || null,
    cellphone: input.cellphone || null,
    emergencyContact: input.emergencyContact || null,
    address: input.address || null,
    education: input.education || null,
  };
  await drizzle(d1)
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...values, updatedAt: new Date().toISOString() },
    });
}
