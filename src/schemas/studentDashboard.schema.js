/** Normalize the dashboard API response at the frontend boundary. */
export function parseStudentDashboardResponse(payload) {
  return {
    classes: Array.isArray(payload?.classes) ? payload.classes : [],
    requests: Array.isArray(payload?.requests) ? payload.requests : [],
  };
}

export function isPendingJoinRequest(request) {
  return request?.status === "PENDING" && Boolean(request?.class);
}
