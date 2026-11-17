'use client'

import { useState, useEffect } from 'react'

interface SmartInputFormProps {
  type: string
  childAge?: number
  onSubmit: (data: any) => void
  onCancel: () => void
  isSubmitting?: boolean
}

interface FormData {
  timestamp: string
  data: any
  notes: string
}

export default function SmartInputForm({
  type,
  childAge = 6,
  onSubmit,
  onCancel,
  isSubmitting = false
}: SmartInputFormProps) {
  const [formData, setFormData] = useState<FormData>({
    timestamp: new Date().toISOString().slice(0, 16),
    data: {},
    notes: ''
  })

  // 시간 퀵 버튼들
  const timeQuickButtons = [
    { label: '지금', minutes: 0 },
    { label: '30분 전', minutes: -30 },
    { label: '1시간 전', minutes: -60 },
    { label: '2시간 전', minutes: -120 }
  ]

  const setQuickTime = (minutes: number) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + minutes)
    setFormData(prev => ({
      ...prev,
      timestamp: date.toISOString().slice(0, 16)
    }))
  }

  // AI 추천값 가져오기
  const getAIRecommendations = () => {
    switch (type) {
      case 'sleep':
        const recommendedSleep = childAge <= 3 ? 16 : childAge <= 6 ? 14 : childAge <= 12 ? 13 : 11
        return {
          duration: recommendedSleep,
          durationRange: [recommendedSleep - 2, recommendedSleep + 2],
          quality: 'good'
        }
      case 'meal':
        const recommendedAmount = childAge <= 1 ? 80 : childAge <= 3 ? 120 : childAge <= 6 ? 150 : childAge <= 12 ? 200 : 250
        return {
          amount: recommendedAmount,
          amountRange: [recommendedAmount - 20, recommendedAmount + 30],
          mealType: childAge <= 6 ? 'breast_milk' : 'baby_food'
        }
      default:
        return {}
    }
  }

  const aiRecommendations = getAIRecommendations()

  // 증감 버튼 핸들러
  const adjustValue = (field: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: Math.max(0, (prev.data[field] || 0) + delta)
      }
    }))
  }

  // AI 추천값 적용
  const applyAIRecommendation = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      type,
      timestamp: formData.timestamp,
      data: formData.data,
      notes: formData.notes
    })
  }

  const renderTypeSpecificInputs = () => {
    switch (type) {
      case 'sleep':
        return (
          <div className="space-y-4">
            {/* 수면 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수면 시간 (시간)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustValue('duration', -0.5)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={formData.data.duration || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data: { ...prev.data, duration: parseFloat(e.target.value) || 0 }
                  }))}
                  className="flex-1 text-center border border-gray-300 rounded-lg py-2 px-3"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => adjustValue('duration', 0.5)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  +
                </button>
              </div>
              {/* AI 추천 버튼 */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => applyAIRecommendation('duration', aiRecommendations.duration)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100"
                >
                  💡 추천: {aiRecommendations.duration}시간
                </button>
              </div>
            </div>

            {/* 수면 품질 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수면 품질
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'very_good', label: '매우 좋음', emoji: '😴' },
                  { value: 'good', label: '좋음', emoji: '😊' },
                  { value: 'fair', label: '보통', emoji: '😐' },
                  { value: 'poor', label: '나쁨', emoji: '😣' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyAIRecommendation('quality', option.value)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      formData.data.quality === option.value
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.emoji}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'meal':
        return (
          <div className="space-y-4">
            {/* 식사 종류 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                식사 종류
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'breast_milk', label: '모유', emoji: '🤱' },
                  { value: 'formula', label: '분유', emoji: '🍼' },
                  { value: 'baby_food', label: '이유식', emoji: '🥄' },
                  { value: 'solid_food', label: '고형식', emoji: '🍎' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyAIRecommendation('mealType', option.value)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      formData.data.mealType === option.value
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.emoji}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 양 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                양 (ml/g)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustValue('amount', -10)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  -10
                </button>
                <input
                  type="number"
                  value={formData.data.amount || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    data: { ...prev.data, amount: parseInt(e.target.value) || 0 }
                  }))}
                  className="flex-1 text-center border border-gray-300 rounded-lg py-2 px-3"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => adjustValue('amount', 10)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  +10
                </button>
              </div>
              {/* AI 추천 버튼 */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => applyAIRecommendation('amount', aiRecommendations.amount)}
                  className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100"
                >
                  💡 추천: {aiRecommendations.amount}ml
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg border-2 border-primary-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 시간 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시간
          </label>
          <input
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 mb-2"
          />
          {/* 시간 퀵 버튼 */}
          <div className="flex gap-2">
            {timeQuickButtons.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => setQuickTime(btn.minutes)}
                className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 타입별 입력 필드 */}
        {renderTypeSpecificInputs()}

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            메모
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg py-2 px-3"
            rows={2}
            placeholder="추가 메모..."
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}