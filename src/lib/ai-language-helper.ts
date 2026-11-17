import { cookies } from 'next/headers';

export type SupportedLanguage = 'ko' | 'vi';

/**
 * 사용자의 현재 언어 설정을 가져옵니다 (서버 사이드)
 */
export async function getUserLanguage(): Promise<SupportedLanguage> {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('locale')?.value as SupportedLanguage;
    return locale || 'ko';
  } catch (error) {
    console.error('언어 설정 조회 오류:', error);
    return 'ko';
  }
}

/**
 * 사용자의 현재 언어 설정을 가져옵니다 (클라이언트 사이드)
 */
export function getUserLanguageClient(): SupportedLanguage {
  if (typeof window === 'undefined') return 'ko';
  
  try {
    const locale = localStorage.getItem('locale') as SupportedLanguage;
    return locale || 'ko';
  } catch (error) {
    console.error('클라이언트 언어 설정 조회 오류:', error);
    return 'ko';
  }
}

/**
 * AI 프롬프트에 언어 지시사항을 추가합니다
 */
export function addLanguageInstructionToPrompt(prompt: string, language: SupportedLanguage): string {
  const languageInstructions = {
    ko: "한국어로 답변해주세요.",
    vi: "Vui lòng trả lời bằng tiếng Việt."
  };

  const instruction = languageInstructions[language];
  return `${instruction}\n\n${prompt}`;
}

/**
 * 언어별 AI 응답 톤과 스타일 가이드
 */
export const languageStyleGuides = {
  ko: {
    tone: "친근하고 따뜻한 톤으로, 존댓말을 사용하여",
    childcare: "육아 전문가의 조언처럼",
    analysis: "전문적이지만 이해하기 쉽게"
  },
  vi: {
    tone: "Với giọng điệu thân thiện và ấm áp, sử dụng ngôn ngữ lịch sự",
    childcare: "Như lời khuyên của chuyên gia nuôi dạy trẻ",
    analysis: "Chuyên nghiệp nhưng dễ hiểu"
  }
};

/**
 * 언어별 시스템 메시지 템플릿
 */
export const systemMessageTemplates = {
  ko: {
    aiCoach: "당신은 전문적인 AI 육아 코치입니다. 부모들에게 따뜻하고 실용적인 조언을 제공하며, 항상 한국어로 응답합니다. 의학적 응급상황에서는 즉시 전문의 상담을 권하세요.",
    analysis: "당신은 아이의 성장 기록을 분석하는 전문가입니다. 데이터를 바탕으로 통찰력 있는 분석을 제공하며, 항상 한국어로 응답합니다.",
    quest: "당신은 아이의 발달에 도움이 되는 일일 활동을 제안하는 전문가입니다. 연령에 적합하고 실행 가능한 활동을 제안하며, 항상 한국어로 응답합니다."
  },
  vi: {
    aiCoach: "Bạn là một huấn luyện viên AI chuyên nghiệp về nuôi dạy trẻ em. Bạn cung cấp lời khuyên ấm áp và thực tế cho các bậc cha mẹ, và luôn trả lời bằng tiếng Việt. Trong các tình huống y tế khẩn cấp, hãy khuyến nghị tham khảo ý kiến bác sĩ chuyên khoa ngay lập tức.",
    analysis: "Bạn là chuyên gia phân tích hồ sơ phát triển của trẻ em. Bạn cung cấp phân tích sâu sắc dựa trên dữ liệu và luôn trả lời bằng tiếng Việt.",
    quest: "Bạn là chuyên gia đề xuất các hoạt động hàng ngày có lợi cho sự phát triển của trẻ. Bạn đề xuất các hoạt động phù hợp với độ tuổi và có thể thực hiện được, luôn trả lời bằng tiếng Việt."
  }
};