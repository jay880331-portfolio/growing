import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

// 기본 시스템 설정
const DEFAULT_SETTINGS = {
  aiProvider: 'openai',
  aiModels: {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-1.5-flash'
  },
  rateLimits: {
    free: 50,
    premium: 500
  },
  systemMaintenance: {
    enabled: false,
    message: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.',
    startTime: '',
    endTime: ''
  },
  notifications: {
    email: true,
    push: false,
    sms: false
  },
  dataRetention: {
    logs: 90,
    analytics: 365,
    backups: 30
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const admin = await User.findById(userId)
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 실제 환경에서는 별도 SystemSettings 모델을 사용하거나
    // 환경변수/설정 파일에서 읽어올 수 있습니다
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: process.env.AI_PROVIDER || 'openai',
      aiModels: {
        openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        gemini: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      }
    }

    return NextResponse.json({
      settings
    })
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error)
    return NextResponse.json(
      { error: '시스템 설정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const admin = await User.findById(userId)
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const settings = await request.json()

    // 설정 검증
    if (!settings.aiProvider || !['openai', 'gemini'].includes(settings.aiProvider)) {
      return NextResponse.json(
        { error: '올바른 AI 제공자를 선택해주세요' },
        { status: 400 }
      )
    }

    if (settings.rateLimits.free < 0 || settings.rateLimits.premium < 0) {
      return NextResponse.json(
        { error: '사용량 제한은 0 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // 실제 환경에서는 SystemSettings 모델에 저장하거나
    // 환경변수 파일을 업데이트할 수 있습니다
    console.log('시스템 설정 업데이트:', {
      adminEmail: admin.email,
      settings: settings,
      timestamp: new Date()
    })

    // 사용량 제한이 변경된 경우 모든 사용자의 한도 업데이트
    if (settings.rateLimits) {
      await User.updateMany(
        { 'aiUsage.plan': 'free' },
        { 'aiUsage.monthlyLimit': settings.rateLimits.free }
      )
      
      await User.updateMany(
        { 'aiUsage.plan': 'premium' },
        { 'aiUsage.monthlyLimit': settings.rateLimits.premium }
      )
    }

    return NextResponse.json({
      message: '시스템 설정이 업데이트되었습니다',
      settings
    })
  } catch (error) {
    console.error('시스템 설정 업데이트 오류:', error)
    return NextResponse.json(
      { error: '시스템 설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}