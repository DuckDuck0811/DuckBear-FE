<template>
  <main class="login-page">
    <div class="login-container w-100">
      <!-- Card Đăng Nhập Responsive Duy Nhất -->
      <v-card class="login-card pa-0 overflow-hidden" elevation="0">
        <!-- Vùng Gấu Bắc Cực Tương Tác SVG Ở Đỉnh Card -->
        <section class="bear-header" aria-label="Gấu Bắc Cực tương tác">
          <div class="bear-halo" />

          <svg
            class="polar-bear"
            :class="[
              `expression-${expression}`,
              {
                'is-covering': isCovering,
                'is-peeking': isPeeking,
                'is-blinking': blink,
                'has-snow': passwordFocused,
              },
            ]"
            :style="gazeStyle"
            viewBox="0 0 240 210"
            role="img"
            aria-label="Minh họa chú gấu Bắc Cực DuckBear"
          >
            <!-- Nền trời tuyết tròn -->
            <circle class="bear-sky" cx="120" cy="110" r="95" />

            <!-- Đốm tuyết bay nhẹ -->
            <circle class="snow snow-one" cx="48" cy="55" r="3.5" />
            <circle class="snow snow-two" cx="192" cy="68" r="4" />
            <circle class="snow snow-three" cx="188" cy="145" r="3" />
            <circle class="snow snow-four" cx="62" cy="130" r="2.5" />

            <!-- Cơ thể gấu tròn tuyết trắng -->
            <ellipse cx="120" cy="195" rx="68" ry="42" fill="#ffffff" />
            <ellipse cx="120" cy="208" rx="36" ry="16" fill="#d4edf7" />

            <!-- Đầu gấu -->
            <g class="bear-head">
              <!-- Tai trái -->
              <circle cx="69" cy="65" r="22" fill="#ffffff" />
              <circle cx="69" cy="67" r="11" fill="#f8cfd4" />

              <!-- Tai phải -->
              <circle cx="171" cy="65" r="22" fill="#ffffff" />
              <circle cx="171" cy="67" r="11" fill="#f8cfd4" />

              <!-- Mặt gấu trắng -->
              <path
                d="M120 40c-43 0-68 28-68 70 0 38 27 64 68 64s68-26 68-64c0-42-25-70-68-70Z"
                fill="#ffffff"
                stroke="#c7e4ef"
                stroke-width="2.5"
              />

              <!-- Đôi mắt tương tác (bình thường) -->
              <g class="bear-eyes">
                <!-- Mắt trái -->
                <ellipse class="eye-white" cx="94" cy="105" rx="9" ry="11.5" />
                <ellipse class="eye-pupil" cx="94" cy="105" rx="4.2" ry="5.5" />
                <circle class="eye-sparkle" cx="95.5" cy="103" r="1.5" />

                <!-- Mắt phải -->
                <ellipse class="eye-white" cx="146" cy="105" rx="9" ry="11.5" />
                <ellipse
                  class="eye-pupil"
                  cx="146"
                  cy="105"
                  rx="4.2"
                  ry="5.5"
                />
                <circle class="eye-sparkle" cx="147.5" cy="103" r="1.5" />

                <!-- Mi mắt khi chớp -->
                <path class="eye-blink" d="M85 106q9 8 18 0m34 0q9 8 18 0" />
              </g>

              <!-- Mõm gấu -->
              <ellipse cx="120" cy="131" rx="24" ry="17" fill="#fceeed" />
              <!-- Mũi gấu bo tròn với đốm sáng nhỏ xinh -->
              <path
                d="M112 123q8 -6 16 0 q-1 8 -8 8 q-7 0 -8 -8Z"
                fill="#2c4250"
              />
              <ellipse
                cx="118"
                cy="122"
                rx="2.5"
                ry="1.2"
                fill="#ffffff"
                opacity="0.65"
              />
              <!-- Miệng gấu đa biểu cảm -->
              <g class="bear-mouth-group">
                <!-- Miệng cười chúm chím bình thường -->
                <path
                  class="mouth-normal"
                  d="M120 130v2.2m-5.5 0.5q2.8 3.2 5.5 0m0 0q2.8 3.2 5.5 0"
                  fill="none"
                  stroke="#2c4250"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <!-- Miệng chữ O ngạc nhiên khi bị ném tuyết trúng mặt -->
                <g class="mouth-surprised">
                  <ellipse
                    cx="120"
                    cy="133.5"
                    rx="3.6"
                    ry="4.4"
                    fill="#2c4250"
                  />
                  <ellipse cx="120" cy="135" rx="2.2" ry="1.8" fill="#ff99a8" />
                </g>
                <!-- Miệng cười tinh nghịch khi mở lỗ tuyết nhìn trộm -->
                <path
                  class="mouth-peeking"
                  d="M112 131.5q8 6 16 0"
                  fill="none"
                  stroke="#2c4250"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </g>

              <!-- Má hồng đào -->
              <ellipse
                cx="79"
                cy="129"
                rx="9.5"
                ry="5.5"
                fill="#ffb4be"
                opacity=".6"
              />
              <ellipse
                cx="161"
                cy="129"
                rx="9.5"
                ry="5.5"
                fill="#ffb4be"
                opacity=".6"
              />
            </g>

            <!-- HỆ THỐNG NÉM BÓNG TUYẾT TỪNG QUẢ VÀ KHOÉT LỖ PEAK HOLE -->
            <transition name="snow-fall">
              <g
                v-if="passwordFocused"
                :key="snowKey"
                class="snow-throwing-system"
                :class="{ 'is-peeking': isPeeking }"
              >
                <!-- 1. QUẢ BÓNG TUYẾT BÊN TRÁI -->
                <!-- Quả bóng bay tới mắt trái (Ném trước) -->
                <g class="fly-ball fly-left">
                  <circle
                    cx="94"
                    cy="105"
                    r="16"
                    fill="#ffffff"
                    filter="drop-shadow(0 2px 6px rgba(100, 160, 200, 0.3))"
                  />
                  <path
                    d="M78 94L60 76"
                    stroke="#ccebf8"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />
                </g>

                <!-- Bụi tuyết văng khi bóng trái chạm mắt -->
                <g class="splat-dust dust-left">
                  <circle cx="72" cy="98" r="2.8" fill="#ffffff" />
                  <circle cx="68" cy="112" r="2.2" fill="#ffffff" />
                  <circle cx="86" cy="126" r="2.5" fill="#ffffff" />
                </g>

                <!-- Quả bóng tuyết tròn trịa, xốp mịn dính trên mắt trái -->
                <g class="landed-ball landed-left">
                  <!-- Bóng đổ nhẹ phía dưới -->
                  <ellipse
                    cx="94"
                    cy="123"
                    rx="17"
                    ry="5"
                    fill="#c5e6f6"
                    opacity="0.55"
                  />
                  <!-- Khối cầu tuyết chính: tròn, mịn, không viền stroke thô -->
                  <circle
                    cx="94"
                    cy="105"
                    r="22"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 6px rgba(100, 160, 200, 0.22))"
                  />
                  <!-- Vài múi tuyết phồng tự nhiên bo quanh -->
                  <circle cx="78" cy="100" r="7.5" fill="#ffffff" />
                  <circle cx="110" cy="100" r="7.5" fill="#ffffff" />
                  <circle cx="94" cy="88" r="7.5" fill="#ffffff" />
                  <circle cx="82" cy="115" r="7.5" fill="#ffffff" />
                  <circle cx="106" cy="115" r="7.5" fill="#ffffff" />
                  <!-- Đáy bóng tuyết chuyển màu dịu tạo khối 3D mềm mại -->
                  <path
                    d="M76 111 C79 122 86 126 94 126 C102 126 109 122 112 111 C106 119 100 122 94 122 C88 122 82 119 76 111 Z"
                    fill="#d7edf8"
                  />
                  <!-- Điểm sáng highlight nhẹ trên đỉnh quả bóng -->
                  <ellipse
                    cx="88"
                    cy="94"
                    rx="6"
                    ry="3"
                    fill="#ffffff"
                    opacity="0.9"
                  />

                  <!-- LỖ KHOÉT TUYẾT MẮT TRÁI (KHI BẬT "HIỆN") -->
                  <g class="carved-hole hole-left">
                    <!-- Vành tuyết khoét sâu với màu bóng tuyết nhẹ dịu (không đen/xanh đậm) -->
                    <circle cx="94" cy="105" r="13" fill="#d2ecf8" />
                    <!-- Lòng mắt trắng của gấu lộ ra qua lỗ khoét -->
                    <circle cx="94" cy="105" r="11" fill="#ffffff" />
                    <!-- Tròng đen gấu nhìn xuyên qua tuyết -->
                    <ellipse
                      v-show="!blink"
                      class="peek-pupil"
                      cx="94"
                      cy="105"
                      rx="5.2"
                      ry="6.5"
                      fill="#2c4250"
                    />
                    <circle
                      v-show="!blink"
                      class="peek-sparkle-1"
                      cx="95.5"
                      cy="103"
                      r="1.8"
                      fill="#ffffff"
                    />
                    <circle
                      v-show="!blink"
                      class="peek-sparkle-2"
                      cx="92.5"
                      cy="106.5"
                      r="1"
                      fill="#ffffff"
                    />
                    <!-- Mi mắt chớp qua lỗ tuyết -->
                    <path
                      v-show="blink"
                      d="M87 105q7 4 14 0"
                      fill="none"
                      stroke="#2c4250"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </g>
                </g>

                <!-- 2. QUẢ BÓNG TUYẾT BÊN PHẢI -->
                <!-- Quả bóng bay tới mắt phải (Ném sau 0.14s) -->
                <g class="fly-ball fly-right">
                  <circle
                    cx="146"
                    cy="105"
                    r="16"
                    fill="#ffffff"
                    filter="drop-shadow(0 2px 6px rgba(100, 160, 200, 0.3))"
                  />
                  <path
                    d="M162 94L180 76"
                    stroke="#ccebf8"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />
                </g>

                <!-- Bụi tuyết văng khi bóng phải chạm mắt -->
                <g class="splat-dust dust-right">
                  <circle cx="168" cy="98" r="2.8" fill="#ffffff" />
                  <circle cx="172" cy="112" r="2.2" fill="#ffffff" />
                  <circle cx="154" cy="126" r="2.5" fill="#ffffff" />
                </g>

                <!-- Quả bóng tuyết tròn trịa, xốp mịn dính trên mắt phải -->
                <g class="landed-ball landed-right">
                  <!-- Bóng đổ nhẹ phía dưới -->
                  <ellipse
                    cx="146"
                    cy="123"
                    rx="17"
                    ry="5"
                    fill="#c5e6f6"
                    opacity="0.55"
                  />
                  <!-- Khối cầu tuyết chính: tròn, mịn, không viền stroke thô -->
                  <circle
                    cx="146"
                    cy="105"
                    r="22"
                    fill="#ffffff"
                    filter="drop-shadow(0 3px 6px rgba(100, 160, 200, 0.22))"
                  />
                  <!-- Vài múi tuyết phồng tự nhiên bo quanh -->
                  <circle cx="130" cy="100" r="7.5" fill="#ffffff" />
                  <circle cx="162" cy="100" r="7.5" fill="#ffffff" />
                  <circle cx="146" cy="88" r="7.5" fill="#ffffff" />
                  <circle cx="134" cy="115" r="7.5" fill="#ffffff" />
                  <circle cx="158" cy="115" r="7.5" fill="#ffffff" />
                  <!-- Đáy bóng tuyết chuyển màu dịu tạo khối 3D mềm mại -->
                  <path
                    d="M128 111 C131 122 138 126 146 126 C154 126 161 122 164 111 C158 119 152 122 146 122 C140 122 134 119 128 111 Z"
                    fill="#d7edf8"
                  />
                  <!-- Điểm sáng highlight nhẹ trên đỉnh quả bóng -->
                  <ellipse
                    cx="140"
                    cy="94"
                    rx="6"
                    ry="3"
                    fill="#ffffff"
                    opacity="0.9"
                  />

                  <!-- LỖ KHOÉT TUYẾT MẮT PHẢI (KHI BẬT "HIỆN") -->
                  <g class="carved-hole hole-right">
                    <!-- Vành tuyết khoét sâu với màu bóng tuyết nhẹ dịu (không đen/xanh đậm) -->
                    <circle cx="146" cy="105" r="13" fill="#d2ecf8" />
                    <!-- Lòng mắt trắng của gấu lộ ra qua lỗ khoét -->
                    <circle cx="146" cy="105" r="11" fill="#ffffff" />
                    <!-- Tròng đen gấu nhìn xuyên qua tuyết -->
                    <ellipse
                      v-show="!blink"
                      class="peek-pupil"
                      cx="146"
                      cy="105"
                      rx="5.2"
                      ry="6.5"
                      fill="#2c4250"
                    />
                    <circle
                      v-show="!blink"
                      class="peek-sparkle-1"
                      cx="147.5"
                      cy="103"
                      r="1.8"
                      fill="#ffffff"
                    />
                    <circle
                      v-show="!blink"
                      class="peek-sparkle-2"
                      cx="144.5"
                      cy="106.5"
                      r="1"
                      fill="#ffffff"
                    />
                    <!-- Mi mắt chớp qua lỗ tuyết -->
                    <path
                      v-show="blink"
                      d="M139 105q7 4 14 0"
                      fill="none"
                      stroke="#2c4250"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </g>
                </g>
              </g>
            </transition>

            <!-- BÀN TAY GẤU ĐẶT TRƯỚC NGỰC XINH XẮN -->
            <g
              class="bear-paws"
              :class="{
                'paw-shock': isCovering,
                'paw-peeking': isPeeking,
              }"
            >
              <!-- Tay trái -->
              <g class="paw-chest paw-left">
                <ellipse
                  cx="82"
                  cy="184"
                  rx="16"
                  ry="12.5"
                  fill="#ffffff"
                  stroke="#c7e4ef"
                  stroke-width="2"
                />
                <ellipse cx="82" cy="185" rx="7" ry="5.5" fill="#f8bcc3" />
                <circle cx="74" cy="178" r="2.5" fill="#f8bcc3" />
                <circle cx="82" cy="175" r="2.8" fill="#f8bcc3" />
                <circle cx="90" cy="178" r="2.5" fill="#f8bcc3" />
              </g>

              <!-- Tay phải -->
              <g class="paw-chest paw-right">
                <ellipse
                  cx="158"
                  cy="184"
                  rx="16"
                  ry="12.5"
                  fill="#ffffff"
                  stroke="#c7e4ef"
                  stroke-width="2"
                />
                <ellipse cx="158" cy="185" rx="7" ry="5.5" fill="#f8bcc3" />
                <circle cx="150" cy="178" r="2.5" fill="#f8bcc3" />
                <circle cx="158" cy="175" r="2.8" fill="#f8bcc3" />
                <circle cx="166" cy="178" r="2.5" fill="#f8bcc3" />
              </g>
            </g>
          </svg>

          <!-- Dòng chú thích linh hoạt -->
          <div class="bear-caption mt-1">
            <span class="bear-dot" />
            <span>{{ bearCaption }}</span>
          </div>
        </section>

        <!-- Thân Card Chứa Form -->
        <section class="form-body pa-6 pa-sm-8 bg-white">
          <!-- Logo & Tiêu đề -->
          <div class="text-center mb-5">
            <div class="brand-badge d-inline-flex align-center ga-2 mb-2">
              <span class="brand-avatar font-weight-black">D</span>
              <span class="brand-name"
                >Duck<span class="text-blue">Bear</span></span
              >
            </div>
            <h1 class="text-h5 font-weight-black text-primary mb-1">
              {{
                mode === "login"
                  ? "Chào mừng bạn trở lại!"
                  : "Tạo tài khoản học tập"
              }}
            </h1>
            <p class="text-body-2 text-secondary mb-0">
              {{
                mode === "login"
                  ? "Đăng nhập để vào lớp học ngay hôm nay."
                  : "Tham gia cộng đồng học tập DuckBear."
              }}
            </p>
          </div>

          <!-- Thông báo lỗi khi đăng nhập thất bại -->
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            closable
            rounded="lg"
            class="mb-4 text-body-2 font-weight-medium"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- Form đăng nhập / đăng ký -->
          <v-form ref="form" validate-on="submit lazy" @submit.prevent="submit">
            <!-- Họ và tên (khi đăng ký) -->
            <div v-if="mode === 'register'" class="mb-3">
              <label
                class="field-label text-caption font-weight-bold mb-1 d-block"
                >HỌ VÀ TÊN</label
              >
              <v-text-field
                v-model="fullName"
                placeholder="Ví dụ: Nguyễn Văn An"
                prepend-inner-icon="mdi-account-outline"
                autocomplete="name"
                :rules="nameRules"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                hide-details="auto"
                @focus="
                  nameFocused = true;
                  emailFocused = false;
                  passwordFocused = false;
                "
                @blur="nameFocused = false"
              />
            </div>

            <!-- Email -->
            <div class="mb-3">
              <label
                class="field-label text-caption font-weight-bold mb-1 d-block"
                >ĐỊA CHỈ EMAIL</label
              >
              <v-text-field
                v-model="email"
                placeholder="name@school.edu.vn"
                prepend-inner-icon="mdi-email-outline"
                type="email"
                autocomplete="email"
                :rules="emailRules"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                hide-details="auto"
                @focus="
                  emailFocused = true;
                  nameFocused = false;
                  passwordFocused = false;
                "
                @blur="emailFocused = false"
              />
            </div>

            <!-- Mật khẩu -->
            <div class="mb-3">
              <label
                class="field-label text-caption font-weight-bold mb-1 d-block"
                >MẬT KHẨU</label
              >
              <v-text-field
                v-model="password"
                placeholder="Tối thiểu 6 ký tự"
                prepend-inner-icon="mdi-lock-outline"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="
                  mode === 'login' ? 'current-password' : 'new-password'
                "
                :rules="passwordRules"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                hide-details="auto"
                @focus="onPasswordFocus"
                @blur="onPasswordBlur"
              >
                <template #append-inner>
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    class="text-caption font-weight-bold px-2"
                    :prepend-icon="
                      showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                    "
                    @mousedown.prevent
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? "Ẩn" : "Hiện" }}
                  </v-btn>
                </template>
              </v-text-field>
            </div>

            <!-- Nút gửi Submit Pill -->
            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              rounded="pill"
              class="btn-shub-primary py-3 font-weight-black text-body-1 mt-3"
              :loading="loading"
            >
              {{ mode === "login" ? "Đăng nhập vào lớp" : "Tạo tài khoản" }}
            </v-btn>
          </v-form>

          <!-- Chuyển đổi nhanh cuối form -->
          <div class="text-center mt-5">
            <span class="text-caption text-secondary">
              {{
                mode === "login"
                  ? "Chưa có tài khoản học tập?"
                  : "Đã có tài khoản DuckBear?"
              }}
            </span>
            <button
              type="button"
              class="switch-link ml-1 font-weight-bold text-caption"
              @click="switchMode(mode === 'login' ? 'register' : 'login')"
            >
              {{ mode === "login" ? "Đăng ký ngay" : "Đăng nhập" }}
            </button>
          </div>
        </section>
      </v-card>

      <!-- Footer trang -->
      <p class="text-center text-caption text-secondary mt-4 mb-0">
        © 2026 DuckBear Classroom · Học tập thân thiện, tiến bộ mỗi ngày
      </p>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const mode = computed(() =>
  route.name === "register-form" ? "register" : "login",
);

// Form data
const email = ref("");
const password = ref("");
const fullName = ref("");
const role = computed(() =>
  route.params.role === "teacher" ? "TEACHER" : "STUDENT",
);
const showPassword = ref(false);

// Trạng thái focus & tương tác
const emailFocused = ref(false);
const nameFocused = ref(false);
const passwordFocused = ref(false);
const snowKey = ref(0);
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const blink = ref(false);
let blinkTimer = null;

// Trạng thái che mắt và hé mắt
const isCovering = computed(() => passwordFocused.value && !showPassword.value);
const isPeeking = computed(() => passwordFocused.value && showPassword.value);

// Biểu cảm của gấu
const expression = computed(() => {
  if (isCovering.value) return "shy";
  if (isPeeking.value) return "peeking";
  if (email.value.includes("@") && email.value.includes(".")) return "happy";
  if (email.value.length > 0) return "curious";
  return "calm";
});

// Dòng chú thích biểu cảm dưới gấu
const bearCaption = computed(() => {
  if (isCovering.value) return "Bị ném 2 quả bóng tuyết che kín mắt rồi! ❄️🙈";
  if (isPeeking.value) return "Khoét 2 lỗ tuyết nhìn trộm mật khẩu nè! 👀❄️";
  if (expression.value === "happy") return "Email trông chuẩn rồi đấy!";
  if (expression.value === "curious") return "Gấu đang nhìn theo bạn gõ chữ...";
  return "Học vui mỗi ngày cùng DuckBear";
});

// Tọa độ liếc mắt theo độ dài email
const gazeStyle = computed(() => {
  if (isCovering.value) {
    return {
      "--gaze-x": "0px",
      "--gaze-pupil-x": "0px",
      "--gaze-pupil-y": "0px",
    };
  }

  if (isPeeking.value) {
    return {
      "--gaze-x": "0px",
      "--gaze-pupil-x": "0px",
      "--gaze-pupil-y": "2.5px",
    };
  }

  if (emailFocused.value || nameFocused.value) {
    const typedText = nameFocused.value ? fullName.value : email.value;
    const shift = Math.min(Math.max((typedText.length - 5) * 0.42, -3), 6);
    return {
      "--gaze-x": `${shift * 0.35}px`,
      "--gaze-pupil-x": `${shift}px`,
      "--gaze-pupil-y": "1px",
    };
  }

  return {
    "--gaze-x": "0px",
    "--gaze-pupil-x": "0px",
    "--gaze-pupil-y": "0px",
  };
});

// Validation rules
const emailRules = [
  (v) => !!v || "Email không được để trống",
  (v) => /.+@.+\..+/.test(v) || "Email không hợp lệ",
];
const passwordRules = [
  (v) => !!v || "Mật khẩu không được để trống",
  (v) => (v && v.length >= 6) || "Mật khẩu cần ít nhất 6 ký tự",
];
const nameRules = [(v) => !!v || "Vui lòng nhập họ và tên"];

function switchMode(next) {
  errorMessage.value = "";
  form.value?.resetValidation();
  router.push(next === "register" ? "/register" : "/login");
}

async function submit() {
  errorMessage.value = "";
  const result = await form.value.validate();
  if (!result.valid) return;

  loading.value = true;
  try {
    if (mode.value === "login") {
      await auth.login({ email: email.value.trim(), password: password.value });
    } else {
      await auth.register({
        email: email.value.trim(),
        password: password.value,
        fullName: fullName.value.trim(),
        role: role.value,
      });
    }
    await router.push("/");
  } catch (error) {
    errorMessage.value =
      error.message || "Không thể đăng nhập. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}

// Xử lý ném tuyết từng quả khi focus ô mật khẩu
function onPasswordFocus() {
  passwordFocused.value = true;
  emailFocused.value = false;
  nameFocused.value = false;
  snowKey.value++;
}

function onPasswordBlur() {
  passwordFocused.value = false;
}

// Chớp mắt ngẫu nhiên
function scheduleBlink() {
  blinkTimer = window.setTimeout(
    () => {
      blink.value = true;
      window.setTimeout(() => {
        blink.value = false;
        scheduleBlink();
      }, 160);
    },
    2800 + Math.random() * 2600,
  );
}

onMounted(scheduleBlink);
onBeforeUnmount(() => window.clearTimeout(blinkTimer));
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 32px 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at 14% 16%,
      rgba(78, 184, 221, 0.16),
      transparent 28%
    ),
    radial-gradient(
      circle at 88% 84%,
      rgba(33, 112, 147, 0.12),
      transparent 26%
    ),
    #eff6f8;
}

.login-container {
  max-width: 450px;
}

.login-card {
  border-radius: 24px !important;
  background: #ffffff !important;
  border: 1px solid #d8e8ef !important;
  box-shadow: 0 20px 60px rgba(27, 74, 96, 0.12) !important;
}

/* Phần Đầu Card Chứa Gấu Bắc Cực */
.bear-header {
  position: relative;
  min-height: 195px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px 0 12px;
  background: linear-gradient(155deg, #e7f8ff 0%, #d8f1fa 55%, #c8ebf6 100%);
  border-bottom: 1px solid #d4ebf5;
}

.bear-halo {
  position: absolute;
  width: 210px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  box-shadow:
    0 0 0 16px rgba(255, 255, 255, 0.22),
    0 0 0 36px rgba(255, 255, 255, 0.12);
}

.polar-bear {
  position: relative;
  z-index: 1;
  width: 210px;
  filter: drop-shadow(0 10px 14px rgba(45, 111, 139, 0.14));
}

.bear-sky {
  fill: #c3e6f5;
}

/* Hiệu ứng di chuyển đầu & mắt theo email */
.bear-head {
  transform: translateX(var(--gaze-x, 0px));
  transition: transform 0.4s ease;
  transform-origin: 120px 110px;
}

.expression-curious .bear-head {
  transform: translateX(var(--gaze-x, 0px)) rotate(-2deg);
}

.eye-white {
  fill: #ffffff;
}

.eye-pupil {
  fill: #2c4250;
  transform: translate(var(--gaze-pupil-x, 0px), var(--gaze-pupil-y, 0px));
  transition: transform 0.3s ease;
}

.eye-sparkle {
  fill: #ffffff;
  transform: translate(var(--gaze-pupil-x, 0px), var(--gaze-pupil-y, 0px));
  transition: transform 0.3s ease;
}

/* Chớp mắt */
.eye-blink {
  display: none;
  fill: none;
  stroke: #2c4250;
  stroke-width: 3.5;
  stroke-linecap: round;
}

.is-blinking .eye-white,
.is-blinking .eye-pupil,
.is-blinking .eye-sparkle {
  opacity: 0;
}

.is-blinking .eye-blink {
  display: block;
}

/* Miệng gấu đa biểu cảm */
.bear-mouth-group {
  transition: transform 0.25s ease;
  transform-origin: 120px 132px;
}

.mouth-normal {
  display: block;
}

.mouth-surprised,
.mouth-peeking {
  display: none;
}

/* 1. Khi bị tuyết ném trúng che kín mắt: Miệng chữ O ngạc nhiên */
.is-covering .mouth-normal {
  display: none;
}

.is-covering .mouth-surprised {
  display: block;
  animation: mouthPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: 120px 133px;
}

/* 2. Khi hé lỗ tuyết nhìn trộm: Miệng cười tinh nghịch */
.is-peeking .mouth-normal {
  display: none;
}

.is-peeking .mouth-surprised {
  display: none;
}

.is-peeking .mouth-peeking {
  display: block;
  animation: mouthPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: 120px 131px;
}

@keyframes mouthPop {
  0% {
    transform: scale(0.35);
    opacity: 0;
  }
  70% {
    transform: scale(1.18);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Ẩn đôi mắt gốc khi có tuyết phủ trên mặt */
.has-snow .bear-eyes {
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* HỆ THỐNG NÉM BÓNG TUYẾT TỪNG QUẢ VÀ KHOÉT LỖ PEAK HOLE */
.snow-throwing-system {
  transform-origin: 120px 105px;
}

/* Quả bóng tuyết bay ném vào mắt trái (0s -> 0.22s) */
.fly-left {
  animation: flyBallLeft 0.22s cubic-bezier(0.2, 0.7, 0.35, 1) forwards;
  transform-origin: 94px 105px;
}

@keyframes flyBallLeft {
  0% {
    transform: translate(-100px, -80px) scale(0.35);
    opacity: 1;
  }
  80% {
    transform: translate(0, 0) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1.2);
    opacity: 0;
  }
}

/* Quả bóng tuyết bay ném vào mắt phải (ném sau 0.14s) */
.fly-right {
  animation: flyBallRight 0.22s cubic-bezier(0.2, 0.7, 0.35, 1) 0.14s forwards;
  transform-origin: 146px 105px;
  opacity: 0;
}

@keyframes flyBallRight {
  0% {
    transform: translate(100px, -80px) scale(0.35);
    opacity: 1;
  }
  80% {
    transform: translate(0, 0) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1.2);
    opacity: 0;
  }
}

/* Quả bóng dính trên mắt trái (nảy lên tại 0.18s) */
.landed-left {
  animation: landBounceLeft 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0.18s
    both;
  transform-origin: 94px 105px;
}

@keyframes landBounceLeft {
  0% {
    transform: scale(0.15);
    opacity: 0;
  }
  65% {
    transform: scale(1.18);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Quả bóng dính trên mắt phải (nảy lên sau tại 0.32s) */
.landed-right {
  animation: landBounceRight 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0.32s
    both;
  transform-origin: 146px 105px;
}

@keyframes landBounceRight {
  0% {
    transform: scale(0.15);
    opacity: 0;
  }
  65% {
    transform: scale(1.18);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Bụi tuyết bắn tung tóe tại điểm va chạm */
.dust-left {
  animation: dustScatter 0.32s ease-out 0.18s both;
  transform-origin: 94px 105px;
}

.dust-right {
  animation: dustScatter 0.32s ease-out 0.32s both;
  transform-origin: 146px 105px;
}

@keyframes dustScatter {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* LỖ KHOÉT TUYẾT (PEEK HOLE) - Tròn, tự nhiên, không viền đen bọt xà phòng */
.carved-hole {
  transform: scale(0);
  opacity: 0;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
}

.hole-left {
  transform-origin: 94px 105px;
}

.hole-right {
  transform-origin: 146px 105px;
}

/* Khi click Hiện mật khẩu: Khoét 2 lỗ tròn mềm mại nhìn xuyên qua */
.snow-throwing-system.is-peeking .carved-hole {
  transform: scale(1);
  opacity: 1;
}

.peek-pupil,
.peek-sparkle-1,
.peek-sparkle-2 {
  transform: translateY(var(--gaze-pupil-y, 0px));
  transition: transform 0.25s ease;
}

/* Hiệu ứng tuyết rơi rụng khi bỏ focus ô mật khẩu */
.snow-fall-leave-active {
  transition:
    transform 0.28s ease-in,
    opacity 0.22s ease-in;
}

.snow-fall-leave-to {
  transform: translateY(32px) scale(0.85);
  opacity: 0;
}

/* BÀN TAY GẤU TRƯỚC NGỰC */
.bear-paws {
  transition: transform 0.32s cubic-bezier(0.2, 0.85, 0.25, 1);
  transform-origin: 120px 185px;
}

/* Khi tuyết ném trúng mặt: giật mình nảy nhẹ lên rất buồn cười */
.bear-paws.paw-shock {
  transform: translateY(-8px) scale(1.03);
}

/* Khi hé mắt nhìn trộm mật khẩu: tay giữ ngoan ngoãn */
.bear-paws.paw-peeking {
  transform: translateY(-2px);
}

/* Đốm tuyết chuyển động */
.snow {
  fill: #ffffff;
  opacity: 0.85;
}
.snow-one {
  animation: drift 3.5s ease-in-out infinite;
}
.snow-two {
  animation: drift 4.2s ease-in-out -1.2s infinite;
}
.snow-three {
  animation: drift 3.8s ease-in-out -2.1s infinite;
}
.snow-four {
  animation: drift 4.5s ease-in-out -0.8s infinite;
}

@keyframes drift {
  50% {
    transform: translateY(-6px);
    opacity: 0.4;
  }
}

.bear-caption {
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #3b748a;
  font-size: 0.82rem;
  font-weight: 700;
}

.bear-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4eb8dd;
  box-shadow: 0 0 0 3px rgba(78, 184, 221, 0.2);
}

/* Phần Form Body */
.brand-badge {
  color: #217093;
}

.brand-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #217093;
  color: #ffffff;
  font-size: 0.85rem;
}

.brand-name {
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.text-blue {
  color: #4eb8dd;
}

/* Segmented Tabs */
.auth-tabs {
  background: #f0f7fa;
  border: 1px solid #e1eff4;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 8px 16px;
  color: #667085;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #217093;
  box-shadow: 0 2px 8px rgba(33, 112, 147, 0.12);
}

.field-label {
  color: #344054;
  letter-spacing: 0.04em;
}

.switch-link {
  border: none;
  background: transparent;
  color: #217093;
  cursor: pointer;
  text-decoration: underline;
}

.btn-shub-primary {
  background: linear-gradient(135deg, #217093 0%, #1a5c7a 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 6px 18px rgba(33, 112, 147, 0.3) !important;
}

.btn-shub-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(33, 112, 147, 0.4) !important;
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px 12px;
  }
  .bear-header {
    min-height: 180px;
    padding: 12px 0 10px;
  }
  .polar-bear {
    width: 185px;
  }
}
</style>
