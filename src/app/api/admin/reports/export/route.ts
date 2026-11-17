import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

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

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const range = searchParams.get('range') || '30d'
    
    // 날짜 범위 설정
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[range as keyof typeof daysMap] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 기본 통계 데이터 조회
    const [totalUsers, activeUsers, recentUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ 
        updatedAt: { $gte: startDate } 
      }),
      User.find({ 
        createdAt: { $gte: startDate } 
      }).select('createdAt email name userType')
    ])

    if (format === 'csv') {
      // CSV 형식으로 내보내기
      const csvHeaders = [
        '날짜',
        '총 사용자',
        '활성 사용자',
        '신규 가입자',
        'AI 요청 수',
        '비용($)'
      ].join(',')

      const csvRows = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const newUsersCount = recentUsers.filter(user => 
          user.createdAt.toISOString().split('T')[0] === dateStr
        ).length

        csvRows.push([
          dateStr,
          totalUsers,
          activeUsers,
          newUsersCount,
          Math.floor(Math.random() * 100) + 50, // 모의 AI 요청 수
          (Math.random() * 10 + 5).toFixed(2) // 모의 비용
        ].join(','))
      }

      const csvContent = [csvHeaders, ...csvRows].join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="system-report-${range}.csv"`
        }
      })
    } else if (format === 'excel') {
      // Excel 형식 (단순 CSV로 대체, 실제로는 xlsx 라이브러리 사용)
      const excelContent = `시스템 리포트 (${range})\n\n` +
        `총 사용자: ${totalUsers}\n` +
        `활성 사용자: ${activeUsers}\n` +
        `기간: ${range}\n` +
        `생성일: ${new Date().toLocaleString('ko-KR')}\n\n` +
        `상세 데이터는 CSV 형식으로 다운로드하세요.`

      return new NextResponse(excelContent, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="system-report-${range}.xls"`
        }
      })
    }

    return NextResponse.json(
      { error: '지원하지 않는 형식입니다' },
      { status: 400 }
    )
  } catch (error) {
    console.error('리포트 내보내기 오류:', error)
    return NextResponse.json(
      { error: '리포트 내보내기 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}