import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }
    
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type = data.get('type') as string // 'image' | 'video' | 'audio'
    
    if (!file) {
      return NextResponse.json(
        { error: '파일이 업로드되지 않았습니다' },
        { status: 400 }
      )
    }
    
    // 파일 타입 검증
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/m4a']
    }
    
    const fileType = type as keyof typeof allowedTypes
    if (!fileType || !allowedTypes[fileType]?.includes(file.type)) {
      return NextResponse.json(
        { error: '지원되지 않는 파일 형식입니다' },
        { status: 400 }
      )
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      )
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }
    
    // 고유한 파일명 생성
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`
    const filepath = join(uploadDir, filename)
    
    // 파일 저장
    await writeFile(filepath, buffer)
    
    // 파일 URL 생성
    const fileUrl = `/uploads/${userId}/${filename}`
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename,
      type: fileType,
      size: file.size
    })
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}