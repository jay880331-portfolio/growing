import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import AppSettings from '@/models/AppSettings'

// 기본 앱 설정
const DEFAULT_APP_SETTINGS = {
  showSubscriptionFeatures: true,
  showCounselorFeatures: true,
  showAICoachFeatures: true,
  isUnderAppStoreReview: false,
  appStoreReviewMode: {
    hideSubscription: false,
    hidePremiumFeatures: false,
    hidePaymentRelated: false,
    customMessage: '',
  },
  features: {
    subscription: true,
    counselor: true,
    aiCoach: true,
    quest: true,
    growthGuide: true,
    reports: true,
    healthAlerts: true,
  },
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // 앱 설정은 모든 사용자가 조회 가능 (UI 표시를 위해)
    let settings = await AppSettings.findOne({})
    
    if (!settings) {
      // 기본 설정 생성
      settings = new AppSettings({
        ...DEFAULT_APP_SETTINGS,
        lastUpdatedBy: 'system'
      })
      await settings.save()
    }

    return NextResponse.json({
      settings
    })
  } catch (error) {
    console.error('앱 설정 조회 오류:', error)
    return NextResponse.json(
      { error: '앱 설정 조회 중 오류가 발생했습니다' },
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

    const updateData = await request.json()

    // 기존 설정 조회 또는 생성
    let settings = await AppSettings.findOne({})
    
    if (!settings) {
      settings = new AppSettings({
        ...DEFAULT_APP_SETTINGS,
        ...updateData,
        lastUpdatedBy: admin.email
      })
    } else {
      // 기존 설정 업데이트
      Object.assign(settings, updateData, {
        lastUpdatedBy: admin.email
      })
    }

    await settings.save()

    console.log('앱 설정 업데이트:', {
      adminEmail: admin.email,
      settings: updateData,
      timestamp: new Date()
    })

    return NextResponse.json({
      message: '앱 설정이 업데이트되었습니다',
      settings
    })
  } catch (error) {
    console.error('앱 설정 업데이트 오류:', error)
    return NextResponse.json(
      { error: '앱 설정 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}