<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="9" md="7" lg="6">
        <v-card class="pa-6 pa-sm-10" rounded="xl" elevation="3">
          <v-card-title class="text-h4 font-weight-bold px-0">
            {{ t('welcome') }}
          </v-card-title>
          <v-card-text class="text-body-1 px-0">
            {{ t('description') }}
          </v-card-text>
          <v-select
            v-model="locale"
            :label="t('language')"
            :items="[
              { title: 'Tiếng Việt', value: 'vi' },
              { title: 'English', value: 'en' },
            ]"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            hide-details
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
