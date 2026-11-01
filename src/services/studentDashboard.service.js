import { api } from './api'
import { parseStudentDashboardResponse } from '../schemas/studentDashboard.schema'

export async function getStudentDashboard() {
  const payload = await api('/classes/mine')
  return parseStudentDashboardResponse(payload)
}
