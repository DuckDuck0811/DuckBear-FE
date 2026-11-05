export function getTeacherOverviewSummary(data) {
  const grading = data?.grading ?? []
  const upcoming = data?.upcoming ?? []
  const overdue = data?.overdue ?? []
  const joinRequests = data?.joinRequests ?? []

  return {
    grading,
    gradingCount: grading.length,
    upcoming,
    overdue,
    joinRequests,
    totalActions: grading.length + upcoming.length + overdue.length + joinRequests.length,
  }
}
