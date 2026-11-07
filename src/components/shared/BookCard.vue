<template>
  <v-card
    class="shub-book-card w-100 d-flex flex-column h-100"
    role="button"
    tabindex="0"
    :aria-label="t('booksPage.viewBook', { title: book.title })"
    @click="emit('click', book)"
    @keydown.enter="emit('click', book)"
  >
    <!-- Bìa sách Gradient sắc màu tươi sáng -->
    <div
      class="book-card-cover pa-5 position-relative d-flex flex-column justify-space-between"
      :style="{ ...coverConfig.style, background: coverConfig.gradient }"
    >
      <!-- Họa tiết bong bóng trang trí mờ -->
      <div class="decor-circle-1" />
      <div class="decor-circle-2" />

      <!-- Header bìa sách -->
      <div
        class="d-flex justify-space-between align-center position-relative z-1"
      >
        <v-chip
          size="small"
          class="font-weight-black grade-chip"
          variant="flat"
        >
          {{ t('booksPage.gradeOption', { grade: book.gradeLevel }) }}
        </v-chip>

        <span class="subject-tag font-weight-bold text-caption">
          {{ subjectLabel }}
        </span>
      </div>

      <!-- Icon môn học lớn rực rỡ ở giữa bìa -->
      <div
        class="cover-icon-center text-center my-auto py-4 position-relative z-1"
      >
        <v-icon :icon="coverConfig.icon" size="44" class="cover-foreground" />
      </div>

      <!-- Footer bìa: Logo nhỏ mờ -->
      <div
        class="d-flex justify-space-between align-center text-caption cover-muted position-relative z-1"
      >
        <span>{{ t('booksPage.coverBrand') }}</span>
        <v-icon icon="mdi-school" size="16" class="cover-foreground" />
      </div>
    </div>

    <!-- Thân sách: Tên & Thông tin -->
    <v-card-text
      class="pa-5 d-flex flex-column flex-grow-1 justify-space-between bg-surface"
    >
      <div>
        <h3 class="book-card-title text-h6 font-weight-bold mb-2 line-clamp-2">
          {{ book.title }}
        </h3>
        <div class="book-date text-caption text-grey">
          <v-icon icon="mdi-calendar-blank-outline" size="14" class="mr-1" />
          {{ formatDate(book.createdAt) }}
        </div>
      </div>

      <!-- Vùng hành động chân thẻ -->
      <div
        class="card-footer-actions pt-4 border-t d-flex justify-space-between align-center mt-4"
      >
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          rounded="pill"
          append-icon="mdi-arrow-right"
          class="font-weight-bold"
        >
          {{ t('booksPage.explore') }}
        </v-btn>

        <!-- Thao tác Sửa / Xóa cho Teacher -->
        <div v-if="canEdit" class="d-flex align-center ga-1" @click.stop>
          <v-btn
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            color="primary"
            :title="t('booksPage.editBook')"
            @click="emit('edit', book, $event)"
          />
          <v-btn
            icon="mdi-trash-can-outline"
            size="small"
            variant="text"
            color="error"
            :title="t('booksPage.deleteBook')"
            @click="emit('delete', book, $event)"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getSubjectTheme, subjectThemeGradient, subjectThemeStyle } from '../../utils/subjectTheme.js';

const { t, locale } = useI18n();

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click", "edit", "delete"]);

const subjectLabelKeys = {
  'Toán': 'math', 'Tiếng Việt': 'vietnamese', 'Ngữ Văn': 'literature', 'Ngữ văn': 'literature',
  'Tiếng Anh': 'english', 'Đạo đức': 'ethics', 'Tự nhiên và Xã hội': 'natureSociety', 'Khoa học': 'science',
  'Lịch sử': 'history', 'Địa lí': 'geography', 'Lịch sử và Địa lí': 'historyGeography', 'Vật lí': 'physics',
  'Hóa học': 'chemistry', 'Sinh học': 'biology', 'Tin học': 'informatics', 'Công nghệ': 'technology',
  'Giáo dục công dân': 'civicEducation', 'Giáo dục kinh tế và pháp luật': 'economicsLaw', 'Âm nhạc': 'music',
  'Mĩ thuật': 'arts', 'Giáo dục thể chất': 'physicalEducation', 'Hoạt động trải nghiệm': 'experientialActivities',
};
const subjectLabel = computed(() => {
  const key = subjectLabelKeys[props.book.subject];
  return key ? t(`booksPage.subjects.${key}`) : props.book.subject;
});

const coverConfig = computed(() => {
  const theme = getSubjectTheme(props.book.subject, props.book.gradeLevel);
  return { icon: theme.icon, style: subjectThemeStyle(theme), gradient: subjectThemeGradient(theme) };
});

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US');
}
</script>

<style scoped>
.shub-book-card {
  border-radius: 20px !important;
  border: 1px solid rgba(var(--v-theme-primary), .12) !important;
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), .06) !important;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.shub-book-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: 0 16px 32px rgba(var(--v-theme-primary), .14) !important;
}

.book-card-cover {
  height: 165px;
}

.decor-circle-1 {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-secondary), .12);
  pointer-events: none;
}

.decor-circle-2 {
  position: absolute;
  bottom: -15px;
  left: 10px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-secondary), .08);
  pointer-events: none;
}

.grade-chip {
  background: rgba(var(--v-theme-surface), .95) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 0.72rem !important;
}

.subject-tag {
  background: rgba(var(--v-theme-on-secondary), .15);
  color: rgb(var(--v-theme-on-secondary));
  padding: 2px 10px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.cover-muted {
  color: rgba(var(--v-theme-on-secondary), .7);
  letter-spacing: 0.1em;
  font-size: 0.65rem;
  font-weight: 700;
}

.book-card-title {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.35;
}
.cover-foreground { color: rgb(var(--v-theme-on-secondary)); }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
