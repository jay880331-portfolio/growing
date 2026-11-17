import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // 쿠키에서 직접 언어 설정 읽기
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'ko';
  
  console.log('🌐 i18n/request - 쿠키에서 읽은 언어:', locale);

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default
  };
});