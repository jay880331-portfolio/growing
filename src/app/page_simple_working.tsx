'use client'

import Layout from '@/components/Layout'

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              AI와 함께하는<br />
              <span className="text-primary-600">우리 아이 성장 기록</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              그로잉은 단순한 기록을 넘어, AI 분석을 통해 아이의 성장 단계를 진단하고 맞춤형 솔루션을 제공하는 장기 성장 내비게이션입니다.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}