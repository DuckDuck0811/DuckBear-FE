<template>
  <v-card
    class="shub-book-card w-100 d-flex flex-column h-100"
    role="button"
    tabindex="0"
    :aria-label="`Xem chi tiết sách ${book.title}`"
    @click="emit('click', book)"
    @keydown.enter="emit('click', book)"
  >
    <!-- Bìa sách Gradient sắc màu tươi sáng -->
    <div
      class="book-card-cover pa-5 position-relative d-flex flex-column justify-space-between"
      :style="{ background: coverConfig.gradient }"
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
          LỚP {{ book.gradeLevel }}
        </v-chip>

        <span class="subject-tag font-weight-bold text-caption text-white">
          {{ book.subject }}
        </span>
      </div>

      <!-- Icon môn học lớn rực rỡ ở giữa bìa -->
      <div
        class="cover-icon-center text-center my-auto py-4 position-relative z-1"
      >
        <v-icon :icon="coverConfig.icon" size="44" color="#FFFFFF" />
      </div>

      <!-- Footer bìa: Logo nhỏ mờ -->
      <div
        class="d-flex justify-space-between align-center text-caption text-white-50 position-relative z-1"
      >
        <span>DUCKBEAR CLASSROOM</span>
        <v-icon icon="mdi-school" size="16" color="#FFFFFF" />
      </div>
    </div>

    <!-- Thân sách: Tên & Thông tin -->
    <v-card-text
      class="pa-5 d-flex flex-column flex-grow-1 justify-space-between bg-white"
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
          Khám phá
        </v-btn>

        <!-- Thao tác Sửa / Xóa cho Teacher -->
        <div v-if="canEdit" class="d-flex align-center ga-1" @click.stop>
          <v-btn
            icon="mdi-pencil-outline"
            size="small"
            variant="text"
            color="primary"
            title="Sửa sách"
            @click="emit('edit', book, $event)"
          />
          <v-btn
            icon="mdi-trash-can-outline"
            size="small"
            variant="text"
            color="error"
            title="Xóa sách"
            @click="emit('delete', book, $event)"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

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

// Màu gradient bìa sách tươi sáng theo khối lớp & môn học
const coverConfig = computed(() => {
  const grade = Number(props.book.gradeLevel) || 1;
  const subject = (props.book.subject || "").toLowerCase();

  if (subject.includes("toán")) {
    return {
      gradient: "linear-gradient(135deg, #2F7CF6 0%, #1F5FD0 100%)",
      badgeColor: "#EAF2FF",
      badgeTextColor: "#2F7CF6",
      icon: "mdi-calculator-variant",
    };
  }
  if (subject.includes("văn") || subject.includes("tiếng việt")) {
    return {
      gradient: "linear-gradient(135deg, #FF9F43 0%, #E07A18 100%)",
      badgeColor: "#FFF3E8",
      badgeTextColor: "#E07A18",
      icon: "mdi-feather",
    };
  }
  if (
    subject.includes("anh") ||
    subject.includes("ngoại ngữ") ||
    subject.includes("english")
  ) {
    return {
      gradient: "linear-gradient(135deg, #2BC48A 0%, #1EA873 100%)",
      badgeColor: "#E9F9F3",
      badgeTextColor: "#1EA873",
      icon: "mdi-translate",
    };
  }
  if (
    subject.includes("tin") ||
    subject.includes("công nghệ") ||
    subject.includes("tin học")
  ) {
    return {
      gradient: "linear-gradient(135deg, #7C5CFC 0%, #6242E6 100%)",
      badgeColor: "#F2EFFF",
      badgeTextColor: "#6242E6",
      icon: "mdi-laptop",
    };
  }

  // Phân theo khối lớp nếu môn học khác
  if (grade <= 5) {
    return {
      gradient: "linear-gradient(135deg, #FFC83D 0%, #F5AB00 100%)",
      badgeColor: "#FFF8E6",
      badgeTextColor: "#B37D00",
      icon: "mdi-star-face",
    };
  }
  return {
    gradient: "linear-gradient(135deg, #FF6B9A 0%, #E54D7E 100%)",
    badgeColor: "#FFEBF1",
    badgeTextColor: "#E54D7E",
    icon: "mdi-book-open-page-variant",
  };
});

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}
</script>

<style scoped>
.shub-book-card {
  border-radius: 20px !important;
  border: 1px solid #e4ecf7 !important;
  box-shadow: 0 6px 20px rgba(47, 124, 246, 0.06) !important;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.shub-book-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: 0 16px 32px rgba(47, 124, 246, 0.14) !important;
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
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.decor-circle-2 {
  position: absolute;
  bottom: -15px;
  left: 10px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.grade-chip {
  background: rgba(255, 255, 255, 0.95) !important;
  color: #1d2939 !important;
  font-size: 0.72rem !important;
}

.subject-tag {
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 10px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.text-white-50 {
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.1em;
  font-size: 0.65rem;
  font-weight: 700;
}

.book-card-title {
  color: #1d2939;
  line-height: 1.35;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
