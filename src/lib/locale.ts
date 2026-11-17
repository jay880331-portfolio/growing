'use server';

import { cookies } from 'next/headers';

export type Locale = 'ko' | 'vi';

const defaultLocale: Locale = 'ko';

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  console.log('🌍 getUserLocale - 쿠키에서 가져온 언어:', locale, '기본값:', defaultLocale);
  return locale ?? defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale);
}