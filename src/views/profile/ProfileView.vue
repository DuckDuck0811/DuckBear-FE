<template>
  <v-layout class="min-vh-100 profile-page">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />
    <v-main class="pb-16">
      <v-container class="py-8 px-4 px-md-8" style="max-width: 1040px">
        <div class="mb-6">
          <div class="text-overline text-primary font-weight-bold">{{ t('profilePage.eyebrow') }}</div>
          <h1 class="text-h4 font-weight-black mb-1">{{ t('profilePage.title') }}</h1>
          <p class="text-body-2 text-secondary mb-0">{{ t('profilePage.subtitle') }}</p>
        </div>

        <v-alert v-if="pageError" type="error" variant="tonal" class="mb-5">{{ pageError }}</v-alert>

        <v-row>
          <v-col cols="12" md="7">
            <v-card class="profile-card rounded-xl pa-5 pa-md-7" elevation="0">
              <div class="d-flex align-center ga-4 mb-6">
                <v-avatar size="84" color="primary" class="profile-avatar">
                  <v-img v-if="avatarUrl" :src="avatarUrl" :alt="profile.fullName" cover />
                  <span v-else class="text-h4 font-weight-black">{{ initials }}</span>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-black">{{ profile.fullName || authStore.user?.fullName }}</div>
                  <div class="text-body-2 text-secondary mb-2">{{ profile.email || authStore.user?.email }}</div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-image-edit-outline" :loading="loading" @click="avatarInput?.click()">
                      {{ t('profilePage.changePhoto') }}
                    </v-btn>
                    <v-btn v-if="avatarUrl" size="small" variant="text" color="error" @click="clearAvatar">
                      {{ t('profilePage.removePhoto') }}
                    </v-btn>
                  </div>
                  <input ref="avatarInput" class="d-none" type="file" accept="image/png,image/jpeg,image/webp" @change="handleAvatarFile" />
                </div>
              </div>

              <v-alert v-if="profileError" type="error" variant="tonal" density="comfortable" class="mb-4">{{ profileError }}</v-alert>
              <v-alert v-if="profileSuccess" type="success" variant="tonal" density="comfortable" class="mb-4">{{ profileSuccess }}</v-alert>

              <v-form @submit.prevent="saveProfile">
                <v-text-field
                  v-model="profile.fullName"
                  :label="t('profilePage.fullName')"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  autocomplete="name"
                  :rules="[rules.required, rules.nameLength]"
                  class="mb-2"
                />
                <v-text-field
                  v-model="profile.email"
                  :label="t('profilePage.email')"
                  prepend-inner-icon="mdi-email-outline"
                  variant="outlined"
                  type="email"
                  autocomplete="email"
                  :rules="[rules.required, rules.email]"
                  class="mb-2"
                />
                <div class="d-flex justify-end">
                  <v-btn type="submit" color="primary" rounded="pill" prepend-icon="mdi-content-save-outline" :loading="savingProfile">
                    {{ t('profilePage.saveProfile') }}
                  </v-btn>
                </div>
              </v-form>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card class="profile-card rounded-xl pa-5 pa-md-7" elevation="0">
              <div class="d-flex align-center ga-3 mb-5">
                <v-avatar color="warning" variant="tonal" rounded="lg"><v-icon icon="mdi-lock-reset" /></v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-black">{{ t('profilePage.passwordTitle') }}</h2>
                  <p class="text-caption text-secondary mb-0">{{ t('profilePage.passwordHint') }}</p>
                </div>
              </div>

              <v-alert v-if="passwordError" type="error" variant="tonal" density="comfortable" class="mb-4">{{ passwordError }}</v-alert>
              <v-alert v-if="passwordSuccess" type="success" variant="tonal" density="comfortable" class="mb-4">{{ passwordSuccess }}</v-alert>

              <v-form @submit.prevent="changePassword">
                <v-text-field
                  v-model="passwordForm.currentPassword"
                  :label="t('profilePage.currentPassword')"
                  prepend-inner-icon="mdi-lock-outline"
                  variant="outlined"
                  autocomplete="current-password"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :append-inner-icon="showCurrentPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showCurrentPassword = !showCurrentPassword"
                  class="mb-2"
                />
                <v-text-field
                  v-model="passwordForm.newPassword"
                  :label="t('profilePage.newPassword')"
                  prepend-inner-icon="mdi-lock-plus-outline"
                  variant="outlined"
                  autocomplete="new-password"
                  :type="showNewPassword ? 'text' : 'password'"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  :rules="[rules.passwordLength]"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  class="mb-2"
                />
                <v-text-field
                  v-model="passwordForm.confirmPassword"
                  :label="t('profilePage.confirmPassword')"
                  prepend-inner-icon="mdi-lock-check-outline"
                  variant="outlined"
                  autocomplete="new-password"
                  :type="showNewPassword ? 'text' : 'password'"
                  :rules="[rules.passwordMatch]"
                  class="mb-2"
                />
                <div class="d-flex justify-end">
                  <v-btn type="submit" color="primary" variant="tonal" rounded="pill" prepend-icon="mdi-key-change" :loading="savingPassword">
                    {{ t('profilePage.changePassword') }}
                  </v-btn>
                </div>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import AppHeader from '../../components/shared/AppHeader.vue'
import TeacherSidebar from '../../components/shared/TeacherSidebar.vue'
import StudentSidebar from '../../components/shared/StudentSidebar.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const avatarInput = ref(null)
const avatarUrl = ref(null)
const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const pageError = ref('')
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const profile = reactive({ fullName: '', email: '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const initials = computed(() => profile.fullName.trim().charAt(0).toUpperCase() || 'D')

const rules = {
  required: (value) => !!String(value || '').trim() || t('profilePage.required'),
  nameLength: (value) => String(value || '').trim().length <= 100 || t('profilePage.nameTooLong'),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '') || t('profilePage.invalidEmail'),
  passwordLength: (value) => !value || value.length >= 6 || t('profilePage.passwordTooShort'),
  passwordMatch: (value) => !value || value === passwordForm.newPassword || t('profilePage.passwordMismatch'),
}

onMounted(loadProfile)

async function loadProfile() {
  loading.value = true
  pageError.value = ''
  try {
    const user = await api('/auth/me')
    authStore.setUser(user)
    profile.fullName = user.fullName || ''
    profile.email = user.email || ''
    avatarUrl.value = user.avatarUrl || null
  } catch (error) {
    pageError.value = error.message
  } finally {
    loading.value = false
  }
}

function handleAvatarFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    profileError.value = t('profilePage.unsupportedImage')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    profileError.value = t('profilePage.imageTooLarge')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    avatarUrl.value = String(reader.result)
    profileError.value = ''
    profileSuccess.value = ''
  }
  reader.onerror = () => { profileError.value = t('profilePage.imageReadError') }
  reader.readAsDataURL(file)
}

function clearAvatar() {
  avatarUrl.value = null
  profileError.value = ''
  profileSuccess.value = ''
}

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  if (!profile.fullName.trim() || !profile.email.trim()) {
    profileError.value = t('profilePage.required')
    return
  }
  savingProfile.value = true
  try {
    const user = await api('/auth/profile', {
      method: 'PATCH',
      body: { fullName: profile.fullName.trim(), email: profile.email.trim(), avatarUrl: avatarUrl.value },
    })
    authStore.setUser(user)
    profileSuccess.value = t('profilePage.profileSaved')
  } catch (error) {
    profileError.value = error.message
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = t('profilePage.passwordFieldsRequired')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = t('profilePage.passwordTooShort')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('profilePage.passwordMismatch')
    return
  }
  savingPassword.value = true
  try {
    await api('/auth/password', {
      method: 'PATCH',
      body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordSuccess.value = t('profilePage.passwordChanged')
  } catch (error) {
    passwordError.value = error.message
  } finally {
    savingPassword.value = false
  }
}
</script>

<style scoped>
.profile-page { background: #f4f8ff; }
.profile-card { border: 1px solid #e2edfa; background: #fff; box-shadow: 0 4px 18px rgba(31, 79, 145, .04); }
.profile-avatar { border: 3px solid #eaf2ff; }
</style>
