<template>
  <v-layout class="min-vh-100" style="background-color: #f4f8ff">
    <AppHeader />
    <TeacherSidebar />
    <v-main>
      <v-container class="py-8" style="max-width: 1200px">
    <div class="d-flex align-center justify-space-between flex-wrap ga-4 mb-6">
      <div>
        <div class="text-overline text-primary font-weight-bold">ADMIN</div>
        <h1 class="text-h4 font-weight-black">Quản lý tài khoản</h1>
        <p class="text-body-2 text-medium-emphasis mt-2 mb-0">
          Quản lý vai trò và trạng thái tài khoản trong DuckBear.
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn color="primary" prepend-icon="mdi-account-plus-outline" @click="createOpen = true">
          Thêm tài khoản
        </v-btn>
        <v-btn prepend-icon="mdi-refresh" variant="tonal" :loading="loading" @click="loadUsers">
          Làm mới
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-alert v-if="notice" type="success" variant="tonal" class="mb-4">{{ notice }}</v-alert>

    <v-card rounded="xl" border>
      <div class="pa-4 d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="text-subtitle-1 font-weight-bold">{{ users.length }} tài khoản</div>
        <v-text-field
          v-model="search"
          label="Tìm theo tên hoặc email"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 340px"
        />
      </div>
      <v-divider />
      <v-table>
        <thead>
          <tr>
            <th>Tài khoản</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div class="font-weight-bold">{{ user.fullName }}</div>
              <div class="text-caption text-medium-emphasis">{{ user.email }}</div>
            </td>
            <td>
              <v-select
                :model-value="user.role"
                :items="roles"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="savingId === user.id || user.id === auth.user?.id"
                style="min-width: 160px"
                @update:model-value="updateUser(user, { role: $event })"
              />
            </td>
            <td>
              <v-switch
                :model-value="user.isActive"
                color="success"
                hide-details
                density="compact"
                :label="user.isActive ? 'Đang hoạt động' : 'Đã khóa'"
                :disabled="savingId === user.id || user.id === auth.user?.id"
                @update:model-value="updateUser(user, { isActive: $event })"
              />
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
          </tr>
          <tr v-if="!loading && !filteredUsers.length">
            <td colspan="4" class="text-center text-medium-emphasis py-8">Không tìm thấy tài khoản.</td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="loading && !users.length" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </v-card>

    <v-dialog v-model="createOpen" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Tạo tài khoản</v-card-title>
        <v-card-text>
          <v-text-field v-model="newUser.fullName" label="Họ và tên" variant="outlined" />
          <v-text-field v-model="newUser.email" label="Email" type="email" variant="outlined" />
          <v-text-field v-model="newUser.password" label="Mật khẩu tạm thời" type="password" variant="outlined" />
          <v-select v-model="newUser.role" :items="roles" item-title="title" item-value="value" label="Vai trò" variant="outlined" />
          <div class="text-caption text-medium-emphasis">Mật khẩu cần ít nhất 6 ký tự.</div>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="createOpen = false">Hủy</v-btn>
          <v-btn color="primary" :loading="creating" @click="createUser">Tạo tài khoản</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../services/api";

const auth = useAuthStore();
const users = ref([]);
const search = ref("");
const loading = ref(false);
const savingId = ref(null);
const error = ref("");
const notice = ref("");
const createOpen = ref(false);
const creating = ref(false);
const newUser = ref({ fullName: "", email: "", password: "", role: "STUDENT" });
const roles = [
  { title: "Quản trị viên", value: "ADMIN" },
  { title: "Giáo viên", value: "TEACHER" },
  { title: "Học sinh", value: "STUDENT" },
];

const filteredUsers = computed(() => {
  const query = search.value?.trim().toLocaleLowerCase();
  if (!query) return users.value;
  return users.value.filter((user) =>
    `${user.fullName} ${user.email}`.toLocaleLowerCase().includes(query),
  );
});

async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    users.value = await api("/auth/users");
  } catch (err) {
    error.value = err.message || "Không tải được danh sách tài khoản.";
  } finally {
    loading.value = false;
  }
}

async function updateUser(user, changes) {
  savingId.value = user.id;
  error.value = "";
  notice.value = "";
  try {
    const updated = await api(`/auth/users/${user.id}`, { method: "PATCH", body: changes });
    users.value = users.value.map((item) => item.id === user.id ? updated : item);
    notice.value = "Đã cập nhật tài khoản.";
  } catch (err) {
    error.value = err.message || "Không thể cập nhật tài khoản.";
  } finally {
    savingId.value = null;
  }
}

async function createUser() {
  creating.value = true;
  error.value = "";
  notice.value = "";
  try {
    const created = await api("/auth/users", { method: "POST", body: newUser.value });
    users.value = [created, ...users.value];
    newUser.value = { fullName: "", email: "", password: "", role: "STUDENT" };
    createOpen.value = false;
    notice.value = "Đã tạo tài khoản.";
  } catch (err) {
    error.value = err.message || "Không thể tạo tài khoản.";
  } finally {
    creating.value = false;
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

onMounted(loadUsers);
</script>
