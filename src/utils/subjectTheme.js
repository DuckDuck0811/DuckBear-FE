function normalizeSubject(subject) {
  return String(subject || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('vi')
}

export function getSubjectTheme(subject, gradeLevel) {
  const normalized = normalizeSubject(subject)
  if (normalized.includes('anh') || normalized.includes('english') || normalized.includes('ngoai ngu')) return { code: 'english', start: 'success', end: 'secondary', icon: 'mdi-translate' }
  if (normalized.includes('su') || normalized.includes('history')) return { code: 'history', start: 'pink', end: 'secondary', icon: 'mdi-compass-outline' }
  if (normalized.includes('dia') || normalized.includes('geography')) return { code: 'geography', start: 'error', end: 'secondary', icon: 'mdi-compass-outline' }
  if (normalized.includes('van') || normalized.includes('ngu') || normalized.includes('literature')) return { code: 'literature', start: 'orange', end: 'secondary', icon: 'mdi-feather' }
  if (normalized.includes('toan') || normalized.includes('math')) return { code: 'math', start: 'primary', end: 'secondary', icon: 'mdi-calculator-variant' }
  if (normalized.includes('tin') || normalized.includes('cong nghe') || normalized.includes('technology')) return { code: 'technology', start: 'purple', end: 'secondary', icon: 'mdi-laptop' }
  if (normalized.includes('khoa') || normalized.includes('sinh') || normalized.includes('hoa') || normalized.includes('ly') || normalized.includes('li') || normalized.includes('science')) return { code: 'science', start: 'green', end: 'secondary', icon: 'mdi-flask-outline' }
  return Number(gradeLevel) <= 5
    ? { code: 'default', start: 'yellow', end: 'secondary', icon: 'mdi-star-face' }
    : { code: 'default', start: 'pink', end: 'secondary', icon: 'mdi-book-open-page-variant' }
}

export function subjectThemeStyle(theme) {
  const start = `var(--v-theme-${theme.start})`
  const end = `var(--v-theme-${theme.end})`
  return {
    '--subject-color-start': start,
    '--subject-color-end': end,
    '--subject-cover-color': `color-mix(in srgb, rgb(${start}) 30%, rgb(${end}))`,
  }
}

export function subjectThemeGradient(theme) {
  const variables = subjectThemeStyle(theme)
  return `linear-gradient(135deg, var(--subject-cover-color), rgb(${variables['--subject-color-end']}))`
}
