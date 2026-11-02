<template>
  <v-layout class="min-vh-100 profile-page">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />
    <v-main class="pb-16">
      <v-container class="py-8 px-4 px-md-8" style="max-width: 1120px">
        <div class="page-heading mb-5">
          <div class="text-overline text-primary font-weight-bold">{{ t('profilePage.eyebrow') }}</div>
          <h1 class="text-h4 font-weight-black mb-1">{{ t('profilePage.title') }}</h1>
          <p class="text-body-2 text-secondary mb-0">{{ t('profilePage.subtitle') }}</p>
        </div>

        <v-alert v-if="pageError" type="error" variant="tonal" class="mb-5">{{ pageError }}</v-alert>

        <v-row align="start">
          <v-col cols="12" md="4">
            <v-card class="identity-card rounded-xl pa-5 pa-md-6" elevation="0">
              <div class="identity-topline">
                <span class="identity-dot" />
                <span>{{ t('profilePage.accountActive') }}</span>
              </div>
              <v-avatar size="96" color="primary" class="identity-avatar my-5">
                <v-img v-if="avatarUrl" :src="avatarUrl" :alt="profile.fullName" cover />
                <span v-else class="text-h3 font-weight-black">{{ initials }}</span>
              </v-avatar>
              <h2 class="text-h6 font-weight-black identity-name">{{ profile.fullName || authStore.user?.fullName }}</h2>
              <p class="text-body-2 text-secondary identity-email">{{ profile.email || authStore.user?.email }}</p>
              <v-chip size="small" color="primary" variant="tonal" prepend-icon="mdi-account-outline">{{ roleLabel }}</v-chip>
              <v-divider class="my-5" />
              <div class="text-caption text-secondary mb-3">{{ t('profilePage.photoHint') }}</div>
              <v-btn block variant="tonal" color="primary" prepend-icon="mdi-image-edit-outline" :loading="loading" @click="avatarInput?.click()">
                {{ t('profilePage.changePhoto') }}
              </v-btn>
              <v-btn v-if="avatarUrl" block variant="text" color="error" class="mt-1" @click="clearAvatar">
                {{ t('profilePage.removePhoto') }}
              </v-btn>
              <input ref="avatarInput" class="d-none" type="file" accept="image/png,image/jpeg,image/webp" @change="handleAvatarFile" />
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card class="profile-card rounded-xl pa-5 pa-md-7 mb-5" elevation="0">
              <div class="section-heading mb-5">
                <div class="section-icon section-icon--profile"><v-icon icon="mdi-card-account-details-outline" /></div>
                <div>
                  <h2 class="text-h6 font-weight-black">{{ t('profilePage.detailsTitle') }}</h2>
                  <p class="text-caption text-secondary mb-0">{{ t('profilePage.detailsHint') }}</p>
                </div>
              </div>

              <v-alert v-if="profileError" type="error" variant="tonal" density="comfortable" class="mb-4">{{ profileError }}</v-alert>
              <v-alert v-if="profileSuccess" type="success" variant="tonal" density="comfortable" class="mb-4">{{ profileSuccess }}</v-alert>

              <v-form @submit.prevent="saveProfile">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profile.fullName" :label="t('profilePage.fullName')" prepend-inner-icon="mdi-account-outline" variant="outlined" autocomplete="name" :rules="[rules.required, rules.nameLength]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profile.email" :label="t('profilePage.email')" prepend-inner-icon="mdi-email-outline" variant="outlined" type="email" autocomplete="email" :rules="[rules.required, rules.email]" />
                  </v-col>
                </v-row>
                <div class="form-footer pt-2">
                  <span class="text-caption text-secondary">{{ t('profilePage.detailsFootnote') }}</span>
                  <v-btn type="submit" color="primary" rounded="lg" prepend-icon="mdi-content-save-outline" :loading="savingProfile">
                    {{ t('profilePage.saveProfile') }}
                  </v-btn>
                </div>
              </v-form>
            </v-card>

            <v-card class="profile-card rounded-xl pa-5 pa-md-7" elevation="0">
              <div class="section-heading mb-5">
                <div class="section-icon section-icon--security"><v-icon icon="mdi-lock-reset" /></div>
                <div>
                  <h2 class="text-h6 font-weight-black">{{ t('profilePage.securityTitle') }}</h2>
                  <p class="text-caption text-secondary mb-0">{{ t('profilePage.passwordHint') }}</p>
                </div>
              </div>

              <v-alert v-if="passwordError" type="error" variant="tonal" density="comfortable" class="mb-4">{{ passwordError }}</v-alert>
              <v-alert v-if="passwordSuccess" type="success" variant="tonal" density="comfortable" class="mb-4">{{ passwordSuccess }}</v-alert>

              <v-form @submit.prevent="changePassword">
                <v-text-field v-model="passwordForm.currentPassword" :label="t('profilePage.currentPassword')" prepend-inner-icon="mdi-lock-outline" variant="outlined" autocomplete="current-password" :type="showCurrentPassword ? 'text' : 'password'" :append-inner-icon="showCurrentPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" @click:append-inner="showCurrentPassword = !showCurrentPassword" class="mb-2" />
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="passwordForm.newPassword" :label="t('profilePage.newPassword')" prepend-inner-icon="mdi-lock-plus-outline" variant="outlined" autocomplete="new-password" :type="showNewPassword ? 'text' : 'password'" :append-inner-icon="showNewPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :rules="[rules.passwordLength]" @click:append-inner="showNewPassword = !showNewPassword" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="passwordForm.confirmPassword" :label="t('profilePage.confirmPassword')" prepend-inner-icon="mdi-lock-check-outline" variant="outlined" autocomplete="new-password" :type="showNewPassword ? 'text' : 'password'" :rules="[rules.passwordMatch]" />
                  </v-col>
                </v-row>
                <div class="form-footer pt-2">
                  <span class="text-caption text-secondary">{{ t('profilePage.passwordFootnote') }}</span>
                  <v-btn type="submit" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-key-change" :loading="savingPassword">
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
const roleLabel = computed(() => {
  const role = authStore.user?.role
  return t(`profilePage.roles.${role || 'member'}`)
})

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
.page-heading { padding: 2px 2px 0; }
.identity-card,
.profile-card {
  border: 1px solid #e1eaf6;
  background: #fff;
  box-shadow: 0 3px 14px rgba(25, 55, 100, .035);
}
.identity-card { text-align: center; }
.identity-topline { display: inline-flex; align-items: center; gap: 7px; color: #16835d; font-size: .75rem; font-weight: 700; }
.identity-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px #e9f9ef; }
.identity-avatar { border: 4px solid #f2f6fc; box-shadow: 0 4px 12px rgba(29, 78, 216, .1); }
.identity-name { color: #172b4d; overflow-wrap: anywhere; }
.identity-email { overflow-wrap: anywhere; }
.profile-card { transition: border-color .18s ease, box-shadow .18s ease; }
.profile-card:hover { border-color: #d3e1f2; box-shadow: 0 7px 20px rgba(25, 55, 100, .06); }
.section-heading { display: flex; align-items: center; gap: 12px; }
.section-heading h2 { color: #172b4d; }
.section-icon { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border-radius: 12px; }
.section-icon--profile { background: #edf4ff; color: #3478df; }
.section-icon--security { background: #fff6e8; color: #c98218; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid #edf2f8; }
@media (max-width: 600px) {
  .form-footer { align-items: stretch; flex-direction: column-reverse; }
  .form-footer .v-btn { align-self: flex-end; }
}
</style>
