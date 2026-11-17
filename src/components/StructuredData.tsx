export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "그로잉 - AI 성장 파트너",
    "description": "AI와 함께하는 우리 아이 성장 기록. 실시간 AI 분석으로 아이의 성장을 더 스마트하게 추적하세요.",
    "url": "https://growing-app.vercel.app",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "author": {
      "@type": "Organization",
      "name": "Growing Team"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150"
    },
    "featureList": [
      "AI 기반 성장 분석",
      "실시간 인사이트 제공", 
      "월령별 맞춤 가이드",
      "이상 패턴 감지",
      "전문가 상담 연결"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}