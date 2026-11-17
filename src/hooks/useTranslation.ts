'use client';

import { useTranslations, useLocale } from 'next-intl';

export function useTranslation() {
  const t = useTranslations();
  const locale = useLocale();
  
  return {
    t,
    locale,
    // 편의 함수들
    common: (key: string) => t(`common.${key}`),
    navigation: (key: string) => t(`navigation.${key}`),
    auth: (key: string) => t(`auth.${key}`),
    dashboard: (key: string) => t(`dashboard.${key}`),
    logs: (key: string) => t(`logs.${key}`),
    settings: (key: string) => t(`settings.${key}`),
    children: (key: string) => t(`children.${key}`),
    aiCoach: (key: string) => t(`aiCoach.${key}`),
    growthGuide: (key: string) => t(`growthGuide.${key}`),
    quests: (key: string) => t(`quests.${key}`),
    reports: (key: string) => t(`reports.${key}`),
    signup: (key: string) => t(`signup.${key}`),
    loginPage: (key: string) => t(`loginPage.${key}`),
    layout: (key: string) => t(`layout.${key}`),
    quickActions: (key: string) => t(`quickActions.${key}`),
    recordSummary: (key: string) => t(`recordSummary.${key}`),
    viewModes: (key: string) => t(`viewModes.${key}`),
    subscription: (key: string) => t(`subscription.${key}`),
    counselors: (key: string) => t(`counselors.${key}`),
    footer: (key: string) => t(`footer.${key}`)
  };
}