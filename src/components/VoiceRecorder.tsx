'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  onLog?: (logData: any) => void
  childAge?: number
}

export default function VoiceRecorder({ onTranscript, onLog, childAge = 6 }: VoiceRecorderProps) {
  const { t } = useTranslation()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Web Speech API 지원 확인
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'ko-KR'
        
        recognition.onstart = () => {
          setIsListening(true)
        }
        
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript
          setTranscript(text)
          onTranscript(text)
          
          // AI 파싱으로 자동 기록 시도
          parseAndLog(text)
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [onTranscript])

  const parseAndLog = (text: string) => {
    // 연령별 패턴 매칭으로 음성을 파싱
    const getAgeBasedPatterns = () => {
      if (childAge <= 12) {
        // 영아기 패턴
        return [
          {
            regex: /(\d+)(ml|밀리리터|미리)\s*(먹었|마셨|수유)/i,
            type: 'feeding',
            parse: (match: RegExpMatchArray) => ({
              type: 'breast_milk',
              amount: parseInt(match[1])
            })
          },
          {
            regex: /(\d+)(시간|시)\s*(잤|수면|낮잠)/i,
            type: 'sleep',
            parse: (match: RegExpMatchArray) => ({
              duration: parseInt(match[1]),
              quality: 'good'
            })
          },
          {
            regex: /(기저귀|똥|쉬|소변|대변)/i,
            type: 'diaper',
            parse: () => ({
              type: 'mixed',
              condition: 'normal'
            })
          }
        ]
      } else if (childAge <= 36) {
        // 유아기 패턴
        return [
          {
            regex: /(밥|식사|아침|점심|저녁|간식)\s*(먹었|했)/i,
            type: 'meal',
            parse: (match: RegExpMatchArray) => ({
              mealType: match[1].includes('간식') ? 'snack' : 'meal',
              completed: true
            })
          },
          {
            regex: /(놀이|블록|그림|공놀이)\s*(했|놀았)/i,
            type: 'play',
            parse: (match: RegExpMatchArray) => ({
              activity: match[1],
              duration: 30
            })
          },
          {
            regex: /(새로운\s*단어|말했|단어)/i,
            type: 'language',
            parse: () => ({
              type: 'new_word',
              word: ''
            })
          }
        ]
      } else if (childAge <= 72) {
        // 유치원기 패턴
        return [
          {
            regex: /(한글|숫자|영어|공부|학습)\s*(했|배웠)/i,
            type: 'learning',
            parse: (match: RegExpMatchArray) => ({
              subject: match[1],
              activity: 'study'
            })
          },
          {
            regex: /(그림|만들기|노래|악기)\s*(했|그렸|만들었|불렀)/i,
            type: 'creative',
            parse: (match: RegExpMatchArray) => ({
              activity: match[1],
              theme: ''
            })
          },
          {
            regex: /(운동|자전거|공원|수영|축구)\s*(했|탔|갔)/i,
            type: 'physical',
            parse: (match: RegExpMatchArray) => ({
              activity: match[1],
              duration: 30
            })
          }
        ]
      } else {
        // 학령기 이상 패턴
        return [
          {
            regex: /(숙제|공부|시험|학교)\s*(했|봤|갔)/i,
            type: 'school',
            parse: (match: RegExpMatchArray) => ({
              subject: '',
              completed: true
            })
          },
          {
            regex: /(피아노|태권도|독서|취미)\s*(했|연습|읽었)/i,
            type: 'hobby',
            parse: (match: RegExpMatchArray) => ({
              hobby: match[1],
              duration: 30
            })
          }
        ]
      }
    }
    
    const patterns = getAgeBasedPatterns()

    for (const pattern of patterns) {
      const match = text.match(pattern.regex)
      if (match && onLog) {
        const logData = {
          type: pattern.type,
          data: pattern.parse(match),
          notes: `음성 기록: ${text}`,
          timestamp: new Date().toISOString()
        }
        
        setTimeout(() => {
          onLog(logData)
        }, 1000) // 1초 후 자동 기록
        break
      }
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {t('voiceRecording.supportError')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 mb-2">🎤 {t('voiceRecording.title')}</h3>
        <p className="text-xs text-gray-600 mb-4">
          {childAge <= 12 ? (
            '"120ml 먹었어", "2시간 잤어", "기저귀 갈았어" 등으로 말해보세요'
          ) : childAge <= 36 ? (
            '"밥 먹었어", "놀이 했어", "새로운 단어 말했어" 등으로 말해보세요'
          ) : childAge <= 72 ? (
            '"한글 공부했어", "그림 그렸어", "공원에서 놀았어" 등으로 말해보세요'
          ) : (
            '"숙제 했어", "피아노 연습했어", "친구와 놀았어" 등으로 말해보세요'
          )}
        </p>
        
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isListening ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {isListening ? t('voiceRecording.listening') : t('voiceRecorder.clickToStart')}
          </p>
          
          {transcript && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">{t('voiceRecording.recognized')}</p>
              <p className="text-sm text-blue-700 mt-1">"{transcript}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}