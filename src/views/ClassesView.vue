<template>
  <v-layout class="min-vh-100" style="background-color: #f4f8ff">
    <AppHeader />
    <v-main class="pb-16" style="background-color: #f4f8ff">
      <v-container class="py-8 px-4 px-md-8" style="max-width: 1180px">
        <PageHeader
          tag="KHÔNG GIAN LỚP HỌC"
          :title="isTeacher ? 'Quản lý lớp học' : 'Lớp học của tôi'"
          :subtitle="
            isTeacher
              ? 'Tạo lớp, chia sẻ mã mời và duyệt yêu cầu tham gia của học sinh.'
              : 'Nhập mã lớp để gửi yêu cầu tham gia và theo dõi các lớp học của bạn.'
          "
          icon="mdi-account-group-outline"
        >
          <template #actions>
            <v-btn
              v-if="isTeacher"
              color="primary"
              size="large"
              class="btn-shub-primary px-6 font-weight-black"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Tạo lớp mới
            </v-btn>
          </template>
        </PageHeader>

        <v-row v-if="!isTeacher" class="mb-2">
          <v-col cols="12">
            <v-card class="pa-5 pa-md-7 shub-card">
              <div class="d-flex align-center ga-3 mb-2">
                <v-avatar color="primary" variant="tonal"
                  ><v-icon icon="mdi-key-outline"
                /></v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-black">Tìm lớp bằng mã mời</h2>
                  <p class="text-body-2 text-secondary mb-0">
                    Nhập mã giáo viên chia sẻ với bạn. Giáo viên sẽ duyệt yêu
                    cầu trước khi bạn vào lớp.
                  </p>
                </div>
              </div>
              <v-form
                class="d-flex flex-column flex-sm-row align-start ga-3 mt-5"
                @submit.prevent="searchClass"
              >
                <v-text-field
                  v-model="joinCode"
                  label="Mã lớp"
                  placeholder="Ví dụ: A1B2C3D4"
                  prepend-inner-icon="mdi-pound"
                  class="flex-grow-1 w-100"
                  hide-details
                  maxlength="12"
                  @update:model-value="clearSearch"
                />
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  class="btn-shub-primary px-7"
                  :loading="isSubmitting"
                >
                  Tìm lớp
                </v-btn>
              </v-form>
              <v-alert
                v-if="searchError"
                type="error"
                variant="tonal"
                class="mt-4"
                density="comfortable"
              >
                {{ searchError }}
              </v-alert>
              <v-card
                v-if="classPreview"
                class="mt-5 pa-4 class-preview"
                variant="tonal"
                color="primary"
              >
                <div
                  class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
                >
                  <div>
                    <div class="text-overline">LỚP HỌC TÌM THẤY</div>
                    <h3 class="text-h6 font-weight-black">
                      {{ classPreview.name }}
                    </h3>
                    <div class="text-body-2 mt-1">
                      Lớp {{ classPreview.gradeLevel }} ·
                      {{ classPreview.schoolYear }} · Giáo viên:
                      {{
                        classPreview.homeroomTeacher?.fullName ||
                        "Chưa phân công"
                      }}
                    </div>
                    <div class="text-caption mt-1">
                      {{ classPreview._count?.students || 0 }} học sinh
                    </div>
                  </div>
                  <v-chip
                    v-if="classPreview.isMember"
                    color="success"
                    variant="tonal"
                    >Đã tham gia</v-chip
                  >
                  <v-chip
                    v-else-if="classPreview.myRequestStatus === 'PENDING'"
                    color="warning"
                    variant="tonal"
                    >Đang chờ duyệt</v-chip
                  >
                  <v-btn
                    v-else
                    color="primary"
                    class="btn-shub-primary px-6"
                    :loading="isSubmitting"
                    @click="requestToJoin"
                  >
                    Gửi yêu cầu tham gia
                  </v-btn>
                </div>
              </v-card>
            </v-card>
          </v-col>
        </v-row>

        <v-progress-linear
          v-if="isLoading"
          indeterminate
          color="primary"
          height="3"
          class="mb-4"
        />

        <template v-if="isTeacher">
          <h2 class="text-h6 font-weight-black mb-4">Lớp bạn quản lý</h2>
          <v-row v-if="classes.length">
            <v-col
              v-for="schoolClass in classes"
              :key="schoolClass.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card class="pa-5 h-100 shub-card">
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-avatar color="primary" variant="tonal"
                    ><v-icon icon="mdi-google-classroom"
                  /></v-avatar>
                  <v-chip color="primary" variant="tonal" size="small"
                    >{{ schoolClass._count?.students || 0 }} học sinh</v-chip
                  >
                </div>
                <h3 class="text-h6 font-weight-black">
                  {{ schoolClass.name }}
                </h3>
                <p class="text-body-2 text-secondary">
                  Lớp {{ schoolClass.gradeLevel }} ·
                  {{ schoolClass.schoolYear }}
                </p>
                <v-divider class="my-4" />
                <div class="d-flex align-center justify-space-between ga-2">
                  <div>
                    <div class="text-caption text-secondary">MÃ MỜI</div>
                    <code
                      class="text-subtitle-1 font-weight-black text-primary"
                      >{{ schoolClass.joinCode }}</code
                    >
                  </div>
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="tonal"
                    color="primary"
                    aria-label="Sao chép mã lớp"
                    @click="copyJoinCode(schoolClass.joinCode)"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-card
            v-else-if="!isLoading"
            class="pa-8 text-center shub-card mb-8"
          >
            <v-icon
              icon="mdi-google-classroom"
              size="48"
              color="primary"
              class="mb-3"
            />
            <h3 class="text-h6 font-weight-black">Bạn chưa tạo lớp nào</h3>
            <p class="text-body-2 text-secondary mb-4">
              Tạo lớp đầu tiên để chia sẻ mã mời với học sinh.
            </p>
            <v-btn
              color="primary"
              class="btn-shub-primary"
              @click="showCreateDialog = true"
              >Tạo lớp mới</v-btn
            >
          </v-card>

          <h2 class="text-h6 font-weight-black mt-8 mb-4">
            Yêu cầu tham gia
            <v-chip
              v-if="requests.length"
              color="warning"
              size="small"
              class="ml-2"
              >{{ requests.length }} chờ duyệt</v-chip
            >
          </h2>
          <v-card v-if="requests.length" class="shub-card overflow-hidden">
            <v-list lines="two">
              <v-list-item
                v-for="request in requests"
                :key="request.id"
                :title="request.student.fullName"
                :subtitle="`${request.class.name} · ${request.student.email}`"
                prepend-icon="mdi-account-clock-outline"
              >
                <template #append>
                  <div class="d-flex ga-2">
                    <v-btn
                      color="success"
                      variant="tonal"
                      size="small"
                      :loading="isReviewing === request.id"
                      @click="reviewRequest(request, 'APPROVED')"
                      >Duyệt</v-btn
                    >
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      :loading="isReviewing === request.id"
                      @click="reviewRequest(request, 'REJECTED')"
                      >Từ chối</v-btn
                    >
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
          <v-card
            v-else-if="!isLoading"
            class="pa-5 text-center shub-card text-secondary"
            >Chưa có yêu cầu nào đang chờ duyệt.</v-card
          >
        </template>

        <template v-else>
          <h2 class="text-h6 font-weight-black mt-6 mb-4">Lớp đã tham gia</h2>
          <v-row v-if="classes.length">
            <v-col
              v-for="schoolClass in classes"
              :key="schoolClass.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card class="pa-5 h-100 shub-card">
                <v-avatar color="success" variant="tonal" class="mb-3"
                  ><v-icon icon="mdi-book-account-outline"
                /></v-avatar>
                <h3 class="text-h6 font-weight-black">
                  {{ schoolClass.name }}
                </h3>
                <p class="text-body-2 text-secondary mb-0">
                  Lớp {{ schoolClass.gradeLevel }} ·
                  {{ schoolClass.schoolYear }}
                </p>
                <div class="text-body-2 mt-2">
                  Giáo viên:
                  {{
                    schoolClass.homeroomTeacher?.fullName || "Chưa phân công"
                  }}
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-card
            v-else-if="!isLoading"
            class="pa-5 text-center shub-card text-secondary"
            >Bạn chưa tham gia lớp nào.</v-card
          >

          <template v-if="requests.length">
            <h2 class="text-h6 font-weight-black mt-8 mb-4">Yêu cầu của tôi</h2>
            <v-row>
              <v-col
                v-for="request in requests"
                :key="request.id"
                cols="12"
                sm="6"
                lg="4"
              >
                <v-card
                  class="pa-4 shub-card d-flex align-center justify-space-between ga-3"
                >
                  <div>
                    <div class="font-weight-bold">{{ request.class.name }}</div>
                    <div class="text-caption text-secondary">
                      Lớp {{ request.class.gradeLevel }} ·
                      {{ request.class.schoolYear }}
                    </div>
                  </div>
                  <v-chip
                    :color="
                      request.status === 'PENDING'
                        ? 'warning'
                        : request.status === 'APPROVED'
                          ? 'success'
                          : 'error'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{
                      request.status === "PENDING"
                        ? "Chờ duyệt"
                        : request.status === "APPROVED"
                          ? "Đã duyệt"
                          : "Bị từ chối"
                    }}
                  </v-chip>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </template>
      </v-container>
    </v-main>

    <v-dialog v-model="showCreateDialog" max-width="520">
      <v-card class="pa-5 pa-sm-7">
        <v-card-title class="text-h6 font-weight-black px-0"
          >Tạo lớp học mới</v-card-title
        >
        <v-card-text class="px-0">
          <v-form @submit.prevent="createClass">
            <v-text-field
              v-model="createForm.name"
              label="Tên lớp"
              placeholder="Ví dụ: Toán 6A"
              maxlength="100"
              required
              class="mb-3"
            />
            <v-select
              v-model="createForm.gradeLevel"
              label="Khối lớp"
              :items="
                Array.from({ length: 12 }, (_, index) => ({
                  title: `Lớp ${index + 1}`,
                  value: index + 1,
                }))
              "
              class="mb-3"
            />
            <v-text-field
              v-model="createForm.schoolYear"
              label="Niên khóa"
              placeholder="Ví dụ: 2026-2027"
              maxlength="20"
              required
            />
            <div class="d-flex justify-end ga-2 mt-5">
              <v-btn variant="text" @click="showCreateDialog = false"
                >Hủy</v-btn
              >
              <v-btn
                type="submit"
                color="primary"
                class="btn-shub-primary"
                :loading="isSubmitting"
                >Tạo lớp</v-btn
              >
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="notice.show"
      :color="notice.color"
      timeout="4500"
      location="bottom end"
    >
      {{ notice.message }}
      <template #actions
        ><v-btn variant="text" @click="notice.show = false"
          >Đóng</v-btn
        ></template
      >
    </v-snackbar>
  </v-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";
import AppHeader from "../components/common/AppHeader.vue";
import PageHeader from "../components/common/PageHeader.vue";

const authStore = useAuthStore();
const isTeacher = computed(() => authStore.isTeacher);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isReviewing = ref(null);
const showCreateDialog = ref(false);
const classes = ref([]);
const requests = ref([]);
const joinCode = ref("");
const classPreview = ref(null);
const searchError = ref("");
const notice = ref({ show: false, message: "", color: "success" });
const createForm = ref({ name: "", gradeLevel: 1, schoolYear: "" });

function showNotice(message, color = "success") {
  notice.value = { show: true, message, color };
}

function clearSearch() {
  classPreview.value = null;
  searchError.value = "";
}

async function fetchClasses() {
  isLoading.value = true;
  try {
    const result = await api("/classes/mine");
    classes.value = result.classes || [];
    requests.value = result.requests || [];
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    isLoading.value = false;
  }
}

async function searchClass() {
  classPreview.value = null;
  searchError.value = "";
  if (!joinCode.value.trim()) {
    searchError.value = "Bạn hãy nhập mã lớp để tìm kiếm.";
    return;
  }

  isSubmitting.value = true;
  try {
    classPreview.value = await api(
      `/classes/join?code=${encodeURIComponent(joinCode.value.trim())}`,
    );
  } catch (error) {
    searchError.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
}

async function requestToJoin() {
  if (!classPreview.value) return;
  isSubmitting.value = true;
  try {
    await api(`/classes/${classPreview.value.id}/join`, { method: "POST" });
    classPreview.value = null;
    joinCode.value = "";
    await fetchClasses();
    showNotice("Đã gửi yêu cầu. Giáo viên sẽ duyệt yêu cầu tham gia của bạn.");
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    isSubmitting.value = false;
  }
}

async function createClass() {
  isSubmitting.value = true;
  try {
    const schoolClass = await api("/classes", {
      method: "POST",
      body: {
        name: createForm.value.name.trim(),
        gradeLevel: Number(createForm.value.gradeLevel),
        schoolYear: createForm.value.schoolYear.trim(),
      },
    });
    showCreateDialog.value = false;
    createForm.value = { name: "", gradeLevel: 1, schoolYear: "" };
    await fetchClasses();
    showNotice(
      `Đã tạo lớp ${schoolClass.name}. Mã mời: ${schoolClass.joinCode}`,
    );
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    isSubmitting.value = false;
  }
}

async function reviewRequest(request, status) {
  isReviewing.value = request.id;
  try {
    await api(`/classes/requests/${request.id}`, {
      method: "PATCH",
      body: { status },
    });
    await fetchClasses();
    showNotice(
      status === "APPROVED"
        ? "Đã duyệt học sinh vào lớp."
        : "Đã từ chối yêu cầu tham gia.",
    );
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    isReviewing.value = null;
  }
}

async function copyJoinCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    showNotice("Đã sao chép mã lớp.");
  } catch {
    showNotice("Không thể sao chép mã lớp trên thiết bị này.", "error");
  }
}

onMounted(() => {
  fetchClasses();
  window.addEventListener("classes:refresh", fetchClasses);
});

onBeforeUnmount(() =>
  window.removeEventListener("classes:refresh", fetchClasses),
);
</script>

<style scoped>
.class-preview {
  border: 1px solid rgba(47, 124, 246, 0.18);
}
code {
  letter-spacing: 0.12em;
}
</style>
