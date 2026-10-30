<template>
  <v-layout class="min-vh-100" style="background-color: #f4f8ff">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />

    <v-main class="pb-16" style="background-color: #f4f8ff">
      <!-- Loading bar nhẹ nhàng -->
      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        height="3"
      />

      <v-container class="py-8 px-4 px-md-8" style="max-width: 1360px">
        <!-- PageHeader SHub Classroom Style -->
        <PageHeader
          tag="KHÔNG GIAN LỚP HỌC"
          title="Thư viện Giáo trình"
          subtitle="Khám phá, biên soạn và chuẩn hóa chương trình học tập cho học sinh từ Lớp 1 đến Lớp 12."
          icon="mdi-bookshelf"
        >
          <template #actions>
            <!-- Nút Thêm sách cho Giáo viên / Admin -->
            <v-btn
              v-if="authStore.isTeacher"
              color="primary"
              size="large"
              rounded="pill"
              class="btn-shub-primary px-6 font-weight-black"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              Thêm giáo trình mới
            </v-btn>
          </template>
        </PageHeader>

        <!-- Thanh FilterChips Khối Lớp -->
        <div class="mb-8">
          <FilterChips
            :model-value="selectedGrade"
            :items="gradeOptions"
            @change="handleGradeChange"
          />
        </div>

        <!-- Trạng thái Skeleton Loading -->
        <v-row v-if="isLoading && books.length === 0">
          <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
            <v-skeleton-loader
              type="card"
              class="rounded-xl"
              elevation="0"
              style="border: 1px solid #e4ecf7"
            />
          </v-col>
        </v-row>

        <!-- Trạng thái EmptyState -->
        <EmptyState
          v-else-if="!isLoading && books.length === 0"
          :title="
            selectedGrade
              ? `Chưa có giáo trình Lớp ${selectedGrade}`
              : 'Chưa có giáo trình nào trong thư viện'
          "
          :description="
            selectedGrade
              ? `Lớp ${selectedGrade} hiện chưa có sách nào được tạo. Bạn hãy là người đầu tiên tạo giáo trình cho khối lớp này nhé!`
              : 'Bắt đầu không gian học tập bằng việc tạo cuốn giáo trình đầu tiên ngay bây giờ.'
          "
          :action-text="authStore.isTeacher ? 'Tạo giáo trình ngay' : ''"
          action-icon="mdi-plus"
          @action="openCreateDialog"
        />

        <!-- Lưới Thẻ Sách BookCard Responsive -->
        <v-row v-else class="fade-in-up">
          <v-col
            v-for="book in books"
            :key="book.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex"
          >
            <BookCard
              :book="book"
              :can-edit="authStore.isTeacher"
              @click="goToDetail"
              @edit="openEditDialog"
              @delete="confirmDeleteBook"
            />
          </v-col>
        </v-row>
      </v-container>

      <!-- Dialog Thêm / Sửa Sách (Vuetify rounded="xl") -->
      <v-dialog v-model="showBookDialog" max-width="520" persistent>
        <v-card class="rounded-xl pa-6">
          <div class="d-flex align-center mb-5">
            <v-avatar color="primary" variant="tonal" size="46" class="mr-3">
              <v-icon icon="mdi-book-plus" size="24" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-h6 font-weight-black text-primary">
                {{ isEditing ? "Chỉnh sửa giáo trình" : "Thêm giáo trình mới" }}
              </h2>
              <span class="text-caption text-secondary"
                >Quản lý sách học tập</span
              >
            </div>
          </div>

          <v-form ref="bookFormRef" @submit.prevent="handleSaveBook">
            <div class="mb-4">
              <label
                class="text-caption font-weight-bold text-secondary mb-1 d-block"
                >TIÊU ĐỀ SÁCH</label
              >
              <v-text-field
                v-model="bookForm.title"
                placeholder="Ví dụ: Toán lớp 6 — Tập 1"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-4">
              <label
                class="text-caption font-weight-bold text-secondary mb-1 d-block"
                >MÔN HỌC</label
              >
              <v-text-field
                v-model="bookForm.subject"
                placeholder="Ví dụ: Toán, Ngữ Văn, Tiếng Anh, Tin học..."
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
              />
            </div>

            <div class="mb-6">
              <label
                class="text-caption font-weight-bold text-secondary mb-1 d-block"
                >KHỐI LỚP</label
              >
              <v-select
                v-model="bookForm.gradeLevel"
                :items="
                  Array.from({ length: 12 }, (_, i) => ({
                    title: `Lớp ${i + 1}`,
                    value: i + 1,
                  }))
                "
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="gradeRule"
                hide-details="auto"
              />
            </div>

            <div class="d-flex justify-end ga-3 pt-4 border-t">
              <v-btn
                variant="text"
                rounded="pill"
                class="font-weight-bold px-4"
                :disabled="isSubmittingBook"
                @click="showBookDialog = false"
              >
                Hủy bỏ
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmittingBook"
                @click="handleSaveBook"
              >
                {{ isEditing ? "Lưu cập nhật" : "Tạo giáo trình" }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>

      <!-- Dialog Xác nhận xóa sách -->
      <ConfirmDialog
        v-model="showDeleteConfirm"
        title="Xóa giáo trình"
        :message="`Bạn có chắc chắn muốn xóa cuốn sách '${bookToDelete?.title}'? Toàn bộ chương mục và bài học bên trong sẽ bị xóa theo.`"
        :loading="isDeleting"
        @confirm="handleDeleteBook"
      />

      <!-- Snackbar Thông báo -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        rounded="pill"
        timeout="3500"
        location="top right"
      >
        <div class="d-flex align-center">
          <v-icon
            :icon="
              snackbar.color === 'error'
                ? 'mdi-alert-circle'
                : 'mdi-check-circle'
            "
            class="mr-2"
          />
          <span class="font-weight-bold">{{ snackbar.message }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" size="small" @click="snackbar.show = false"
            >Đóng</v-btn
          >
        </template>
      </v-snackbar>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "../../services/api";
import { useAuthStore } from "../../stores/auth";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import PageHeader from "../../components/shared/PageHeader.vue";
import FilterChips from "../../components/shared/FilterChips.vue";
import BookCard from "../../components/shared/BookCard.vue";
import EmptyState from "../../components/shared/EmptyState.vue";
import ConfirmDialog from "../../components/shared/ConfirmDialog.vue";

const router = useRouter();
const authStore = useAuthStore();

// Danh sách sách & trạng thái tải
const books = ref([]);
const isLoading = ref(false);
const selectedGrade = ref(null);

// Danh sách các lớp lọc
const gradeOptions = [
  { label: "Tất cả khối lớp", value: null },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: `Lớp ${i + 1}`,
    value: i + 1,
  })),
];

// Snackbar thông báo
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

function showNotice(message, color = "success") {
  snackbar.value = {
    show: true,
    message,
    color,
  };
}

// Dialog Thêm & Sửa Sách
const showBookDialog = ref(false);
const isEditing = ref(false);
const editingBookId = ref(null);
const isSubmittingBook = ref(false);
const bookFormRef = ref(null);

const bookForm = ref({
  title: "",
  subject: "",
  gradeLevel: 1,
});

// Dialog xác nhận xóa sách
const showDeleteConfirm = ref(false);
const bookToDelete = ref(null);
const isDeleting = ref(false);

// Validation rules
const requiredRule = [(v) => !!v || "Trường này không được để trống"];
const gradeRule = [
  (v) => (Number(v) >= 1 && Number(v) <= 12) || "Khối lớp phải từ 1 đến 12",
];

// Lấy danh sách sách
async function fetchBooks() {
  isLoading.value = true;
  try {
    const path = selectedGrade.value
      ? `/books?gradeLevel=${selectedGrade.value}`
      : "/books";
    books.value = await api(path);
  } catch (err) {
    showNotice(err.message, "error");
  } finally {
    isLoading.value = false;
  }
}

function handleGradeChange(val) {
  selectedGrade.value = val;
  fetchBooks();
}

// Mở dialog tạo sách
function openCreateDialog() {
  isEditing.value = false;
  editingBookId.value = null;
  bookForm.value = {
    title: "",
    subject: "",
    gradeLevel: selectedGrade.value || 1,
  };
  showBookDialog.value = true;
}

// Mở dialog sửa sách
function openEditDialog(book, event) {
  event?.stopPropagation();
  isEditing.value = true;
  editingBookId.value = book.id;
  bookForm.value = {
    title: book.title,
    subject: book.subject,
    gradeLevel: book.gradeLevel,
  };
  showBookDialog.value = true;
}

// Lưu sách (Tạo mới hoặc Cập nhật)
async function handleSaveBook() {
  const { valid } = await bookFormRef.value.validate();
  if (!valid) return;

  isSubmittingBook.value = true;
  try {
    const payload = {
      title: bookForm.value.title.trim(),
      subject: bookForm.value.subject.trim(),
      gradeLevel: Number(bookForm.value.gradeLevel),
    };

    if (isEditing.value) {
      await api(`/books/${editingBookId.value}`, {
        method: "PATCH",
        body: payload,
      });
      showNotice("Cập nhật sách thành công!");
    } else {
      await api("/books", {
        method: "POST",
        body: payload,
      });
      showNotice("Thêm sách mới thành công!");
    }
    showBookDialog.value = false;
    await fetchBooks();
  } catch (err) {
    showNotice(err.message, "error");
  } finally {
    isSubmittingBook.value = false;
  }
}

// Mở xác nhận xóa
function confirmDeleteBook(book, event) {
  event?.stopPropagation();
  bookToDelete.value = book;
  showDeleteConfirm.value = true;
}

// Xóa sách
async function handleDeleteBook() {
  if (!bookToDelete.value) return;
  isDeleting.value = true;
  try {
    await api(`/books/${bookToDelete.value.id}`, {
      method: "DELETE",
    });
    showNotice("Xóa sách thành công!");
    showDeleteConfirm.value = false;
    bookToDelete.value = null;
    await fetchBooks();
  } catch (err) {
    showNotice(err.message, "error");
  } finally {
    isDeleting.value = false;
  }
}

function goToDetail(book) {
  router.push(`/books/${book.id}`);
}

onMounted(() => {
  fetchBooks();
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
