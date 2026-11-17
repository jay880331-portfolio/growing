export function getTargetParentLabel(targetParent: string, t: (key: string) => string): string {
  const parentIcons = {
    'mom': '👩',
    'dad': '👨',
    'grandpa': '👴',
    'grandma': '👵',
    'parents': '👨‍👩',
    'grandparents': '👴👵',
    'both': '👨‍👩',
    'family': '👨‍👩‍👧‍👦'
  };

  const icon = parentIcons[targetParent as keyof typeof parentIcons] || '👨‍👩‍👧‍👦';
  const label = t(targetParent) || t('family');
  
  return `${icon} ${label}: `;
}

export function getQuestStatusLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'completed':
      return t('completed');
    case 'skipped':
      return t('skipped');
    default:
      return t('inProgress');
  }
}