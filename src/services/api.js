export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Hàm gọi API dùng native fetch
 * @param {string} path - Đường dẫn API (ví dụ: '/auth/login', '/books')
 * @param {object} options - Cấu hình { method, body, headers }
 * @returns {Promise<any>}
 */
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('accessToken')

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register')
  if (token && !isAuthEndpoint) {
    reqHeaders['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method,
    headers: reqHeaders,
  }

  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  let response
  try {
    response = await fetch(url, options)
  } catch (err) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
  }

  // 401: Chưa đăng nhập hoặc token hết hạn
  if (response.status === 401) {
    if (!isAuthEndpoint) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new Error('Sai email hoặc mật khẩu, hoặc phiên đăng nhập đã hết hạn.')
  }

  // 403: Không đủ quyền
  if (response.status === 403) {
    throw new Error('Bạn không có quyền thực hiện thao tác này')
  }

  // Parse nội dung trả về
  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    try {
      data = await response.text()
    } catch {
      data = null
    }
  }

  // Kiểm tra lỗi nếu status >= 400
  if (!response.ok) {
    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
    if (data && data.message) {
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ')
      } else {
        errorMessage = data.message
      }
    }
    throw new Error(errorMessage)
  }

  return data
}

export default api
