<template>
  <v-layout class="min-vh-100" style="background-color: #f4f8ff">
    <AppHeader />

    <v-main
      class="d-flex align-center justify-center py-12"
      style="background-color: #f4f8ff"
    >
      <v-card
        class="rounded-xl pa-8 pa-md-12 text-center bg-white fade-in-up mx-4 not-found-shub"
        elevation="0"
        style="max-width: 560px; border: 1px solid #e4ecf7"
      >
        <DuckBearMascot :size="120" mood="empty" class="mb-4 animate-float" />

        <div class="text-h2 font-weight-black text-primary mb-2">404</div>

        <h1 class="text-h5 font-weight-black text-primary mb-3">
          Không tìm thấy trang này rồi!
        </h1>

        <p class="text-body-2 text-secondary mb-8" style="line-height: 1.6">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc tài liệu này đã được
          chuyển sang mục khác trong lớp học DuckBear.
        </p>

        <v-btn
          color="primary"
          size="large"
          rounded="pill"
          class="btn-shub-primary px-8 font-weight-black"
          prepend-icon="mdi-home"
          @click="goHome"
        >
          Trở về Thư viện giáo trình
        </v-btn>
      </v-card>
    </v-main>
  </v-layout>
</template>

<script setup>
import { useRouter } from "vue-router";
import AppHeader from "../components/common/AppHeader.vue";
import DuckBearMascot from "../components/common/DuckBearMascot.vue";

const router = useRouter();

function goHome() {
  router.push("/");
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.not-found-shub {
  box-shadow: 0 10px 30px rgba(47, 124, 246, 0.08) !important;
}
</style>
