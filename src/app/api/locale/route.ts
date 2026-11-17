import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();
    
    if (!locale || !['ko', 'vi'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set('locale', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1년
      httpOnly: false,
      secure: false, // 개발 환경에서는 false로 설정
      sameSite: 'lax'
    });
    
    console.log('🍪 쿠키 설정 완료:', locale);

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('언어 설정 오류:', error);
    return NextResponse.json({ error: 'Failed to set locale' }, { status: 500 });
  }
}