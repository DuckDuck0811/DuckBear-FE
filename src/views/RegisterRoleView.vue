<template>
  <main class="role-page">
    <div class="role-container w-100">
      <!-- Top Navigation & Brand Header -->
      <header class="role-nav d-flex align-center justify-space-between mb-6">
        <v-btn
          variant="tonal"
          color="primary"
          rounded="pill"
          size="small"
          prepend-icon="mdi-arrow-left"
          class="back-btn font-weight-bold"
          @click="router.push('/login')"
        >
          Quay lại Đăng nhập
        </v-btn>

        <div class="brand-badge d-inline-flex align-center ga-2">
          <span class="brand-avatar font-weight-black">D</span>
          <span class="brand-name"
            >Duck<span class="text-blue">Bear</span></span
          >
        </div>
      </header>

      <!-- Page Heading -->
      <div class="role-hero text-center mb-8">
        <h1 class="text-h4 font-weight-black text-primary mb-2">
          Đăng ký tài khoản mới
        </h1>
        <p class="text-body-1 text-secondary mb-0">
          Chọn vai trò để bắt đầu trải nghiệm học tập và giảng dạy cùng DuckBear
        </p>
      </div>

      <!-- 2 Thẻ chọn vai trò -->
      <section class="role-grid" aria-label="Chọn vai trò đăng ký">
        <!-- 1. THẺ HỌC SINH -->
        <v-card
          class="role-card role-card-student"
          elevation="0"
          role="button"
          tabindex="0"
          @click="selectRole('student')"
          @keydown.enter="selectRole('student')"
          @keydown.space.prevent="selectRole('student')"
        >
          <div class="card-badge-wrap text-center mb-3">
            <v-chip
              color="primary"
              variant="tonal"
              size="small"
              class="font-weight-black px-3"
            >
              <v-icon start icon="mdi-school-outline" size="16" />
              DÀNH CHO NGƯỜI HỌC
            </v-chip>
          </div>

          <!-- ICON MASCOT GẤU TRỪU TƯỢNG - HỌC SINH -->
          <div class="mascot-frame student-frame mb-3" aria-hidden="true">
            <svg
              class="mascot-svg"
              viewBox="0 0 260 190"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="studentBgGrad"
                  x1="50"
                  y1="20"
                  x2="210"
                  y2="170"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#F0F7FF" />
                  <stop offset="1" stop-color="#DDF0FF" />
                </linearGradient>
                <linearGradient
                  id="studentPrimaryGrad"
                  x1="90"
                  y1="50"
                  x2="170"
                  y2="160"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#2F7CF6" />
                  <stop offset="1" stop-color="#185FCC" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stop-color="#FFD666" />
                  <stop offset="1" stop-color="#FFA940" />
                </linearGradient>
                <filter
                  id="badgeShadowStudent"
                  x="60"
                  y="24"
                  width="140"
                  height="144"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="10"
                    flood-color="#2F7CF6"
                    flood-opacity="0.14"
                  />
                </filter>
              </defs>

              <!-- Vòng quỹ đạo công nghệ trừu tượng -->
              <circle
                cx="130"
                cy="94"
                r="76"
                stroke="#E0EDFC"
                stroke-width="1.5"
                stroke-dasharray="4 4"
              />
              <circle cx="130" cy="94" r="62" fill="url(#studentBgGrad)" />
              <circle
                cx="130"
                cy="94"
                r="62"
                stroke="#D3E5FA"
                stroke-width="1.5"
              />

              <!-- Thẻ tiến độ học tập hình học bay nổi -->
              <g transform="translate(46, 44)">
                <rect
                  x="0"
                  y="0"
                  width="26"
                  height="26"
                  rx="7"
                  fill="#FFFFFF"
                  stroke="#DCE9F8"
                  stroke-width="1.5"
                />
                <path
                  d="M7 13.5L11 17.5L19 9"
                  stroke="#2F7CF6"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>

              <!-- Huy hiệu tri thức hình học góc phải -->
              <g transform="translate(192, 44)">
                <circle
                  cx="13"
                  cy="13"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#DCE9F8"
                  stroke-width="1.5"
                />
                <polygon
                  points="13,6 15.2,10.6 20,11.3 16.5,14.7 17.3,19.5 13,17.2 8.7,19.5 9.5,14.7 6,11.3 10.8,10.6"
                  fill="url(#goldGrad)"
                />
              </g>

              <!-- BIỂU TƯỢNG GẤU TRỪU TƯỢNG (GEOMETRIC POLAR BEAR) -->
              <g filter="url(#badgeShadowStudent)">
                <!-- Tai gấu hình học tối giản -->
                <circle
                  cx="99"
                  cy="56"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#C8DDF2"
                  stroke-width="2"
                />
                <circle cx="99" cy="56" r="6.5" fill="#E6F0FA" />
                <circle
                  cx="161"
                  cy="56"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#C8DDF2"
                  stroke-width="2"
                />
                <circle cx="161" cy="56" r="6.5" fill="#E6F0FA" />

                <!-- Khối đầu gấu tối giản đa giác bo tròn -->
                <path
                  d="M130 42 C104 42 86 62 86 93 C86 122 105 139 130 139 C155 139 174 122 174 93 C174 62 156 42 130 42 Z"
                  fill="#FFFFFF"
                  stroke="#C8DDF2"
                  stroke-width="2"
                />

                <!-- Mặt phẳng mõm gấu thanh lịch -->
                <ellipse cx="130" cy="107" rx="20" ry="14" fill="#F4F8FD" />
                <!-- Mũi & miệng hình học sắc nét -->
                <polygon points="125,101 135,101 130,107" fill="#1C385C" />
                <path
                  d="M130 107 V112 M126 112 Q130 115 134 112"
                  stroke="#1C385C"
                  stroke-width="2"
                  stroke-linecap="round"
                  fill="none"
                />

                <!-- Đôi mắt hình học tối giản (Capsule dots) -->
                <rect
                  x="109"
                  y="86"
                  width="6.5"
                  height="11"
                  rx="3.25"
                  fill="#1C385C"
                />
                <rect
                  x="144.5"
                  y="86"
                  width="6.5"
                  height="11"
                  rx="3.25"
                  fill="#1C385C"
                />
              </g>

              <!-- Mũ cử nhân hình học sắc sảo -->
              <g transform="translate(130, 42)">
                <polygon
                  points="0,-14 26,-4 0,6 -26,-4"
                  fill="url(#studentPrimaryGrad)"
                />
                <path
                  d="M26 -4 L32 4 L30 14"
                  stroke="url(#goldGrad)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
                <circle cx="30" cy="15" r="2" fill="#FFA940" />
              </g>

              <!-- Khối giáo trình / chevron hình học trừu tượng trước ngực -->
              <g transform="translate(130, 142)">
                <path
                  d="M-40 6 L0 -4 L40 6 L34 20 L0 10 L-34 20 Z"
                  fill="url(#studentPrimaryGrad)"
                />
                <path
                  d="M-36 3 L0 -6 L36 3 L32 16 L0 7 L-32 16 Z"
                  fill="#FFFFFF"
                />
                <line
                  x1="0"
                  y1="-6"
                  x2="0"
                  y2="7"
                  stroke="#DDEBFA"
                  stroke-width="2"
                />
                <line
                  x1="-26"
                  y1="2"
                  x2="-8"
                  y2="-1"
                  stroke="#CCE0F5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="8"
                  y1="-1"
                  x2="26"
                  y2="2"
                  stroke="#CCE0F5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="-24"
                  y1="8"
                  x2="-8"
                  y2="5"
                  stroke="#CCE0F5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="8"
                  y1="5"
                  x2="24"
                  y2="8"
                  stroke="#CCE0F5"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </g>
            </svg>
          </div>

          <!-- Nội dung văn bản -->
          <div class="card-content text-center">
            <h2
              class="role-card-title text-h5 font-weight-black text-primary mb-2"
            >
              Tôi là học sinh
            </h2>
            <p class="role-card-desc text-body-2 text-secondary mb-4">
              Tham gia các lớp học, ôn luyện làm bài tập trực tuyến và khám phá
              kho giáo trình phong phú.
            </p>

            <!-- Danh sách điểm nổi bật -->
            <ul class="role-benefits pa-0 mb-6 text-left">
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium mb-2"
              >
                <v-icon icon="mdi-check-circle" color="primary" size="18" />
                <span>Kho bài giảng & giáo trình chuẩn khung</span>
              </li>
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium mb-2"
              >
                <v-icon icon="mdi-check-circle" color="primary" size="18" />
                <span>Ôn luyện bài tập, kiểm tra & có kết quả tức thì</span>
              </li>
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium"
              >
                <v-icon icon="mdi-check-circle" color="primary" size="18" />
                <span>Theo dõi tiến độ và xếp hạng học tập</span>
              </li>
            </ul>

            <!-- Nút hành động -->
            <v-btn
              color="primary"
              size="large"
              block
              rounded="pill"
              class="role-action-btn font-weight-bold"
            >
              <span>Tiếp tục làm Học sinh</span>
              <v-icon end icon="mdi-arrow-right" class="btn-arrow" />
            </v-btn>
          </div>
        </v-card>

        <!-- 2. THẺ GIÁO VIÊN -->
        <v-card
          class="role-card role-card-teacher"
          elevation="0"
          role="button"
          tabindex="0"
          @click="selectRole('teacher')"
          @keydown.enter="selectRole('teacher')"
          @keydown.space.prevent="selectRole('teacher')"
        >
          <div class="card-badge-wrap text-center mb-3">
            <v-chip
              color="purple"
              variant="tonal"
              size="small"
              class="font-weight-black px-3"
            >
              <v-icon start icon="mdi-human-male-board" size="16" />
              DÀNH CHO GIẢNG DẠY
            </v-chip>
          </div>

          <!-- ICON MASCOT GẤU TRỪU TƯỢNG - GIÁO VIÊN -->
          <div class="mascot-frame teacher-frame mb-3" aria-hidden="true">
            <svg
              class="mascot-svg"
              viewBox="0 0 260 190"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="teacherBgGrad"
                  x1="50"
                  y1="20"
                  x2="210"
                  y2="170"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#F9F6FF" />
                  <stop offset="1" stop-color="#EDE4FF" />
                </linearGradient>
                <linearGradient
                  id="teacherPrimaryGrad"
                  x1="90"
                  y1="50"
                  x2="170"
                  y2="160"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#7C5CFC" />
                  <stop offset="1" stop-color="#5B39C6" />
                </linearGradient>
                <linearGradient
                  id="teacherEmeraldGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop stop-color="#2BC48A" />
                  <stop offset="1" stop-color="#199E6C" />
                </linearGradient>
                <filter
                  id="badgeShadowTeacher"
                  x="60"
                  y="24"
                  width="140"
                  height="144"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="10"
                    flood-color="#7C5CFC"
                    flood-opacity="0.14"
                  />
                </filter>
              </defs>

              <!-- Vòng quỹ đạo công nghệ trừu tượng -->
              <circle
                cx="130"
                cy="94"
                r="76"
                stroke="#EDE5FB"
                stroke-width="1.5"
                stroke-dasharray="4 4"
              />
              <circle cx="130" cy="94" r="62" fill="url(#teacherBgGrad)" />
              <circle
                cx="130"
                cy="94"
                r="62"
                stroke="#E2D4F7"
                stroke-width="1.5"
              />

              <!-- Bảng điều khiển bài giảng & phân tích hình học bay nổi -->
              <g transform="translate(190, 44)">
                <rect
                  x="0"
                  y="0"
                  width="28"
                  height="26"
                  rx="7"
                  fill="#FFFFFF"
                  stroke="#E2D4F7"
                  stroke-width="1.5"
                />
                <!-- Cột biểu đồ thống kê EdTech -->
                <rect
                  x="5.5"
                  y="16"
                  width="3.5"
                  height="5"
                  rx="1"
                  fill="#7C5CFC"
                />
                <rect
                  x="12"
                  y="11"
                  width="3.5"
                  height="10"
                  rx="1"
                  fill="#7C5CFC"
                />
                <rect
                  x="18.5"
                  y="7"
                  width="3.5"
                  height="14"
                  rx="1"
                  fill="url(#teacherEmeraldGrad)"
                />
              </g>

              <!-- Nút ý tưởng sáng tạo / tri thức góc trái -->
              <g transform="translate(44, 44)">
                <circle
                  cx="13"
                  cy="13"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#E2D4F7"
                  stroke-width="1.5"
                />
                <path
                  d="M13 6V8M13 18V20M6 13H8M18 13H20"
                  stroke="#FFB020"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <circle cx="13" cy="13" r="4.5" fill="#FFB020" />
              </g>

              <!-- BIỂU TƯỢNG GẤU TRỪU TƯỢNG (GEOMETRIC EDUCATOR BEAR) -->
              <g filter="url(#badgeShadowTeacher)">
                <!-- Tai gấu hình học tối giản -->
                <circle
                  cx="99"
                  cy="56"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#D7C9F0"
                  stroke-width="2"
                />
                <circle cx="99" cy="56" r="6.5" fill="#F0E8FA" />
                <circle
                  cx="161"
                  cy="56"
                  r="13"
                  fill="#FFFFFF"
                  stroke="#D7C9F0"
                  stroke-width="2"
                />
                <circle cx="161" cy="56" r="6.5" fill="#F0E8FA" />

                <!-- Khối đầu gấu tối giản đa giác bo tròn -->
                <path
                  d="M130 42 C104 42 86 62 86 93 C86 122 105 139 130 139 C155 139 174 122 174 93 C174 62 156 42 130 42 Z"
                  fill="#FFFFFF"
                  stroke="#D7C9F0"
                  stroke-width="2"
                />

                <!-- Mặt phẳng mõm gấu thanh lịch -->
                <ellipse cx="130" cy="107" rx="20" ry="14" fill="#FBF8FE" />
                <!-- Mũi & miệng hình học sắc nét -->
                <polygon points="125,101 135,101 130,107" fill="#2E1B5B" />
                <path
                  d="M130 107 V112 M126 112 Q130 115 134 112"
                  stroke="#2E1B5B"
                  stroke-width="2"
                  stroke-linecap="round"
                  fill="none"
                />

                <!-- Kính mắt hình học kiến trúc tối giản -->
                <rect
                  x="103"
                  y="82"
                  width="21"
                  height="17"
                  rx="5"
                  stroke="#7C5CFC"
                  stroke-width="2.2"
                  fill="rgba(255, 255, 255, 0.45)"
                />
                <rect
                  x="136"
                  y="82"
                  width="21"
                  height="17"
                  rx="5"
                  stroke="#7C5CFC"
                  stroke-width="2.2"
                  fill="rgba(255, 255, 255, 0.45)"
                />
                <line
                  x1="124"
                  y1="90"
                  x2="136"
                  y2="90"
                  stroke="#7C5CFC"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <line
                  x1="88"
                  y1="89"
                  x2="103"
                  y2="89"
                  stroke="#7C5CFC"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <line
                  x1="157"
                  y1="89"
                  x2="172"
                  y2="89"
                  stroke="#7C5CFC"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />

                <!-- Đôi mắt phía sau kính -->
                <circle cx="113.5" cy="90.5" r="3.2" fill="#2E1B5B" />
                <circle cx="146.5" cy="90.5" r="3.2" fill="#2E1B5B" />
              </g>

              <!-- Khối bục giảng / chevron hình học trừu tượng trước ngực -->
              <g transform="translate(130, 142)">
                <path
                  d="M-40 6 L0 -2 L40 6 L32 20 L0 12 L-32 20 Z"
                  fill="url(#teacherPrimaryGrad)"
                />
                <polygon points="0,0 8,13 0,21 -8,13" fill="#FFFFFF" />
                <polygon
                  points="0,3 5,13 0,19 -5,13"
                  fill="url(#teacherEmeraldGrad)"
                />
              </g>
            </svg>
          </div>

          <!-- Nội dung văn bản -->
          <div class="card-content text-center">
            <h2
              class="role-card-title text-h5 font-weight-black text-purple mb-2"
            >
              Tôi là giáo viên
            </h2>
            <p class="role-card-desc text-body-2 text-secondary mb-4">
              Tạo và quản lý lớp học, chia sẻ giáo trình và đồng hành cùng sự
              tiến bộ của học sinh mỗi ngày.
            </p>

            <!-- Danh sách điểm nổi bật -->
            <ul class="role-benefits pa-0 mb-6 text-left">
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium mb-2"
              >
                <v-icon icon="mdi-check-circle" color="purple" size="18" />
                <span>Quản lý sách, giáo trình & bài học thông minh</span>
              </li>
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium mb-2"
              >
                <v-icon icon="mdi-check-circle" color="purple" size="18" />
                <span>Thiết kế bài kiểm tra & chấm điểm tự động</span>
              </li>
              <li
                class="benefit-item d-flex align-center ga-2 text-caption font-weight-medium"
              >
                <v-icon icon="mdi-check-circle" color="purple" size="18" />
                <span>Quản lý danh sách lớp & thống kê kết quả học tập</span>
              </li>
            </ul>

            <!-- Nút hành động -->
            <v-btn
              color="purple"
              size="large"
              block
              rounded="pill"
              class="role-action-btn btn-teacher font-weight-bold"
            >
              <span>Tiếp tục làm Giáo viên</span>
              <v-icon end icon="mdi-arrow-right" class="btn-arrow" />
            </v-btn>
          </div>
        </v-card>
      </section>

      <!-- Footer trang -->
      <footer class="role-footer text-center mt-8">
        <p class="text-caption text-secondary mb-0">
          © 2026 DuckBear Classroom · Nền tảng học tập thông minh & thân thiện
        </p>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function selectRole(roleKey) {
  router.push(`/register/${roleKey}`);
}
</script>

<style scoped>
.role-page {
  min-height: 100vh;
  padding: 36px 20px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at 12% 14%,
      rgba(47, 124, 246, 0.1),
      transparent 32%
    ),
    radial-gradient(
      circle at 88% 86%,
      rgba(124, 92, 252, 0.08),
      transparent 30%
    ),
    #f4f8ff;
}

.role-container {
  max-width: 960px;
  margin: 0 auto;
}

/* Header & Brand */
.role-nav {
  position: relative;
}

.brand-badge {
  color: #217093;
}

.brand-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #217093;
  color: #ffffff;
  font-size: 0.95rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #1d2939;
}

.text-blue {
  color: #2f7cf6;
}

.role-hero h1 {
  letter-spacing: -0.02em;
}

/* Grid vai trò */
.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
}

/* Card vai trò */
.role-card {
  border-radius: 24px !important;
  background: #ffffff !important;
  border: 1.5px solid #e2edfa !important;
  padding: 28px 24px 24px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(47, 124, 246, 0.05) !important;
  transition:
    transform 0.25s cubic-bezier(0.2, 0.8, 0.25, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
  outline: none;
}

.role-card:hover,
.role-card:focus-visible {
  transform: translateY(-6px);
}

.role-card-student:hover,
.role-card-student:focus-visible {
  border-color: #2f7cf6 !important;
  box-shadow: 0 16px 40px rgba(47, 124, 246, 0.14) !important;
}

.role-card-teacher:hover,
.role-card-teacher:focus-visible {
  border-color: #7c5cfc !important;
  box-shadow: 0 16px 40px rgba(124, 92, 252, 0.14) !important;
}

/* Mascot Frame */
.mascot-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease;
}

.mascot-svg {
  width: 100%;
  max-width: 250px;
  height: auto;
}

.role-card:hover .mascot-frame {
  transform: translateY(-2px);
}

/* Typography & Content */
.role-card-title {
  letter-spacing: -0.01em;
}

.text-purple {
  color: #7c5cfc;
}

.role-card-desc {
  min-height: 40px;
  line-height: 1.5;
}

/* Benefits list */
.role-benefits {
  list-style: none;
  background: #f8fbff;
  border: 1px solid #eaf2fc;
  border-radius: 16px;
  padding: 12px 14px !important;
}

.role-card-teacher .role-benefits {
  background: #faf8ff;
  border-color: #f0eafc;
}

.benefit-item {
  color: #344054;
}

/* Nút hành động */
.role-action-btn {
  letter-spacing: 0.01em;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(47, 124, 246, 0.2) !important;
}

.btn-teacher {
  box-shadow: 0 6px 18px rgba(124, 92, 252, 0.2) !important;
}

.btn-arrow {
  transition: transform 0.25s ease;
}

.role-card:hover .btn-arrow {
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 768px) {
  .role-page {
    padding: 20px 14px;
    align-items: flex-start;
  }
  .role-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .role-card {
    padding: 22px 18px 20px;
  }
  .role-hero h1 {
    font-size: 1.5rem !important;
  }
}
</style>
