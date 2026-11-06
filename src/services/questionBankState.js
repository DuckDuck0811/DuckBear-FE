export function filterQuestionLists(saved = [], drafts = [], filters = {}) {
  const { type = 'ALL', status = 'ALL' } = filters
  const matchesType = (question) => type === 'ALL' || question.type === type

  return {
    saved: status === 'DRAFT' ? [] : saved.filter(matchesType),
    drafts: status === 'SAVED' ? [] : drafts.filter(matchesType),
  }
}
