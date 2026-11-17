'use client';

import { useState, useTransition } from 'react';
import { type Locale } from '@/lib/locale';

interface LanguageSelectorProps {
  currentLocale: Locale;
  onLanguageChange?: () => void;
}

const languages = [
  { code: 'ko' as Locale, name: '한국어', flag: '🇰🇷' },
  { code: 'vi' as Locale, name: 'Tiếng Việt', flag: '🇻🇳' }
];

export default function LanguageSelector({ currentLocale, onLanguageChange }: LanguageSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (locale: Locale) => {
    console.log('🔄 언어 변경 시도:', locale);
    startTransition(async () => {
      try {
        // API를 통해 서버 쿠키 설정
        const response = await fetch('/api/locale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locale }),
        });

        console.log('📡 API 응답:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ 언어 설정 성공:', data);
          
          // 로컬 스토리지에도 저장 (클라이언트 사이드 참조용)
          localStorage.setItem('locale', locale);
          console.log('💾 로컬 스토리지에 저장:', locale);
          
          if (onLanguageChange) {
            onLanguageChange();
          }
          
          // 잠깐 기다린 후 페이지 새로고침
          setTimeout(() => {
            console.log('🔄 페이지 새로고침 중...');
            window.location.reload();
          }, 100);
        } else {
          console.error('❌ 언어 설정 실패:', response.status);
        }
      } catch (error) {
        console.error('❌ 언어 변경 오류:', error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {currentLocale === 'ko' ? '언어 설정' : 'Cài đặt ngôn ngữ'}
      </h3>
      <div className="space-y-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            disabled={isPending}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              currentLocale === language.code
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </div>
            {currentLocale === language.code && (
              <span className="text-primary-600">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
      {isPending && (
        <p className="text-sm text-gray-500">
          {currentLocale === 'ko' ? '언어를 변경하는 중...' : 'Đang thay đổi ngôn ngữ...'}
        </p>
      )}
    </div>
  );
}