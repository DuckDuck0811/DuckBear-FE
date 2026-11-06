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
          :tag="t('booksPage.tag')"
          :title="t('booksPage.title')"
          :subtitle="t('booksPage.subtitle')"
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
              {{ t('booksPage.addBook') }}
            </v-btn>
          </template>
        </PageHeader>

        <v-alert v-if="loadError" type="error" variant="tonal" class="mb-5" role="alert">
          {{ loadError }}
        </v-alert>

        <!-- Thanh FilterChips Khối Lớp -->
        <div class="mb-8">
          <FilterChips
            :model-value="selectedGrade"
            :items="gradeOptions"
            :title="t('booksPage.gradeFilter')"
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
              ? t('booksPage.noGradeBooks', { grade: selectedGrade })
              : t('booksPage.noBooks')
          "
          :description="
            selectedGrade
              ? t('booksPage.noGradeBooksHint', { grade: selectedGrade })
              : t('booksPage.noBooksHint')
          "
          :action-text="authStore.isTeacher ? t('booksPage.createNow') : ''"
          action-icon="mdi-plus"
          @action="openCreateDialog"
        />

        <!-- Lưới Thẻ Sách BookCard Responsive -->
        <v-row v-else class="fade-in-up">
          <v-col
            v-for="book in pagedBooks"
            :key="book.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex"
          >
            <BookCard
              :book="book"
              :can-edit="authStore.user?.role === 'ADMIN' || Number(book.createdById) === Number(authStore.user?.id)"
              @click="goToDetail"
              @edit="openEditDialog"
              @delete="confirmDeleteBook"
            />
          </v-col>
        </v-row>
        <ListPagination v-model="booksPage" :total="books.length" />
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
                {{ t(isEditing ? 'booksPage.editBook' : 'booksPage.addBook') }}
              </h2>
              <span class="text-caption text-secondary"
                >{{ t('booksPage.manageBooks') }}</span
              >
            </div>
          </div>

          <v-form ref="bookFormRef" @submit.prevent="handleSaveBook">
            <div class="mb-4">
              <label
                class="text-caption font-weight-bold text-secondary mb-1 d-block"
                >{{ t('booksPage.titleLabel') }}</label
              >
              <v-text-field
                v-model="bookForm.title"
                :placeholder="t('booksPage.titlePlaceholder')"
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
                >{{ t('booksPage.subjectLabel') }}</label
              >
              <v-select
                v-model="bookForm.subject"
                :items="subjectOptions"
                :placeholder="t('booksPage.subjectPlaceholder')"
                :no-data-text="t('booksPage.noSubject')"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                color="primary"
                :rules="requiredRule"
                hide-details="auto"
                clearable
              />
            </div>

            <div class="mb-6">
              <label
                class="text-caption font-weight-bold text-secondary mb-1 d-block"
                >{{ t('booksPage.gradeLabel') }}</label
              >
              <v-select
                v-model="bookForm.gradeLevel"
                :items="
                  Array.from({ length: 12 }, (_, i) => ({
                    title: t('booksPage.gradeOption', { grade: i + 1 }),
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
                {{ t('booksPage.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                rounded="pill"
                class="btn-shub-primary px-6 font-weight-bold"
                :loading="isSubmittingBook"
                @click="handleSaveBook"
              >
                {{ t(isEditing ? 'booksPage.saveChanges' : 'booksPage.createBook') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>

      <!-- Dialog Xác nhận xóa sách -->
      <ConfirmDialog
        v-model="showDeleteConfirm"
        :title="t('booksPage.deleteBook')"
        :message="t('booksPage.confirmDelete', { title: bookToDelete?.title })"
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
            >{{ t('booksPage.close') }}</v-btn
          >
        </template>
      </v-snackbar>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
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
import ListPagination from "../../components/shared/ListPagination.vue";

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

// Danh sách sách & trạng thái tải
const books = ref([]);
const booksPage = ref(1);
const booksPageSize = 20;
const pagedBooks = computed(() => books.value.slice((booksPage.value - 1) * booksPageSize, booksPage.value * booksPageSize));
const isLoading = ref(false);
const loadError = ref('');
const selectedGrade = ref(null);
const baseSubjects = [
  "Toán",
  "Tiếng Việt",
  "Ngữ Văn",
  "Tiếng Anh",
  "Đạo đức",
  "Tự nhiên và Xã hội",
  "Khoa học",
  "Lịch sử",
  "Địa lí",
  "Lịch sử và Địa lí",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Tin học",
  "Công nghệ",
  "Giáo dục công dân",
  "Giáo dục kinh tế và pháp luật",
  "Âm nhạc",
  "Mĩ thuật",
  "Giáo dục thể chất",
  "Hoạt động trải nghiệm",
];
// Danh mục môn lớp 9 được lấy từ các sheet môn học trong workbook người dùng cung cấp.
const workbookSubjectsByGrade = {
  9: ["Toán", "Ngữ văn", "Địa lí", "Lịch sử", "Tiếng Anh"],
};
const subjectTranslationKeys = {
  'Toán': 'math',
  'Tiếng Việt': 'vietnamese',
  'Ngữ Văn': 'literature',
  'Ngữ văn': 'literature',
  'Tiếng Anh': 'english',
  'Đạo đức': 'ethics',
  'Tự nhiên và Xã hội': 'natureSociety',
  'Khoa học': 'science',
  'Lịch sử': 'history',
  'Địa lí': 'geography',
  'Lịch sử và Địa lí': 'historyGeography',
  'Vật lí': 'physics',
  'Hóa học': 'chemistry',
  'Sinh học': 'biology',
  'Tin học': 'informatics',
  'Công nghệ': 'technology',
  'Giáo dục công dân': 'civicEducation',
  'Giáo dục kinh tế và pháp luật': 'economicsLaw',
  'Âm nhạc': 'music',
  'Mĩ thuật': 'arts',
  'Giáo dục thể chất': 'physicalEducation',
  'Hoạt động trải nghiệm': 'experientialActivities',
};
const subjectOptions = computed(() =>
  [...new Set([
    ...(workbookSubjectsByGrade[bookForm.value.gradeLevel] || baseSubjects),
    ...books.value.map((book) => book.subject?.trim()).filter(Boolean),
  ])]
    .sort((a, b) => a.localeCompare(b, "vi"))
    .map((value) => ({
      title: subjectTranslationKeys[value]
        ? t(`booksPage.subjects.${subjectTranslationKeys[value]}`)
        : value,
      value,
    })),
);

// Danh sách các lớp lọc
const gradeOptions = computed(() => [
  { label: t('booksPage.allGrades'), value: null },
  ...Array.from({ length: 12 }, (_, i) => ({
    label: t('booksPage.gradeOption', { grade: i + 1 }),
    value: i + 1,
  })),
]);

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
const requiredRule = [(v) => !!v || t('booksPage.required')];
const gradeRule = [
  (v) => (Number(v) >= 1 && Number(v) <= 12) || t('booksPage.invalidGrade'),
];

// Lấy danh sách sách
async function fetchBooks() {
  isLoading.value = true;
  loadError.value = '';
  try {
    const path = selectedGrade.value
      ? `/books?gradeLevel=${selectedGrade.value}`
      : "/books";
    books.value = await api(path);
  } catch (err) {
    loadError.value = err.status === 403 ? t('booksPage.accessDenied') : (err.message || t('booksPage.loadError'));
    showNotice(err.message, "error");
  } finally {
    isLoading.value = false;
  }
}

function handleGradeChange(val) {
  selectedGrade.value = val;
  booksPage.value = 1;
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
      showNotice(t('booksPage.bookUpdated'));
    } else {
      await api("/books", {
        method: "POST",
        body: payload,
      });
      showNotice(t('booksPage.bookAdded'));
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
    showNotice(t('booksPage.bookDeleted'));
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
