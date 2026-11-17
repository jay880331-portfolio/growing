'use client'

import { useTranslation } from '@/hooks/useTranslation'

interface AIAnalysis {
  insights: string[]
  suggestions: string[]
  alerts: string[]
  nextRecommendations: string[]
}

interface AIAnalysisModalProps {
  analysis: AIAnalysis
  onClose: () => void
}

export default function AIAnalysisModal({ analysis, onClose }: AIAnalysisModalProps) {
  const { t } = useTranslation()
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              🤖 {t('aiAnalysis.title')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* 인사이트 */}
            {analysis.insights.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  💡 {t('aiAnalysis.insights')}
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {analysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 제안사항 */}
            {analysis.suggestions.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  💚 {t('aiAnalysis.recommendations')}
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 알림 */}
            {analysis.alerts.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                  ⚠️ {t('aiAnalysis.warnings')}
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {analysis.alerts.map((alert, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 다음 추천 */}
            {analysis.nextRecommendations.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                  📝 {t('aiAnalysis.nextRecords')}
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  {analysis.nextRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}