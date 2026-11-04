<template>
  <v-layout class="schedule-page min-vh-100">
    <AppHeader />
    <TeacherSidebar />
    <StudentSidebar />

    <v-main>
      <v-container
        class="schedule-container py-3 px-3 px-md-5"
        :class="{ 'teacher-container': isTeacher }"
      >
        <header v-if="!isTeacher" class="schedule-hero mb-4">
          <div class="schedule-hero-icon">
            <v-icon icon="mdi-calendar-month-outline" size="24" />
          </div>
          <div class="schedule-hero-copy">
            <div class="schedule-eyebrow">{{ t("schedule.eyebrow") }}</div>
            <h1>{{ t("schedule.title") }}</h1>
            <p>
              {{
                t(
                  isStudent
                    ? "schedule.studentSubtitle"
                    : "schedule.teacherSubtitle",
                )
              }}
            </p>
          </div>
        </header>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-3">
          {{ errorMessage }}
        </v-alert>

        <header v-if="isTeacher" class="teacher-calendar-toolbar mb-2">
          <h1>{{ t("schedule.title") }}</h1>
          <div
            v-if="calendarClasses.length"
            class="teacher-toolbar-classes"
            :aria-label="t('schedule.filterByClass')"
          >
            <span class="toolbar-filter-label">{{
              t("schedule.filterByClass")
            }}</span>
            <v-chip
              size="x-small"
              :variant="selectedClassId === null ? 'flat' : 'outlined'"
              :color="selectedClassId === null ? 'primary' : undefined"
              @click="selectedClassId = null"
            >
              {{ t("schedule.allClasses") }}
            </v-chip>
            <v-chip
              v-for="schoolClass in calendarClasses"
              :key="schoolClass.id"
              size="x-small"
              :variant="
                selectedClassId === schoolClass.id ? 'flat' : 'outlined'
              "
              :color="classColor(schoolClass.id)"
              :class="{
                'class-filter-muted':
                  selectedClassId !== null &&
                  selectedClassId !== schoolClass.id,
              }"
              @click="toggleClassFilter(schoolClass.id)"
              >{{ schoolClass.name }}</v-chip
            >
          </div>
          <div class="week-controls teacher-month-controls">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              color="primary"
              size="x-small"
              :aria-label="t('schedule.previousMonth')"
              @click="monthOffset--"
            />
            <span class="week-date-label">{{ teacherMonthTitle }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              color="primary"
              size="x-small"
              :aria-label="t('schedule.nextMonth')"
              @click="monthOffset++"
            />
            <v-btn
              variant="tonal"
              color="primary"
              size="x-small"
              class="text-none font-weight-bold teacher-today-button"
              :disabled="monthOffset === 0"
              @click="goToCurrentMonth"
            >
              {{ t("schedule.todayButton") }}
            </v-btn>
          </div>
        </header>

        <div
          v-if="isTeacher && !loading && !errorMessage"
          class="teacher-schedule-stats mb-3"
        >
          <article class="teacher-stat-card">
            <v-icon icon="mdi-clock-fast" color="warning" size="20" />
            <div>
              <span>{{ t("schedule.upcomingSevenDays") }}</span
              ><strong>{{ upcomingSevenDaysCount }}</strong>
            </div>
          </article>
          <article class="teacher-stat-card">
            <v-icon icon="mdi-alert-circle-outline" color="error" size="20" />
            <div>
              <span>{{ t("schedule.overdueIncomplete") }}</span
              ><strong>{{
                overdueIncompleteCount === null
                  ? t("schedule.unavailableValue")
                  : overdueIncompleteCount
              }}</strong
              ><small v-if="overdueIncompleteCount === null">{{
                t("schedule.progressUnavailable")
              }}</small>
            </div>
          </article>
          <article class="teacher-stat-card">
            <v-icon
              icon="mdi-calendar-month-outline"
              color="primary"
              size="20"
            />
            <div>
              <span>{{ t("schedule.assignmentsThisMonth") }}</span
              ><strong>{{ monthEvents.length }}</strong>
            </div>
          </article>
        </div>

        <v-card
          v-if="!isTeacher"
          class="week-toolbar rounded-xl pa-4 mb-5"
          elevation="0"
        >
          <div class="week-toolbar-main">
            <div class="week-date-heading">
              <span class="week-date-label">{{ monthTitle }}</span>
            </div>
            <div class="week-controls">
              <v-btn
                icon="mdi-chevron-left"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.previousMonth')"
                @click="monthOffset--"
              />
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-bold"
                :disabled="monthOffset === 0"
                @click="goToCurrentMonth"
              >
                {{ t("schedule.currentMonth") }}
              </v-btn>
              <v-btn
                icon="mdi-chevron-right"
                variant="outlined"
                color="primary"
                size="small"
                :aria-label="t('schedule.nextMonth')"
                @click="monthOffset++"
              />
            </div>
          </div>

          <div class="schedule-stats">
            <div class="schedule-stat">
              <v-icon
                icon="mdi-calendar-check-outline"
                color="primary"
                size="19"
              />
              <span
                ><strong>{{ monthEvents.length }}</strong>
                {{ t("schedule.deadlinesMonth") }}</span
              >
            </div>
            <div class="schedule-stat">
              <v-icon icon="mdi-progress-clock" color="warning" size="19" />
              <span
                ><strong>{{ pendingCount }}</strong>
                {{ t("schedule.pending") }}</span
              >
            </div>
          </div>
        </v-card>

        <div
          v-if="!isTeacher && calendarClasses.length"
          class="class-filter-row mb-5"
        >
          <span class="class-filter-label">{{
            t("schedule.filterByClass")
          }}</span>
          <v-chip
            size="small"
            :variant="selectedClassId === null ? 'flat' : 'outlined'"
            :color="selectedClassId === null ? 'primary' : undefined"
            @click="selectedClassId = null"
          >
            {{ t("schedule.allClasses") }}
          </v-chip>
          <v-chip
            v-for="schoolClass in calendarClasses"
            :key="schoolClass.id"
            size="small"
            :variant="selectedClassId === schoolClass.id ? 'flat' : 'outlined'"
            :color="classColor(schoolClass.id)"
            :class="{
              'class-filter-muted':
                selectedClassId !== null && selectedClassId !== schoolClass.id,
            }"
            @click="toggleClassFilter(schoolClass.id)"
            >{{ schoolClass.name }}</v-chip
          >
        </div>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          rounded
          class="mb-5"
        />

        <section
          v-if="!loading && !errorMessage"
          class="schedule-workspace"
          :class="{
            'teacher-workspace': isTeacher,
            'curriculum-collapsed': isTeacher && !curriculumSidebarOpen,
            'day-detail-expanded': isTeacher && dayDetailExpanded,
          }"
        >
          <aside v-if="isTeacher" class="curriculum-sidebar">
            <div class="curriculum-heading">
              <div>
                <h2>{{ t("schedule.curriculumTitle") }}</h2>
                <p>{{ t("schedule.curriculumHint") }}</p>
              </div>
              <v-btn
                v-if="curriculumSidebarOpen"
                icon="mdi-chevron-left"
                variant="text"
                size="small"
                :aria-label="t('schedule.collapseCurriculum')"
                @click="curriculumSidebarOpen = false"
              />
              <v-btn
                v-else
                icon="mdi-chevron-right"
                variant="tonal"
                size="small"
                :aria-label="t('schedule.expandCurriculum')"
                @click="curriculumSidebarOpen = true"
              />
            </div>
            <template v-if="curriculumSidebarOpen">
              <v-text-field
                v-model="curriculumSearch"
                :label="t('schedule.searchCurriculum')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="curriculum-search"
              />
              <div v-if="curriculumLoading" class="curriculum-state">
                <v-progress-circular indeterminate color="primary" size="24" />
                <span>{{ t("schedule.loadingCurriculum") }}</span>
              </div>
              <v-alert
                v-else-if="curriculumError"
                type="error"
                variant="tonal"
                density="compact"
                class="ma-3"
              >
                {{ curriculumError }}
              </v-alert>
              <div
                v-else-if="!filteredBooks.length"
                class="curriculum-state text-medium-emphasis"
              >
                {{
                  curriculumSearch
                    ? t("schedule.noCurriculumMatch")
                    : t("schedule.noCurriculum")
                }}
              </div>
              <v-expansion-panels
                v-else
                v-model="expandedBooks"
                variant="accordion"
                class="curriculum-tree"
              >
                <v-expansion-panel
                  v-for="book in filteredBooks"
                  :key="book.id"
                  :value="book.id"
                >
                  <v-expansion-panel-title>
                    <v-icon
                      icon="mdi-book-open-page-variant-outline"
                      class="mr-2"
                      color="primary"
                    />
                    <span class="curriculum-node-title">{{ book.title }}</span>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div
                      v-if="book.loading"
                      class="curriculum-state compact-state"
                    >
                      <v-progress-circular
                        indeterminate
                        color="primary"
                        size="18"
                      />
                    </div>
                    <v-alert
                      v-else-if="book.error"
                      type="error"
                      variant="tonal"
                      density="compact"
                    >
                      {{ book.error }}
                    </v-alert>
                    <div v-else-if="book.chapters?.length" class="chapter-list">
                      <section
                        v-for="chapter in filteredChapters(book)"
                        :key="chapter.id"
                        class="curriculum-chapter"
                        :class="{
                          'curriculum-drop-source':
                            draggedCurriculum?.type === 'chapter' &&
                            draggedCurriculum.id === chapter.id,
                        }"
                        :draggable="!isMobile"
                        @dragstart="
                          startCurriculumDrag($event, {
                            type: 'chapter',
                            book,
                            chapter,
                          })
                        "
                        @dragend="
                          draggedCurriculum = null;
                          dropTargetKey = '';
                        "
                      >
                        <button
                          type="button"
                          class="chapter-toggle"
                          :aria-expanded="expandedChapters.includes(chapterKey(book, chapter))"
                          @click.stop="toggleChapter(book, chapter)"
                        >
                          <v-icon
                            :icon="
                              expandedChapters.includes(chapterKey(book, chapter))
                                ? 'mdi-chevron-down'
                                : 'mdi-chevron-right'
                            "
                            size="18"
                          />
                          <v-icon icon="mdi-folder-outline" size="17" />
                          <span class="curriculum-node-title">{{
                            chapter.title
                          }}</span>
                          <v-chip size="x-small" variant="tonal">{{
                            filteredLessons(chapter).length
                          }}</v-chip>
                        </button>
                        <v-btn
                          v-if="isMobile"
                          size="x-small"
                          variant="text"
                          color="primary"
                          class="chapter-mobile-action"
                          :aria-label="
                            t('schedule.assignChapter', {
                              title: chapter.title,
                            })
                          "
                          @click="
                            openCurriculumComposer(
                              { type: 'chapter', book, chapter },
                              selectedDay?.date && !isPastDay(selectedDay.date)
                                ? selectedDay.date
                                : new Date(),
                            )
                          "
                          >{{ t("schedule.assign") }}</v-btn
                        >
                        <div
                          v-if="expandedChapters.includes(chapterKey(book, chapter))"
                          class="lesson-list"
                        >
                          <div
                            v-for="lesson in filteredLessons(chapter)"
                            :key="lesson.id"
                            class="curriculum-lesson"
                            :class="{
                              'curriculum-drop-source':
                                draggedCurriculum?.type === 'lesson' &&
                                draggedCurriculum.id === lesson.id,
                              'curriculum-keyboard-selected':
                                keyboardLesson?.id === lesson.id,
                            }"
                            :draggable="!isMobile"
                            tabindex="0"
                            @click="selectKeyboardLesson(lesson, chapter, book)"
                            @keydown.enter.prevent="
                              selectKeyboardLesson(lesson, chapter, book)
                            "
                            @dragstart.stop="
                              startCurriculumDrag($event, {
                                type: 'lesson',
                                book,
                                chapter,
                                lesson,
                              })
                            "
                            @dragend="
                              draggedCurriculum = null;
                              dropTargetKey = '';
                            "
                          >
                            <v-icon
                              icon="mdi-book-open-blank-variant-outline"
                              size="16"
                            />
                            <span class="curriculum-node-title">{{
                              lesson.title
                            }}</span>
                            <v-btn
                              v-if="isMobile"
                              icon="mdi-calendar-plus-outline"
                              size="x-small"
                              variant="tonal"
                              color="primary"
                              :aria-label="
                                t('schedule.assignLesson', {
                                  title: lesson.title,
                                })
                              "
                              @click.stop="
                                openCurriculumComposer(
                                  { type: 'lesson', book, chapter, lesson },
                                  selectedDay?.date &&
                                    !isPastDay(selectedDay.date)
                                    ? selectedDay.date
                                    : new Date(),
                                )
                              "
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                    <div
                      v-else
                      class="curriculum-state compact-state text-medium-emphasis"
                    >
                      {{ t("schedule.noChapters") }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>
          </aside>

          <div class="schedule-calendar">
            <div
              v-if="isTeacher && isCompactLayout"
              class="compact-view-triggers mb-3 d-flex align-center gap-2"
            >
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-book-open-page-variant-outline"
                class="mr-2"
                @click="curriculumMobileDrawer = true"
              >
                {{ t("schedule.curriculumDrawerTitle") }}
              </v-btn>
              <v-btn
                variant="tonal"
                color="secondary"
                size="small"
                prepend-icon="mdi-calendar-text-outline"
                @click="dayDetailMobileDrawer = true"
              >
                {{
                  selectedDay?.shortDate || t("schedule.dayDetailDrawerTitle")
                }}
                <v-badge
                  v-if="selectedDayEvents.length"
                  :content="selectedDayEvents.length"
                  inline
                  color="primary"
                  class="ml-1"
                />
              </v-btn>
            </div>
            <div class="month-calendar">
              <div class="month-weekdays" role="row">
                <div
                  v-for="weekday in weekdayNames"
                  :key="weekday"
                  class="month-weekday"
                  role="columnheader"
                >
                  {{ weekday }}
                </div>
              </div>
              <div class="month-grid" role="grid" :aria-label="monthTitle">
                <template v-for="day in calendarDays" :key="day.key">
                  <button
                    type="button"
                    role="gridcell"
                    class="month-day-cell"
                    :data-calendar-day="day.key"
                    :aria-label="`${day.longDate}${day.events.length ? `, ${day.events.length}` : ''}`"
                    :aria-selected="selectedDayKey === day.key"
                    :class="{
                      'month-day-outside': !day.isCurrentMonth,
                      'month-day-today': day.isToday,
                      'month-day-selected': selectedDayKey === day.key,
                      'month-day-has-events': day.events.length,
                      'month-day-drop-target': dropTargetKey === day.key,
                      'month-day-disabled': isTeacher && isPastDay(day.date),
                    }"
                    @click="handleDayClick(day, $event)"
                    @dragover.prevent="
                      isTeacher &&
                      !isPastDay(day.date) &&
                      (dropTargetKey = day.key)
                    "
                    @dragleave="dropTargetKey = ''"
                    @drop.prevent="dropEvent($event, day)"
                    @keydown.enter.prevent="handleCalendarKeydown(day)"
                  >
                    <div class="month-day-cell-header">
                      <span class="month-day-number">{{ day.dayNumber }}</span>
                      <span v-if="day.isToday" class="month-day-today-mark">{{
                        t("schedule.today")
                      }}</span>
                    </div>
                    <span
                      v-if="
                        isTeacher &&
                        keyboardLesson &&
                        day.key === selectedDayKey
                      "
                      class="keyboard-drop-hint"
                      >{{ t("schedule.pressEnterToAssign") }}</span
                    >
                    <span class="month-day-event-list">
                      <span
                        v-for="event in day.events.slice(0, 2)"
                        :key="event.id"
                        class="month-event-pill"
                        :class="[
                          `month-event-${event.status}`,
                          { 'month-event-draggable': isTeacher },
                        ]"
                        :style="eventClassStyle(event)"
                        :draggable="isTeacher"
                        role="button"
                        tabindex="0"
                        @click.stop="openEventDrawer(event)"
                        @keydown.enter.stop="openEventDrawer(event)"
                        @keydown.space.prevent.stop="openEventDrawer(event)"
                        @dragstart.stop="startDrag($event, event)"
                        @dragend="dropTargetKey = ''"
                        :title="`${formatTime(event.deadline)} · ${event.title}`"
                      >
                        <span class="month-event-time">{{
                          formatTime(event.deadline)
                        }}</span>
                        <span class="month-event-title">{{ event.title }}</span>
                      </span>
                      <span
                        v-if="day.events.length > 2"
                        class="month-event-more"
                      >
                        +{{ day.events.length - 2 }}
                        {{ t("schedule.moreEvents") }}
                      </span>
                    </span>
                    <span
                      v-if="day.events.length"
                      class="month-day-mobile-count"
                    >
                      {{ day.events.length }}
                    </span>
                  </button>
                </template>
              </div>
            </div>

            <!-- Student View: Day Agenda below Month Calendar -->
            <div v-if="!isTeacher" class="selected-day-agenda">
              <header class="agenda-heading">
                <div>
                  <div class="agenda-eyebrow">{{ selectedDay?.weekday }}</div>
                  <h2>{{ selectedDay?.longDate }}</h2>
                </div>
                <v-chip
                  v-if="selectedDay?.isToday"
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ t("schedule.today") }}
                </v-chip>
              </header>

              <div v-if="selectedDayEvents.length" class="agenda-events">
                <article
                  v-for="event in selectedDayEvents"
                  :key="event.id"
                  class="agenda-event"
                  :class="`agenda-event-${event.status}`"
                  :style="eventClassStyle(event)"
                  role="button"
                  tabindex="0"
                  @click="openEventDrawer(event)"
                  @keydown.enter="openEventDrawer(event)"
                >
                  <div class="agenda-event-time">
                    <v-icon icon="mdi-clock-outline" size="17" />
                    <span>{{ formatTime(event.deadline) }}</span>
                  </div>
                  <div class="agenda-event-main">
                    <div class="agenda-event-title" :title="event.title">
                      {{ event.title }}
                    </div>
                    <v-chip
                      v-if="event.type === 'manual'"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      class="mt-1"
                      >{{ t("schedule.manualAssignmentTag") }}</v-chip
                    >
                    <div class="agenda-event-context">
                      <span v-if="event.class?.name"
                        ><v-icon icon="mdi-account-group-outline" size="14" />{{
                          event.class.name
                        }}</span
                      >
                      <span v-if="event.lesson?.title"
                        ><v-icon
                          icon="mdi-book-open-page-variant-outline"
                          size="14"
                        />{{ event.lesson.title }}</span
                      >
                      <span v-if="isStudent && event.createdBy?.fullName"
                        ><v-icon icon="mdi-account-outline" size="14" />{{
                          event.createdBy.fullName
                        }}</span
                      >
                    </div>
                  </div>
                  <div class="agenda-event-actions">
                    <v-chip
                      size="small"
                      variant="tonal"
                      :color="statusColor(event.status)"
                      class="font-weight-bold"
                    >
                      {{ t(`schedule.${event.status}`) }}
                    </v-chip>
                    <v-btn
                      v-if="isStudent"
                      color="primary"
                      variant="tonal"
                      size="small"
                      rounded="pill"
                      class="text-none font-weight-bold"
                      @click="openEvent(event)"
                    >
                      {{
                        t(
                          event.type === "manual"
                            ? "schedule.openManualAssignment"
                            : "schedule.openAssignment",
                        )
                      }}
                      <v-icon end icon="mdi-arrow-right" size="16" />
                    </v-btn>
                  </div>
                </article>
              </div>

              <div v-else class="agenda-empty">
                <v-icon icon="mdi-coffee-outline" size="24" />
                <div>
                  <strong>{{ t("schedule.noDayEvents") }}</strong>
                  <span>{{ t("schedule.noEvents") }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Teacher 3rd Column: Sticky Day Detail Panel -->
          <aside
            v-if="isTeacher && dayDetailExpanded"
            class="selected-day-agenda day-detail-panel is-teacher"
          >
            <header class="agenda-heading">
              <div class="day-detail-heading-copy">
                <div class="agenda-eyebrow">{{ selectedDay?.weekday }}</div>
                <h2>{{ selectedDay?.shortDate || selectedDay?.longDate }}</h2>
              </div>
              <div class="day-detail-actions">
                <v-chip
                  v-if="selectedDay?.isToday"
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold"
                >{{ t("schedule.today") }}</v-chip>
                <v-btn
                  v-if="selectedDay && !isPastDay(selectedDay.date)"
                  icon="mdi-plus"
                  variant="text"
                  size="small"
                  :aria-label="t('schedule.quickCreateTitle')"
                  @click="openQuickCreate(selectedDay)"
                />
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  :aria-label="t('schedule.closeDetails')"
                  @click="dayDetailExpanded = false"
                />
              </div>
            </header>

            <div class="agenda-content">
              <!-- Danh sách bài trong ngày đã chọn -->
              <div v-if="selectedDayEvents.length" class="agenda-section mb-3">
                <div class="agenda-section-title">
                  <span>{{ t("schedule.dayAssignmentsTitle") }}</span>
                  <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                    {{ selectedDayEvents.length }}
                  </v-chip>
                </div>
                <div class="agenda-events">
                  <article
                    v-for="event in selectedDayEvents"
                    :key="event.id"
                    class="agenda-event"
                    :class="`agenda-event-${event.status}`"
                    :style="eventClassStyle(event)"
                    role="button"
                    tabindex="0"
                    @click="openEventDrawer(event)"
                    @keydown.enter="openEventDrawer(event)"
                  >
                    <div class="agenda-event-top">
                      <div class="agenda-event-time">
                        <v-icon icon="mdi-clock-outline" size="14" />
                        <span>{{ formatTime(event.deadline) }}</span>
                      </div>
                      <v-chip
                        size="x-small"
                        variant="tonal"
                        :color="statusColor(event.status)"
                        class="font-weight-bold"
                      >
                        {{ t(`schedule.${event.status}`) }}
                      </v-chip>
                    </div>
                    <div class="agenda-event-main">
                      <div class="agenda-event-title" :title="event.title">
                        {{ event.title }}
                      </div>
                      <div class="agenda-event-context">
                        <span v-if="event.class?.name" class="class-badge">
                          <span
                            class="class-color-dot"
                            :style="{ backgroundColor: classColor(event.classId || event.class?.id) }"
                          ></span>
                          {{ event.class.name }}
                        </span>
                        <v-chip
                          v-if="event.type === 'manual'"
                          size="x-small"
                          color="primary"
                          variant="tonal"
                          >{{ t("schedule.manualAssignmentTag") }}</v-chip
                        >
                      </div>
                    </div>
                    <!-- Tiến độ nộp nếu có dữ liệu -->
                    <div
                      v-if="event.submittedCount !== undefined && event.totalStudents"
                      class="agenda-event-progress mt-1"
                    >
                      <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                        <span>{{ t("schedule.submissionProgress") }}</span>
                        <strong>{{ event.submittedCount }}/{{ event.totalStudents }}</strong>
                      </div>
                      <v-progress-linear
                        :model-value="(event.submittedCount / event.totalStudents) * 100"
                        color="success"
                        height="4"
                        rounded
                      />
                    </div>
                    <div class="agenda-event-actions">
                      <v-btn
                        color="primary"
                        variant="tonal"
                        size="small"
                        rounded="pill"
                        class="text-none font-weight-bold w-100"
                        @click.stop="openEventDrawer(event)"
                      >
                        {{ t("schedule.manageManualAssignment") }}
                      </v-btn>
                    </div>
                  </article>
                </div>
              </div>

              <!-- Danh sách bài Sắp đến hạn -->
              <div v-if="upcomingDisplayEvents.length" class="agenda-section upcoming-section">
                <div class="agenda-section-title">
                  <div class="upcoming-section-label">
                    <v-icon icon="mdi-clock-fast" size="15" color="warning" />
                    <span>{{ t("schedule.upcomingAssignmentsTitle") }}</span>
                  </div>
                  <v-chip size="x-small" color="warning" variant="tonal" class="font-weight-bold">
                    {{ upcomingDisplayEvents.length }}
                  </v-chip>
                </div>
                <div class="upcoming-events-list">
                  <div
                    v-for="item in upcomingDisplayEvents"
                    :key="item.id"
                    class="upcoming-event-item"
                    role="button"
                    tabindex="0"
                    :title="item.title"
                    @click="selectEventDateOnCalendar(item)"
                    @keydown.enter="selectEventDateOnCalendar(item)"
                  >
                    <div class="upcoming-item-left">
                      <span
                        class="class-color-dot"
                        :style="{ backgroundColor: classColor(item.classId || item.class?.id) }"
                      ></span>
                      <div class="upcoming-item-info">
                        <div class="upcoming-item-title">{{ item.title }}</div>
                        <div class="upcoming-item-meta">
                          <span class="upcoming-item-class">{{ item.class?.name || item.className }}</span>
                          <span class="upcoming-item-dot">·</span>
                          <span class="upcoming-item-deadline font-weight-bold">
                            {{ getRelativeDeadlineText(item.deadlineDate) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <v-icon icon="mdi-chevron-right" size="16" class="upcoming-item-arrow" />
                  </div>
                </div>
              </div>

              <!-- Trạng thái rỗng: Chỉ hiện khi cả ngày chọn không có bài VÀ không có bài sắp tới -->
              <div
                v-else-if="!selectedDayEvents.length"
                class="agenda-empty"
              >
                <v-icon icon="mdi-calendar-blank-outline" size="28" />
                <div>
                  <strong>{{ t("schedule.noDayEvents") }}</strong>
                  <span>{{ t("schedule.noUpcomingAssignments") }}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </v-container>
    </v-main>

    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      temporary
      :scrim="false"
      width="440"
      class="event-drawer"
    >
      <template v-if="selectedEvent">
        <div class="event-drawer-header">
          <div class="event-drawer-icon">
            <v-icon icon="mdi-calendar-alert" />
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('schedule.closeDetails')"
            @click="drawerOpen = false"
          />
        </div>
        <div class="event-drawer-body">
          <div class="schedule-eyebrow">
            {{
              t(
                selectedEvent.type === "manual"
                  ? "schedule.manualAssignmentTag"
                  : "schedule.quizAssignmentTag",
              )
            }}
          </div>
          <h2>{{ selectedEvent.title }}</h2>
          <div class="drawer-detail-line">
            <v-icon icon="mdi-account-group-outline" /><span>{{
              selectedEvent.class?.name || selectedEvent.className
            }}</span>
          </div>
          <div class="drawer-detail-line">
            <v-icon icon="mdi-calendar-clock-outline" /><span>{{
              formatLongDate(selectedEvent.deadlineDate)
            }}</span>
          </div>
          <div class="drawer-detail-line">
            <v-icon icon="mdi-progress-clock" /><span>{{
              t(`schedule.${selectedEvent.status}`)
            }}</span>
          </div>

          <template v-if="isTeacher">
            <v-divider class="my-5" />
            <div v-if="drawerLoading" class="drawer-loading">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-alert v-else-if="drawerError" type="error" variant="tonal">{{
              drawerError
            }}</v-alert>
            <template v-else>
              <div class="drawer-progress-heading">
                <h3>{{ t("schedule.submissionProgress") }}</h3>
                <strong
                  >{{ drawerDetails.submittedCount }}/{{
                    drawerDetails.students.length
                  }}</strong
                >
              </div>
              <v-progress-linear
                :model-value="drawerProgress"
                color="success"
                rounded
                height="8"
                class="my-3"
              />
              <div class="drawer-pending-heading">
                <h3>{{ t("schedule.notSubmitted") }}</h3>
                <v-chip size="x-small" color="warning" variant="tonal">{{
                  drawerDetails.pendingStudents.length
                }}</v-chip>
              </div>
              <div
                v-if="drawerDetails.pendingStudents.length"
                class="drawer-student-list"
              >
                <div
                  v-for="student in drawerDetails.pendingStudents"
                  :key="student.id"
                  class="drawer-student-row"
                >
                  <v-avatar
                    size="30"
                    color="blue-lighten-5"
                    class="text-primary"
                    >{{ student.fullName?.slice(0, 1) }}</v-avatar
                  >
                  <span>{{ student.fullName }}</span>
                </div>
              </div>
              <div v-else class="drawer-all-submitted">
                {{ t("schedule.everyoneSubmitted") }}
              </div>
              <v-btn
                block
                color="primary"
                rounded="pill"
                prepend-icon="mdi-bell-ring-outline"
                class="mt-5"
                :disabled="!drawerDetails.pendingStudents.length || reminding"
                :loading="reminding"
                @click="remindPendingStudents"
                >{{ t("schedule.remind") }}</v-btn
              >
            </template>
          </template>
          <template v-else>
            <v-divider class="my-5" />
            <v-alert
              :type="selectedEvent.status === 'submitted' ? 'success' : 'info'"
              variant="tonal"
            >
              {{
                selectedEvent.status === "submitted"
                  ? t("schedule.submitted")
                  : t("schedule.yourDeadline")
              }}
            </v-alert>
            <v-btn
              block
              color="primary"
              rounded="pill"
              class="mt-4"
              @click="openEvent(selectedEvent)"
            >
              {{
                t(
                  selectedEvent.type === "manual"
                    ? "schedule.openManualAssignment"
                    : "schedule.openAssignment",
                )
              }}
            </v-btn>
          </template>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Compact Drawer for Curriculum (< 1280px) -->
    <v-navigation-drawer
      v-if="isTeacher && isCompactLayout"
      v-model="curriculumMobileDrawer"
      location="bottom"
      temporary
      :disable-resize-watcher="true"
      width="320"
      class="compact-drawer curriculum-compact-drawer"
    >
        <div class="drawer-header pa-3 d-flex align-center justify-space-between border-b">
        <span class="text-subtitle-1 font-weight-bold">{{
          t("schedule.curriculumDrawerTitle")
        }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="curriculumMobileDrawer = false"
        />
      </div>
      <div class="pa-2">
        <v-text-field
          v-model="curriculumSearch"
          :label="t('schedule.searchCurriculum')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mb-2"
        />
        <div v-if="curriculumLoading" class="curriculum-state">
          <v-progress-circular indeterminate color="primary" size="24" />
          <span>{{ t("schedule.loadingCurriculum") }}</span>
        </div>
        <v-alert
          v-else-if="curriculumError"
          type="error"
          variant="tonal"
          density="compact"
          class="ma-2"
        >
          {{ curriculumError }}
        </v-alert>
        <div
          v-else-if="!filteredBooks.length"
          class="curriculum-state text-medium-emphasis"
        >
          {{
            curriculumSearch
              ? t("schedule.noCurriculumMatch")
              : t("schedule.noCurriculum")
          }}
        </div>
        <v-expansion-panels
          v-else
          v-model="expandedBooks"
          multiple
          variant="accordion"
          class="curriculum-tree"
        >
          <v-expansion-panel
            v-for="book in filteredBooks"
            :key="book.id"
            :value="book.id"
          >
            <v-expansion-panel-title>
              <v-icon
                icon="mdi-book-open-page-variant-outline"
                class="mr-2"
                color="primary"
              />
              <span class="curriculum-node-title">{{ book.title }}</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="book.loading" class="curriculum-state compact-state">
                <v-progress-circular indeterminate color="primary" size="18" />
              </div>
              <v-alert
                v-else-if="book.error"
                type="error"
                variant="tonal"
                density="compact"
              >
                {{ book.error }}
              </v-alert>
              <div v-else-if="book.chapters?.length" class="chapter-list">
                <section
                  v-for="chapter in filteredChapters(book)"
                  :key="chapter.id"
                  class="curriculum-chapter"
                >
                  <button
                    type="button"
                    class="chapter-toggle"
                    :aria-expanded="expandedChapters.includes(chapterKey(book, chapter))"
                    @click.stop="toggleChapter(book, chapter)"
                  >
                    <v-icon
                      :icon="
                        expandedChapters.includes(chapterKey(book, chapter))
                          ? 'mdi-chevron-down'
                          : 'mdi-chevron-right'
                      "
                      size="18"
                    />
                    <v-icon icon="mdi-folder-outline" size="17" />
                    <span class="curriculum-node-title">{{
                      chapter.title
                    }}</span>
                    <v-chip size="x-small" variant="tonal">{{
                      filteredLessons(chapter).length
                    }}</v-chip>
                  </button>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    class="ml-2 my-1"
                    :aria-label="
                      t('schedule.assignChapter', { title: chapter.title })
                    "
                    @click="
                      openCurriculumComposer(
                        { type: 'chapter', book, chapter },
                        selectedDay?.date && !isPastDay(selectedDay.date)
                          ? selectedDay.date
                          : new Date(),
                      );
                      curriculumMobileDrawer = false;
                    "
                    >{{ t("schedule.assign") }}</v-btn
                  >
                  <div
                    v-if="expandedChapters.includes(chapterKey(book, chapter))"
                    class="lesson-list"
                  >
                    <div
                      v-for="lesson in filteredLessons(chapter)"
                      :key="lesson.id"
                      class="curriculum-lesson"
                    >
                      <v-icon
                        icon="mdi-book-open-blank-variant-outline"
                        size="16"
                      />
                      <span class="curriculum-node-title">{{
                        lesson.title
                      }}</span>
                      <v-btn
                        icon="mdi-calendar-plus-outline"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        :aria-label="
                          t('schedule.assignLesson', { title: lesson.title })
                        "
                        @click.stop="
                          openCurriculumComposer(
                            { type: 'lesson', book, chapter, lesson },
                            selectedDay?.date && !isPastDay(selectedDay.date)
                              ? selectedDay.date
                              : new Date(),
                          );
                          curriculumMobileDrawer = false;
                        "
                      />
                    </div>
                  </div>
                </section>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-navigation-drawer>

    <!-- Compact Drawer for Day Detail (< 1280px) -->
    <v-navigation-drawer
      v-if="isTeacher && isCompactLayout"
      v-model="dayDetailMobileDrawer"
      location="bottom"
      temporary
      :disable-resize-watcher="true"
      width="340"
      class="compact-drawer day-detail-compact-drawer"
    >
      <div
        class="drawer-header pa-3 d-flex align-center justify-space-between border-b"
      >
        <div>
          <div class="agenda-eyebrow">{{ selectedDay?.weekday }}</div>
          <h3 class="text-subtitle-1 font-weight-bold">
            {{ selectedDay?.shortDate || selectedDay?.longDate }}
          </h3>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="selectedDay && !isPastDay(selectedDay.date)"
            icon="mdi-plus"
            variant="text"
            size="small"
            :aria-label="t('schedule.quickCreateTitle')"
            @click="openQuickCreate(selectedDay); dayDetailMobileDrawer = false"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :aria-label="t('schedule.closeDetails')"
            @click="dayDetailMobileDrawer = false"
          />
        </div>
      </div>
      <div class="pa-3">
        <div v-if="selectedDayEvents.length" class="agenda-section mb-3">
          <div class="agenda-section-title">
            <span>{{ t("schedule.dayAssignmentsTitle") }}</span>
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
              {{ selectedDayEvents.length }}
            </v-chip>
          </div>
          <div class="agenda-events">
            <article
              v-for="event in selectedDayEvents"
              :key="event.id"
              class="agenda-event"
              :class="`agenda-event-${event.status}`"
              :style="eventClassStyle(event)"
              role="button"
              tabindex="0"
              @click="openEventDrawer(event)"
            >
              <div class="agenda-event-top">
                <div class="agenda-event-time">
                  <v-icon icon="mdi-clock-outline" size="14" />
                  <span>{{ formatTime(event.deadline) }}</span>
                </div>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="statusColor(event.status)"
                  class="font-weight-bold"
                >
                  {{ t(`schedule.${event.status}`) }}
                </v-chip>
              </div>
              <div class="agenda-event-main">
                <div class="agenda-event-title" :title="event.title">
                  {{ event.title }}
                </div>
                <div class="agenda-event-context">
                  <span v-if="event.class?.name" class="class-badge">
                    <span
                      class="class-color-dot"
                      :style="{ backgroundColor: classColor(event.classId || event.class?.id) }"
                    ></span>
                    {{ event.class.name }}
                  </span>
                  <v-chip
                    v-if="event.type === 'manual'"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    >{{ t("schedule.manualAssignmentTag") }}</v-chip
                  >
                </div>
              </div>
              <div class="agenda-event-actions">
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  rounded="pill"
                  class="text-none font-weight-bold w-100"
                  @click.stop="openEventDrawer(event)"
                >
                  {{ t("schedule.manageManualAssignment") }}
                </v-btn>
              </div>
            </article>
          </div>
        </div>

        <div v-if="upcomingDisplayEvents.length" class="agenda-section upcoming-section">
          <div class="agenda-section-title">
            <div class="d-flex align-center gap-1">
              <v-icon icon="mdi-clock-fast" size="15" color="warning" />
              <span>{{ t("schedule.upcomingAssignmentsTitle") }}</span>
            </div>
            <v-chip size="x-small" color="warning" variant="tonal" class="font-weight-bold">
              {{ upcomingDisplayEvents.length }}
            </v-chip>
          </div>
          <div class="upcoming-events-list">
            <div
              v-for="item in upcomingDisplayEvents"
              :key="item.id"
              class="upcoming-event-item"
              role="button"
              tabindex="0"
              :title="item.title"
              @click="selectEventDateOnCalendar(item); dayDetailMobileDrawer = false"
            >
              <div class="upcoming-item-left">
                <span
                  class="class-color-dot"
                  :style="{ backgroundColor: classColor(item.classId || item.class?.id) }"
                ></span>
                <div class="upcoming-item-info">
                  <div class="upcoming-item-title">{{ item.title }}</div>
                  <div class="upcoming-item-meta">
                    <span class="upcoming-item-class">{{ item.class?.name || item.className }}</span>
                    <span class="upcoming-item-dot">·</span>
                    <span class="upcoming-item-deadline font-weight-bold">
                      {{ getRelativeDeadlineText(item.deadlineDate) }}
                    </span>
                  </div>
                </div>
              </div>
              <v-icon icon="mdi-chevron-right" size="16" class="upcoming-item-arrow" />
            </div>
          </div>
        </div>

        <div v-else-if="!selectedDayEvents.length" class="agenda-empty">
          <v-icon icon="mdi-calendar-blank-outline" size="28" />
          <div>
            <strong>{{ t("schedule.noDayEvents") }}</strong>
            <span>{{ t("schedule.noUpcomingAssignments") }}</span>
          </div>
        </div>
      </div>
    </v-navigation-drawer>

    <v-dialog v-model="quickCreateDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-black">{{
          t("schedule.quickCreateTitle")
        }}</v-card-title>
        <v-card-text>
          <v-alert
            v-if="quickCreateError"
            type="error"
            variant="tonal"
            class="mb-4"
            >{{ quickCreateError }}</v-alert
          >
          <v-select
            v-model="quickCreateForm.classId"
            :items="calendarClasses"
            item-title="name"
            item-value="id"
            :label="t('schedule.class')"
            variant="outlined"
          />
          <v-text-field
            v-model="quickCreateForm.title"
            :label="t('schedule.assignmentTitle')"
            variant="outlined"
            autofocus
          />
          <v-text-field
            v-model="quickCreateForm.deadline"
            type="datetime-local"
            :label="t('schedule.deadline')"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="quickCreateDialog = false">{{
            t("schedule.cancel")
          }}</v-btn>
          <v-btn
            color="primary"
            rounded="pill"
            prepend-icon="mdi-plus"
            :loading="quickCreating"
            :disabled="
              !quickCreateForm.classId || !quickCreateForm.title.trim()
            "
            @click="createQuickAssignment"
            >{{ t("schedule.createAssignment") }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="curriculumDialog"
      max-width="560"
      :fullscreen="isMobile"
      scrollable
    >
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-black">
          {{
            curriculumSelection?.type === "chapter"
              ? t("schedule.assignChapterTitle")
              : t("schedule.assignLessonTitle")
          }}
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="curriculumDialogError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ curriculumDialogError }}
          </v-alert>
          <div v-if="curriculumSelection" class="curriculum-dialog-source mb-4">
            <v-icon
              :icon="
                curriculumSelection.type === 'chapter'
                  ? 'mdi-folder-outline'
                  : 'mdi-book-open-blank-variant-outline'
              "
              color="primary"
            />
            <div>
              <strong>{{
                curriculumSelection.type === "chapter"
                  ? curriculumSelection.chapter.title
                  : curriculumSelection.lesson.title
              }}</strong>
              <span>{{ curriculumSelection.book.title }}</span>
            </div>
          </div>
          <v-select
            v-model="curriculumForm.classId"
            :items="calendarClasses"
            item-title="name"
            item-value="id"
            :label="t('schedule.class')"
            variant="outlined"
            :disabled="curriculumSubmitting"
          />
          <v-text-field
            v-model="curriculumForm.deadline"
            type="datetime-local"
            :label="t('schedule.deadline')"
            variant="outlined"
            :min="minimumDeadline"
            :disabled="curriculumSubmitting"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model.number="curriculumForm.durationMinutes"
                type="number"
                min="1"
                max="300"
                :label="t('schedule.durationMinutes')"
                variant="outlined"
                :disabled="curriculumSubmitting"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="curriculumForm.maxAttempts"
                type="number"
                min="0"
                :label="t('schedule.maxAttempts')"
                variant="outlined"
                :disabled="curriculumSubmitting"
              />
            </v-col>
          </v-row>
          <template v-if="curriculumSelection?.type === 'chapter'">
            <v-text-field
              v-model.number="curriculumForm.intervalDays"
              type="number"
              min="1"
              max="30"
              :label="t('schedule.intervalDays')"
              variant="outlined"
              :disabled="curriculumSubmitting"
            />
            <v-checkbox
              v-model="curriculumForm.skipWeekends"
              :label="t('schedule.skipWeekends')"
              color="primary"
              hide-details
              :disabled="curriculumSubmitting"
            />
            <div class="text-caption text-medium-emphasis mt-2">
              {{
                t("schedule.chapterLessonCount", { count: chapterLessonCount })
              }}
            </div>
          </template>
          <v-progress-linear
            v-if="curriculumSubmitting"
            indeterminate
            color="primary"
            rounded
            class="mt-3"
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="curriculumSubmitting"
            @click="curriculumDialog = false"
            >{{ t("schedule.cancel") }}</v-btn
          >
          <v-btn
            color="primary"
            rounded="pill"
            prepend-icon="mdi-send-outline"
            :loading="curriculumSubmitting"
            :disabled="
              !curriculumForm.classId ||
              !curriculumForm.deadline ||
              !curriculumSelection ||
              curriculumSubmitting
            "
            @click="createCurriculumAssignments"
            >{{
              curriculumSelection?.type === "chapter"
                ? t("schedule.assignAllLessons")
                : t("schedule.createAssignment")
            }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="calendarToast.show"
      :color="calendarToast.color"
      timeout="6500"
      location="top end"
      @update:model-value="
        (show) => {
          if (!show) undoMove = null;
        }
      "
    >
      {{ calendarToast.message }}
      <template #actions>
        <v-btn v-if="undoMove" variant="text" @click="undoLastMove">{{
          t("schedule.undo")
        }}</v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          :aria-label="t('schedule.closeDetails')"
          @click="calendarToast.show = false"
        />
      </template>
    </v-snackbar>
  </v-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../services/api";

const { t, locale } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const isStudent = computed(() => authStore.user?.role === "STUDENT");
const isTeacher = computed(() =>
  ["TEACHER", "ADMIN"].includes(authStore.user?.role),
);
const assignments = ref([]);
const manualAssignments = ref([]);
const calendarClasses = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const monthOffset = ref(0);
const selectedDayKey = ref("");
const preserveSelectedOnMonthChange = ref(false);
const selectedClassId = ref(null);
const drawerOpen = ref(false);
const selectedEvent = ref(null);
const drawerLoading = ref(false);
const drawerError = ref("");
const drawerDetails = ref({
  students: [],
  submittedCount: 0,
  pendingStudents: [],
});
const reminding = ref(false);
const quickCreateDialog = ref(false);
const quickCreating = ref(false);
const quickCreateError = ref("");
const quickCreateForm = reactive({ classId: null, title: "", deadline: "" });
const draggedEvent = ref(null);
const dropTargetKey = ref("");
const undoMove = ref(null);
const calendarToast = reactive({ show: false, message: "", color: "success" });
const curriculumSidebarOpen = ref(true);
const curriculumLoading = ref(false);
const curriculumError = ref("");
const curriculumBooks = ref([]);
const curriculumSearch = ref("");
const expandedBooks = ref(null);
const expandedChapters = ref([]);
const draggedCurriculum = ref(null);
const keyboardLesson = ref(null);
const curriculumDialog = ref(false);
const curriculumSelection = ref(null);
const curriculumSubmitting = ref(false);
const curriculumDialogError = ref("");
const curriculumForm = reactive({
  classId: null,
  deadline: "",
  durationMinutes: 30,
  maxAttempts: 1,
  intervalDays: 1,
  skipWeekends: true,
});
const isMobile = ref(false);
const isCompactLayout = ref(false);
const curriculumMobileDrawer = ref(false);
const dayDetailMobileDrawer = ref(false);
const dayDetailExpanded = ref(false);
const classPalette = [
  "#3478f6",
  "#12a889",
  "#8b5cf6",
  "#e49720",
  "#ec5c75",
  "#0e9fbb",
  "#67833a",
  "#d15ab3",
];

const minimumDeadline = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
});
const chapterLessonCount = computed(
  () => curriculumSelection.value?.chapter?.lessons?.length || 0,
);
const filteredBooks = computed(() => {
  const query = String(curriculumSearch.value || "").trim().toLocaleLowerCase();
  if (!query) return curriculumBooks.value;
  return curriculumBooks.value.filter((book) => {
    const bookTitle = String(book?.title || "").toLocaleLowerCase();
    if (bookTitle.includes(query)) return true;
    return (book?.chapters || []).some((chapter) => {
      const chapterTitle = String(chapter?.title || "").toLocaleLowerCase();
      if (chapterTitle.includes(query)) return true;
      return (chapter?.lessons || []).some((lesson) =>
        String(lesson?.title || "").toLocaleLowerCase().includes(query),
      );
    });
  });
});

function filteredChapters(book) {
  const query = String(curriculumSearch.value || "").trim().toLocaleLowerCase();
  const chapters = Array.isArray(book?.chapters) ? book.chapters : [];
  if (!query) return chapters;
  return chapters.filter((chapter) => {
    const chapterTitle = String(chapter?.title || "").toLocaleLowerCase();
    if (chapterTitle.includes(query)) return true;
    return (chapter?.lessons || []).some((lesson) =>
      String(lesson?.title || "").toLocaleLowerCase().includes(query),
    );
  });
}

function filteredLessons(chapter) {
  const query = String(curriculumSearch.value || "").trim().toLocaleLowerCase();
  const lessons = Array.isArray(chapter?.lessons) ? chapter.lessons : [];
  if (!query || String(chapter?.title || "").toLocaleLowerCase().includes(query))
    return lessons;
  return lessons.filter((lesson) =>
    String(lesson?.title || "").toLocaleLowerCase().includes(query),
  );
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getMonday(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

const monthDate = computed(() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1);
});

const monthTitle = computed(() =>
  new Intl.DateTimeFormat(locale.value === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(monthDate.value),
);
const teacherMonthTitle = computed(() =>
  t("schedule.teacherMonthTitle", {
    month: String(monthDate.value.getMonth() + 1).padStart(2, "0"),
    year: monthDate.value.getFullYear(),
  }),
);

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getEventStatus(assignment, deadline) {
  if (isStudent.value) {
    if (assignment.type === "manual") {
      if (assignment.submissions?.some((submission) => submission.submittedAt))
        return "submitted";
      return deadline < new Date() ? "overdue" : "upcoming";
    }
    const attempts = assignment.myAttempts || [];
    if (attempts.some((attempt) => attempt.submittedAt)) return "submitted";
    if (attempts.some((attempt) => attempt.startedAt && !attempt.submittedAt))
      return "inProgress";
  }
  return deadline < new Date() ? "overdue" : "upcoming";
}

const allEvents = computed(() =>
  [
    ...assignments.value,
    ...manualAssignments.value.map((assignment) => ({
      ...assignment,
      type: "manual",
      id: `manual-${assignment.id}`,
      manualAssignmentId: assignment.id,
    })),
  ]
    .filter((assignment) => assignment.deadline)
    .map((assignment) => {
      const deadline = new Date(assignment.deadline);
      return {
        ...assignment,
        deadlineDate: deadline,
        status: getEventStatus(assignment, deadline),
      };
    })
    .filter((assignment) => !Number.isNaN(assignment.deadlineDate.getTime()))
    .sort((a, b) => a.deadlineDate - b.deadlineDate),
);

const visibleEvents = computed(() =>
  allEvents.value.filter(
    (event) =>
      selectedClassId.value === null ||
      Number(event.classId || event.class?.id) ===
        Number(selectedClassId.value),
  ),
);

const monthEvents = computed(() =>
  visibleEvents.value.filter(
    (event) =>
      event.deadlineDate.getFullYear() === monthDate.value.getFullYear() &&
      event.deadlineDate.getMonth() === monthDate.value.getMonth(),
  ),
);

const pendingCount = computed(
  () =>
    monthEvents.value.filter((event) =>
      isStudent.value
        ? event.status !== "submitted"
        : event.status !== "overdue",
    ).length,
);
const upcomingSevenDaysCount = computed(() => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return visibleEvents.value.filter(
    (event) => event.deadlineDate >= now && event.deadlineDate < end,
  ).length;
});
// The existing teacher assignment list has a submitted-attempt count, not a distinct
// submitted-student count, so it cannot reliably identify overdue assignments with pending students.
const overdueIncompleteCount = null;
const drawerProgress = computed(() =>
  drawerDetails.value.students.length
    ? Math.round(
        (drawerDetails.value.submittedCount * 100) /
          drawerDetails.value.students.length,
      )
    : 0,
);

const weekdayNames = computed(() => {
  const dateLocale = locale.value === "vi" ? "vi-VN" : "en-US";
  const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(2024, 0, index + 1)),
  );
});

const calendarDays = computed(() => {
  const today = dateKey(new Date());
  const dateLocale = locale.value === "vi" ? "vi-VN" : "en-US";
  const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
  });
  const shortDateFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  });
  const longDateFormatter = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstOfMonth = new Date(monthDate.value);
  const gridStart = getMonday(firstOfMonth);
  const lastOfMonth = new Date(
    monthDate.value.getFullYear(),
    monthDate.value.getMonth() + 1,
    0,
  );
  const gridEnd = getMonday(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + 6);

  const dates = [];
  for (
    const date = new Date(gridStart);
    date <= gridEnd;
    date.setDate(date.getDate() + 1)
  ) {
    const key = dateKey(date);
    dates.push({
      key,
      date: new Date(date),
      weekday: weekdayFormatter.format(date),
      dayNumber: date.getDate(),
      longDate: longDateFormatter.format(date),
      shortDate: shortDateFormatter.format(date),
      isToday: key === today,
      isCurrentMonth: date.getMonth() === monthDate.value.getMonth(),
      events: visibleEvents.value
        .filter((event) => dateKey(event.deadlineDate) === key)
        .map((event) => ({ ...event, deadline: event.deadlineDate })),
    });
  }
  return dates;
});

const selectedDay = computed(
  () =>
    calendarDays.value.find((day) => day.key === selectedDayKey.value) ||
    calendarDays.value[0],
);
const selectedDayEvents = computed(() => selectedDay.value?.events || []);

const upcomingEvents = computed(() => {
  const now = new Date();
  return visibleEvents.value
    .filter((event) => event.deadlineDate >= now)
    .sort((a, b) => a.deadlineDate - b.deadlineDate);
});

const upcomingDisplayEvents = computed(() => {
  const selectedIds = new Set(selectedDayEvents.value.map((e) => e.id));
  return upcomingEvents.value.filter((e) => !selectedIds.has(e.id)).slice(0, 8);
});

function getRelativeDeadlineText(date) {
  if (!date) return "";
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return t("schedule.relativeDuePast");

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const diffDays = Math.round(
    (targetDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const timeStr = formatTime(target);

  if (diffDays === 0) {
    return t("schedule.relativeDueToday", { time: timeStr });
  }
  if (diffDays === 1) {
    return t("schedule.relativeDueTomorrow", { time: timeStr });
  }
  if (diffDays < 7) {
    return t("schedule.relativeDueDays", { days: diffDays });
  }
  return `${target.getDate()}/${target.getMonth() + 1} · ${timeStr}`;
}

function selectEventDateOnCalendar(event) {
  if (!event?.deadlineDate) return;
  const targetDate = new Date(event.deadlineDate);
  const key = dateKey(targetDate);
  const targetDay = calendarDays.value.find((d) => d.key === key);
  if (targetDay) {
    selectCalendarDay(targetDay);
  } else {
    const targetMonthDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const nowMonthDate = new Date(
      monthDate.value.getFullYear(),
      monthDate.value.getMonth(),
      1,
    );
    const diff =
      (targetMonthDate.getFullYear() - nowMonthDate.getFullYear()) * 12 +
      (targetMonthDate.getMonth() - nowMonthDate.getMonth());
    preserveSelectedOnMonthChange.value = true;
    monthOffset.value += diff;
    selectedDayKey.value = key;
  }
}

watch(
  [monthOffset, monthEvents],
  () => {
    if (
      preserveSelectedOnMonthChange.value &&
      calendarDays.value.some((day) => day.key === selectedDayKey.value)
    ) {
      preserveSelectedOnMonthChange.value = false;
      return;
    }

    const todayKey = dateKey(new Date());
    const todayInMonth = calendarDays.value.find((day) => day.key === todayKey);
    if (monthOffset.value === 0 && todayInMonth?.events.length) {
      selectedDayKey.value = todayKey;
      return;
    }

    const todayStart = startOfDay(new Date());
    const nearestEvent =
      monthEvents.value.find((event) => event.deadlineDate >= todayStart) ||
      monthEvents.value[0];
    selectedDayKey.value = nearestEvent
      ? dateKey(nearestEvent.deadlineDate)
      : todayInMonth?.key || dateKey(monthDate.value);
  },
  { immediate: true },
);

function selectCalendarDay(day) {
  selectedDayKey.value = day.key;
  if (day.isCurrentMonth) return;

  const monthDifference =
    (day.date.getFullYear() - monthDate.value.getFullYear()) * 12 +
    day.date.getMonth() -
    monthDate.value.getMonth();
  preserveSelectedOnMonthChange.value = true;
  monthOffset.value += monthDifference;
}

function goToCurrentMonth() {
  monthOffset.value = 0;
  selectedDayKey.value = dateKey(new Date());
}

function formatTime(date) {
  return date.toLocaleTimeString(locale.value === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLongDate(date) {
  const formatted = new Intl.DateTimeFormat(
    locale.value === "vi" ? "vi-VN" : "en-US",
    { dateStyle: "full", timeStyle: "short" },
  ).format(date);
  return locale.value === "vi" ? formatted.replace(/^lúc/, "Lúc") : formatted;
}

function statusColor(status) {
  return {
    submitted: "success",
    inProgress: "primary",
    overdue: "error",
    upcoming: "warning",
  }[status];
}

function classColor(classId) {
  const index = calendarClasses.value.findIndex(
    (schoolClass) => schoolClass.id === classId,
  );
  const paletteIndex = index < 0 ? Number(classId) : index;
  return classPalette[
    (Number.isFinite(paletteIndex) ? paletteIndex : 0) % classPalette.length
  ];
}

function eventClassStyle(event) {
  const eventClassId = Number(event.classId || event.class?.id);
  return {
    "--class-accent": classColor(eventClassId),
    opacity:
      selectedClassId.value !== null && selectedClassId.value !== eventClassId
        ? 0.28
        : 1,
  };
}

function toggleClassFilter(classId) {
  selectedClassId.value = selectedClassId.value === classId ? null : classId;
}

function isPastDay(date) {
  return startOfDay(date) < startOfDay(new Date());
}

function selectKeyboardLesson(lesson, chapter, book) {
  if (isMobile.value) return;
  keyboardLesson.value = {
    type: "lesson",
    lesson,
    chapter,
    book,
    id: lesson.id,
  };
  const targetDay =
    selectedDay.value && !isPastDay(selectedDay.value.date)
      ? selectedDay.value
      : calendarDays.value.find((day) => !isPastDay(day.date));
  if (targetDay) {
    selectedDayKey.value = targetDay.key;
    requestAnimationFrame(() =>
      document.querySelector(`[data-calendar-day="${targetDay.key}"]`)?.focus(),
    );
  }
}

function handleCalendarKeydown(day) {
  selectCalendarDay(day);
  if (keyboardLesson.value) {
    if (isTeacher.value && isPastDay(day.date)) return;
    const selected = keyboardLesson.value;
    keyboardLesson.value = null;
    openCurriculumComposer(selected, day.date);
    return;
  }
  openDayDetailForSelection();
}

function chapterKey(book, chapter) {
  return `${book.id}:${chapter.id}`;
}

function toggleChapter(book, chapter) {
  const key = chapterKey(book, chapter);
  expandedChapters.value = expandedChapters.value.includes(key)
    ? []
    : [key];
}

function startCurriculumDrag(event, selection) {
  if (isMobile.value) {
    event.preventDefault();
    return;
  }
  // The chapter row itself is draggable for assignment, but clicking its
  // expand button must never start a drag (which fades the whole row).
  if (event.target.closest("button, .v-btn")) {
    event.preventDefault();
    return;
  }
  draggedCurriculum.value = {
    ...selection,
    id:
      selection.type === "lesson" ? selection.lesson.id : selection.chapter.id,
  };
  keyboardLesson.value = null;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(
    "application/x-duckbear-curriculum",
    JSON.stringify({
      type: selection.type,
      bookId: selection.book.id,
      chapterId: selection.chapter.id,
      lessonId: selection.lesson?.id,
    }),
  );
  event.dataTransfer.setData(
    "text/plain",
    selection.type === "lesson"
      ? selection.lesson.title
      : selection.chapter.title,
  );
}

function openCurriculumComposer(selection, date) {
  if (!selection || !date || isPastDay(date)) return;
  curriculumSelection.value = selection;
  curriculumDialogError.value = "";
  curriculumForm.classId =
    calendarClasses.value.length === 1
      ? calendarClasses.value[0].id
      : selectedClassId.value;
  curriculumForm.deadline = `${dateKey(date)}T23:59`;
  curriculumForm.durationMinutes = 30;
  curriculumForm.maxAttempts = 1;
  curriculumForm.intervalDays = 1;
  curriculumForm.skipWeekends = true;
  curriculumDialog.value = true;
}

function scheduleChapterDates(date, count) {
  const dates = [];
  let cursor = new Date(date);
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      cursor = new Date(cursor);
      cursor.setDate(
        cursor.getDate() + Number(curriculumForm.intervalDays || 1),
      );
      if (curriculumForm.skipWeekends) {
        while (cursor.getDay() === 0 || cursor.getDay() === 6)
          cursor.setDate(cursor.getDate() + 1);
      }
    }
    dates.push(new Date(cursor));
  }
  return dates;
}

async function createCurriculumAssignments() {
  const selection = curriculumSelection.value;
  if (
    !selection ||
    !curriculumForm.classId ||
    !curriculumForm.deadline ||
    curriculumSubmitting.value
  )
    return;
  const lessons =
    selection.type === "lesson"
      ? [selection.lesson]
      : selection.chapter.lessons || [];
  if (!lessons.length) {
    curriculumDialogError.value = t("schedule.noLessonsInChapter");
    return;
  }
  const firstDeadline = new Date(curriculumForm.deadline);
  if (Number.isNaN(firstDeadline.getTime()) || firstDeadline <= new Date()) {
    curriculumDialogError.value = t("schedule.deadlineMustBeFuture");
    return;
  }
  const duration = Number(curriculumForm.durationMinutes);
  const attempts = Number(curriculumForm.maxAttempts);
  const interval = Number(curriculumForm.intervalDays);
  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 300 ||
    !Number.isInteger(attempts) ||
    attempts < 0 ||
    (selection.type === "chapter" &&
      (!Number.isInteger(interval) || interval < 1 || interval > 30))
  ) {
    curriculumDialogError.value = t("schedule.invalidAssignmentSettings");
    return;
  }

  curriculumSubmitting.value = true;
  curriculumDialogError.value = "";
  try {
    const questionsByLesson = new Map();
    for (const lesson of lessons) {
      const questions = await api(`/lessons/${lesson.id}/questions`);
      if (!Array.isArray(questions) || !questions.length) {
        throw new Error(
          t("schedule.lessonHasNoQuestions", { title: lesson.title }),
        );
      }
      questionsByLesson.set(
        lesson.id,
        questions.map((question) => question.id),
      );
    }

    const dates =
      selection.type === "chapter"
        ? scheduleChapterDates(firstDeadline, lessons.length)
        : [firstDeadline];
    const schoolClass = calendarClasses.value.find(
      (item) => item.id === curriculumForm.classId,
    );
    const created = [];
    const failures = [];
    for (let index = 0; index < lessons.length; index += 1) {
      const lesson = lessons[index];
      const deadline = new Date(dates[index]);
      if (selection.type === "chapter") {
        deadline.setHours(
          firstDeadline.getHours(),
          firstDeadline.getMinutes(),
          0,
          0,
        );
      }
      try {
        const assignment = await api("/assignments", {
          method: "POST",
          body: {
            title: lesson.title,
            scope: "LESSON",
            classId: Number(curriculumForm.classId),
            lessonId: lesson.id,
            bookId: selection.book.id,
            questionIds: questionsByLesson.get(lesson.id),
            deadline: deadline.toISOString(),
            durationMinutes:
              Number(curriculumForm.durationMinutes) || undefined,
            maxAttempts: Number(curriculumForm.maxAttempts) || 0,
          },
        });
        created.push({
          ...assignment,
          class: assignment.class || {
            id: schoolClass?.id,
            name: schoolClass?.name,
          },
        });
      } catch (error) {
        failures.push({ title: lesson.title, message: error?.message });
      }
    }
    assignments.value.push(...created);
    curriculumDialog.value = false;
    if (failures.length) {
      showCalendarToast(
        created.length
          ? t("schedule.chapterPartialFailure", {
              created: created.length,
              failed: failures.length,
            })
          : failures[0].message || t("schedule.curriculumAssignError"),
        "warning",
      );
    } else {
      showCalendarToast(
        t(
          selection.type === "chapter"
            ? "schedule.chapterAssignmentsCreated"
            : "schedule.lessonAssignmentCreated",
          { count: created.length },
        ),
      );
    }
  } catch (error) {
    curriculumDialogError.value =
      error?.message || t("schedule.curriculumAssignError");
  } finally {
    curriculumSubmitting.value = false;
  }
}

function handleDayClick(day, mouseEvent) {
  selectCalendarDay(day);
  if (isTeacher.value && keyboardLesson.value) {
    if (isPastDay(day.date)) return;
    const selection = keyboardLesson.value;
    keyboardLesson.value = null;
    openCurriculumComposer(selection, day.date);
    return;
  }
  if (!isTeacher.value || mouseEvent.target.closest(".month-event-pill"))
    return;
  openDayDetailForSelection();
}

function openDayDetailForSelection() {
  if (!isTeacher.value) return;
  if (isCompactLayout.value) dayDetailMobileDrawer.value = true;
  else dayDetailExpanded.value = true;
}

function openQuickCreate(day) {
  quickCreateError.value = "";
  quickCreateForm.classId =
    calendarClasses.value.length === 1
      ? calendarClasses.value[0].id
      : selectedClassId.value;
  quickCreateForm.title = "";
  quickCreateForm.deadline = `${dateKey(day.date)}T23:59`;
  quickCreateDialog.value = true;
}

async function createQuickAssignment() {
  if (
    !quickCreateForm.classId ||
    !quickCreateForm.title.trim() ||
    quickCreating.value
  )
    return;
  quickCreating.value = true;
  quickCreateError.value = "";
  try {
    const schoolClass = calendarClasses.value.find(
      (item) => item.id === quickCreateForm.classId,
    );
    const assignment = await api(
      `/classes/${quickCreateForm.classId}/manual-assignments`,
      {
        method: "POST",
        body: {
          title: quickCreateForm.title.trim(),
          deadline: new Date(quickCreateForm.deadline).toISOString(),
        },
      },
    );
    manualAssignments.value.push({
      ...assignment,
      class: { id: schoolClass.id, name: schoolClass.name },
    });
    quickCreateDialog.value = false;
    showCalendarToast(t("schedule.quickCreateSuccess"));
  } catch (error) {
    quickCreateError.value = error?.message || t("schedule.quickCreateError");
  } finally {
    quickCreating.value = false;
  }
}

function openEventDrawer(event) {
  selectedEvent.value = event;
  drawerOpen.value = true;
  drawerError.value = "";
  drawerDetails.value = {
    students: [],
    submittedCount: 0,
    pendingStudents: [],
  };
  if (isTeacher.value) void loadEventDetails(event);
}

async function loadEventDetails(event) {
  drawerLoading.value = true;
  drawerError.value = "";
  try {
    let students;
    let submittedIds;
    if (event.type === "manual") {
      const [assignment, schoolClass] = await Promise.all([
        api(`/classes/manual-assignments/${event.manualAssignmentId}`),
        api(`/classes/${event.classId || event.class?.id}`),
      ]);
      students = schoolClass.students || [];
      submittedIds = new Set(
        (assignment.submissions || []).map(
          (submission) => submission.studentId,
        ),
      );
    } else {
      const activity = await api(
        `/classes/${event.classId || event.class?.id}/assignments/${event.id}/activity`,
      );
      students = activity.students || [];
      submittedIds = new Set(
        students
          .filter((student) =>
            student.attempts?.some((attempt) => attempt.submittedAt),
          )
          .map((student) => student.id),
      );
    }
    const pendingStudents = students.filter(
      (student) => !submittedIds.has(student.id),
    );
    drawerDetails.value = {
      students,
      submittedCount: students.length - pendingStudents.length,
      pendingStudents,
    };
  } catch (error) {
    drawerError.value = error?.message || t("schedule.detailsLoadError");
  } finally {
    drawerLoading.value = false;
  }
}

async function remindPendingStudents() {
  if (!selectedEvent.value || reminding.value) return;
  reminding.value = true;
  try {
    const event = selectedEvent.value;
    const result = await api(
      `/classes/${event.classId || event.class?.id}/assignment-reminders`,
      {
        method: "POST",
        body: {
          assignmentId:
            event.type === "manual" ? event.manualAssignmentId : event.id,
          type: event.type === "manual" ? "MANUAL" : "QUIZ",
        },
      },
    );
    showCalendarToast(
      t("schedule.reminderSent", {
        online: result.onlineCount,
        pending: result.pendingCount,
      }),
    );
  } catch (error) {
    showCalendarToast(error?.message || t("schedule.reminderError"), "error");
  } finally {
    reminding.value = false;
  }
}

function startDrag(event, assignment) {
  if (!isTeacher.value) return;
  draggedEvent.value = assignment;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(assignment.id));
}

async function dropEvent(drop, day) {
  dropTargetKey.value = "";
  if (!isTeacher.value) return;
  if (isPastDay(day.date)) return;
  const curriculumData = drop.dataTransfer.getData(
    "application/x-duckbear-curriculum",
  );
  if (curriculumData || draggedCurriculum.value) {
    try {
      const item = curriculumData
        ? JSON.parse(curriculumData)
        : draggedCurriculum.value;
      const book =
        item.book ||
        curriculumBooks.value.find((entry) => entry.id === item.bookId);
      const chapter =
        item.chapter ||
        book?.chapters?.find((entry) => entry.id === item.chapterId);
      const lesson =
        item.lesson ||
        chapter?.lessons?.find((entry) => entry.id === item.lessonId);
      if (book && chapter && (item.type === "chapter" || lesson))
        openCurriculumComposer(
          { type: item.type, book, chapter, lesson },
          day.date,
        );
    } catch {
      showCalendarToast(t("schedule.curriculumAssignError"), "error");
    }
    draggedCurriculum.value = null;
    return;
  }
  const eventId = drop.dataTransfer.getData("text/plain");
  const assignment =
    draggedEvent.value?.id === eventId
      ? draggedEvent.value
      : visibleEvents.value.find((item) => String(item.id) === eventId);
  draggedEvent.value = null;
  if (!assignment) return;
  const oldDeadline = new Date(assignment.deadlineDate);
  const nextDeadline = new Date(oldDeadline);
  nextDeadline.setFullYear(
    day.date.getFullYear(),
    day.date.getMonth(),
    day.date.getDate(),
  );
  if (dateKey(oldDeadline) === day.key) return;
  if (nextDeadline <= new Date()) {
    showCalendarToast(t("schedule.deadlineMustBeFuture"), "error");
    return;
  }

  try {
    const isoDeadline = nextDeadline.toISOString();
    if (assignment.type === "manual") {
      await api(
        `/classes/manual-assignments/${assignment.manualAssignmentId}`,
        { method: "PATCH", body: { deadline: isoDeadline } },
      );
    } else {
      await api(`/assignments/${assignment.id}/deadline`, {
        method: "PATCH",
        body: { deadline: isoDeadline },
      });
    }
    updateLocalDeadline(assignment, isoDeadline);
    undoMove.value = {
      id:
        assignment.type === "manual"
          ? assignment.manualAssignmentId
          : assignment.id,
      type: assignment.type,
      oldDeadline: oldDeadline.toISOString(),
      newDeadline: isoDeadline,
      className: assignment.class?.name || assignment.className || "",
    };
    showCalendarToast(
      t("schedule.deadlineMoved", {
        date: new Intl.DateTimeFormat(
          locale.value === "vi" ? "vi-VN" : "en-US",
          { day: "numeric", month: "numeric" },
        ).format(nextDeadline),
      }),
    );
  } catch (error) {
    showCalendarToast(error?.message || t("schedule.moveError"), "error");
  }
}

function updateLocalDeadline(event, deadline) {
  const source =
    event.type === "manual"
      ? manualAssignments.value.find(
          (item) => item.id === event.manualAssignmentId,
        )
      : assignments.value.find((item) => item.id === event.id);
  if (source) source.deadline = deadline;
  if (selectedEvent.value?.id === event.id) {
    selectedEvent.value.deadline = deadline;
    selectedEvent.value.deadlineDate = new Date(deadline);
  }
}

async function undoLastMove() {
  if (!undoMove.value) return;
  const move = undoMove.value;
  try {
    if (move.type === "manual") {
      await api(`/classes/manual-assignments/${move.id}`, {
        method: "PATCH",
        body: { deadline: move.oldDeadline },
      });
      const source = manualAssignments.value.find(
        (item) => item.id === move.id,
      );
      if (source) source.deadline = move.oldDeadline;
    } else {
      await api(`/assignments/${move.id}/deadline`, {
        method: "PATCH",
        body: { deadline: move.oldDeadline },
      });
      const source = assignments.value.find((item) => item.id === move.id);
      if (source) source.deadline = move.oldDeadline;
    }
    if (
      selectedEvent.value?.id ===
      (move.type === "manual" ? `manual-${move.id}` : move.id)
    ) {
      selectedEvent.value.deadline = move.oldDeadline;
      selectedEvent.value.deadlineDate = new Date(move.oldDeadline);
    }
    undoMove.value = null;
    showCalendarToast(t("schedule.deadlineUndo"));
  } catch (error) {
    showCalendarToast(error?.message || t("schedule.undoError"), "error");
  }
}

function showCalendarToast(message, color = "success") {
  calendarToast.message = message;
  calendarToast.color = color;
  calendarToast.show = true;
}

async function loadAssignments() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [quizResult, manualResult, classesResult] = await Promise.all([
      api("/assignments/mine"),
      api("/classes/manual-assignments/mine"),
      api("/classes/mine"),
    ]);
    assignments.value = Array.isArray(quizResult)
      ? quizResult.map((item) => ({ ...item, type: "quiz" }))
      : [];
    manualAssignments.value = Array.isArray(manualResult) ? manualResult : [];
    calendarClasses.value = classesResult.classes || [];
  } catch (error) {
    errorMessage.value = error?.message || t("schedule.loadError");
  } finally {
    loading.value = false;
  }
}

async function loadCurriculumBooks() {
  curriculumLoading.value = true;
  curriculumError.value = "";
  try {
    const books = await api("/books");
    const ownedBooks = (Array.isArray(books) ? books : []).filter(
      (book) =>
        authStore.user?.role === "ADMIN" ||
        Number(book.createdById) === Number(authStore.user?.id),
    );
    const trees = await Promise.all(
      ownedBooks.map(async (book) => {
        try {
          return {
            ...(await api(`/books/${book.id}`)),
            loading: false,
            error: "",
          };
        } catch (error) {
          return {
            ...book,
            chapters: [],
            loading: false,
            error: error?.message || t("schedule.curriculumLoadError"),
          };
        }
      }),
    );
    curriculumBooks.value = trees;
  } catch (error) {
    curriculumError.value = error?.message || t("schedule.curriculumLoadError");
  } finally {
    curriculumLoading.value = false;
  }
}

function syncMobileViewport() {
  isMobile.value = window.matchMedia("(max-width: 767px)").matches;
  isCompactLayout.value = window.matchMedia("(max-width: 1279px)").matches;
}

function openEvent(event) {
  if (event.type === "manual") {
    return router.push(
      `/classes/${event.classId}/manual-assignments?assignment=${event.manualAssignmentId}`,
    );
  }
  return router.push(
    isStudent.value ? `/assignments/${event.id}/do` : "/assignments",
  );
}

onMounted(() => {
  syncMobileViewport();
  window.addEventListener("resize", syncMobileViewport);
  void loadAssignments();
  if (isTeacher.value) void loadCurriculumBooks();
});

onUnmounted(() => window.removeEventListener("resize", syncMobileViewport));

watch(curriculumSearch, (query) => {
  if (!query?.trim()) {
    expandedBooks.value = null;
    expandedChapters.value = [];
    return;
  }

  expandedBooks.value = filteredBooks.value[0]?.id ?? null;
  expandedChapters.value = filteredBooks.value.flatMap((book) =>
    filteredChapters(book).slice(0, 1).map((chapter) => chapterKey(book, chapter)),
  );
});
</script>

<style scoped>
.schedule-page {
  background: #f4f8ff;
}

.schedule-container {
  max-width: 1120px;
}

.schedule-container.teacher-container {
  max-width: 1600px;
}

.teacher-calendar-toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 5px 12px;
  border: 1px solid #dfe8f5;
  border-radius: 12px;
  background: #fff;
}

.teacher-calendar-toolbar h1 {
  margin: 0;
  color: #172b4d;
  font-size: 1.05rem;
  font-weight: 850;
  white-space: nowrap;
}

.teacher-toolbar-classes {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.toolbar-filter-label {
  margin-right: 2px;
  color: #667085;
  font-size: 0.72rem;
  font-weight: 700;
}

.teacher-month-controls {
  justify-content: flex-end;
  gap: 2px;
  white-space: nowrap;
}
.teacher-today-button {
  margin-left: 4px;
}

.teacher-schedule-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.teacher-stat-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid #e1eaf7;
  border-radius: 10px;
  background: #fff;
}

.teacher-stat-card > div {
  display: grid;
  min-width: 0;
}
.teacher-stat-card span {
  overflow: hidden;
  color: #667085;
  font-size: 0.72rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.teacher-stat-card strong {
  color: #172b4d;
  font-size: 1.05rem;
  line-height: 1.15;
}
.teacher-stat-card small {
  color: #667085;
  font-size: 0.65rem;
}

.schedule-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 28px;
  border: 1px solid #dce9fb;
  border-radius: 24px;
  background: linear-gradient(120deg, #fff 0%, #edf5ff 100%);
}

.schedule-hero-icon {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d8e7ff;
  border-radius: 18px;
  background: #fff;
  color: #2f7cf6;
  box-shadow: 0 8px 20px rgba(47, 124, 246, 0.1);
}

.schedule-eyebrow {
  color: #2f7cf6;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.schedule-hero h1 {
  margin: 3px 0;
  color: #172b4d;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 900;
}

.schedule-hero p {
  margin: 0;
  color: #667085;
  font-size: 0.95rem;
}

.week-toolbar {
  border: 1px solid #e1eaf7;
  background: #fff;
}

.week-toolbar-main,
.schedule-stats,
.week-controls {
  display: flex;
  align-items: center;
}

.week-toolbar-main {
  justify-content: space-between;
  gap: 16px;
}

.week-date-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.week-date-label {
  color: #172b4d;
  font-size: 1.1rem;
  font-weight: 800;
}

.week-date-year {
  color: #8492a6;
  font-size: 0.9rem;
  font-weight: 700;
}

.week-controls {
  gap: 8px;
}

.schedule-stats {
  flex-wrap: wrap;
  gap: 22px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #edf2fa;
}

.schedule-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667085;
  font-size: 0.88rem;
}

.schedule-stat strong {
  color: #172b4d;
}

.schedule-empty {
  border: 1px dashed #cbdcf4;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
}

.schedule-empty h2 {
  color: #172b4d;
  font-size: 1.2rem;
  font-weight: 800;
}

.schedule-empty p {
  margin: 6px 0 0;
  color: #667085;
}

.schedule-workspace {
  display: block;
}

.teacher-workspace {
  display: grid;
  grid-template-columns: minmax(230px, 260px) minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.teacher-workspace.day-detail-expanded {
  grid-template-columns: minmax(230px, 260px) minmax(0, 1fr) minmax(280px, 310px);
}

.teacher-workspace.curriculum-collapsed {
  grid-template-columns: 50px minmax(0, 1fr);
}

.teacher-workspace.curriculum-collapsed.day-detail-expanded {
  grid-template-columns: 50px minmax(0, 1fr) minmax(280px, 310px);
}
.curriculum-collapsed .curriculum-heading {
  justify-content: center;
  padding: 8px 4px;
}
.curriculum-collapsed .curriculum-heading > div {
  display: none;
}

.curriculum-sidebar {
  position: sticky;
  top: 76px;
  height: fit-content;
  max-height: calc(100vh - 92px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dfe8f5;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(38, 78, 130, 0.05);
}

.day-detail-panel {
  position: sticky;
  top: 76px;
  height: fit-content;
  max-height: calc(100vh - 92px);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #dfe8f5;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(38, 78, 130, 0.05);
}

.day-detail-panel .agenda-heading {
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 8px;
  margin-bottom: 0;
  border-bottom: 1px solid #edf2fa;
}

.day-detail-heading-copy {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.day-detail-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0;
}

.day-detail-panel .agenda-eyebrow {
  overflow: hidden;
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-detail-panel .agenda-heading h2 {
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-detail-panel .agenda-content {
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px;
}

.curriculum-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  padding: 10px 12px 6px;
}

.curriculum-heading h2 {
  margin: 0;
  color: #172b4d;
  font-size: 0.9rem;
  font-weight: 850;
}

.curriculum-heading p {
  margin: 2px 0 0;
  color: #667085;
  font-size: 0.7rem;
  line-height: 1.35;
}

.curriculum-search {
  flex: 0 0 auto !important;
  padding: 0 10px 6px;
}

.curriculum-search :deep(.v-input__control) {
  min-height: 34px !important;
  height: 34px !important;
}

.curriculum-search :deep(.v-field) {
  min-height: 34px !important;
  height: 34px !important;
  font-size: 0.78rem;
}

.curriculum-tree {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  flex: 0 1 auto;
  min-height: 0;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 6px 8px;
}
.curriculum-tree :deep(.v-expansion-panel-title) {
  min-height: 34px !important;
  min-width: 0;
  flex: 0 0 auto;
  padding: 5px 14px 5px 7px;
}
.curriculum-tree :deep(.v-expansion-panel) {
  flex: 0 0 auto !important;
  min-width: 0;
  width: 100%;
}
.curriculum-tree :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 9px 6px 4px;
}
.curriculum-node-title {
  min-width: 0;
  overflow: hidden;
  flex: 1;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.curriculum-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 88px;
  padding: 14px;
  font-size: 0.82rem;
  text-align: center;
}
.compact-state {
  min-height: 44px;
}
.chapter-list {
  display: grid;
  gap: 2px;
}
.curriculum-chapter {
  min-width: 0;
  margin-right: 4px;
  padding: 2px 0;
  border-radius: 10px;
}
.curriculum-chapter[draggable="true"] {
  cursor: grab;
}
.chapter-toggle {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  padding: 5px 5px 5px 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #344054;
  font-size: 0.78rem;
  line-height: 1.3;
  text-align: left;
}
.chapter-toggle:hover,
.curriculum-lesson:hover {
  background: #f3f7ff;
}
.chapter-toggle :deep(.v-chip) {
  flex: 0 0 auto;
  min-width: 20px;
  height: 20px;
  margin-right: 3px;
  font-size: 0.62rem;
}
.chapter-mobile-action {
  display: none;
}
.lesson-list {
  display: grid;
  gap: 3px;
  padding: 3px 0 2px 25px;
}
.curriculum-lesson {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  padding: 6px 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #475467;
  font-size: 0.82rem;
}
.curriculum-lesson[draggable="true"] {
  cursor: grab;
}
.curriculum-lesson:focus-visible,
.chapter-toggle:focus-visible {
  outline: 2px solid #2f7cf6;
  outline-offset: 2px;
}
.curriculum-keyboard-selected {
  border-color: #2f7cf6;
  background: #edf5ff;
}
.curriculum-drop-source {
  opacity: 0.55;
}
.curriculum-dialog-source {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e1eaf7;
  border-radius: 12px;
  background: #f6f9ff;
}
.curriculum-dialog-source div {
  display: grid;
  min-width: 0;
}
.curriculum-dialog-source strong,
.curriculum-dialog-source span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.curriculum-dialog-source span {
  color: #667085;
  font-size: 0.82rem;
}

.schedule-calendar {
  display: grid;
  gap: 16px;
}

.month-day-disabled {
  cursor: not-allowed;
  opacity: 0.52;
}
.month-day-disabled:hover {
  background: #fff;
  box-shadow: none;
}
.keyboard-drop-hint {
  display: block;
  border-radius: 5px;
  background: #eaf2ff;
  color: #175cd3;
  font-size: 0.58rem;
  line-height: 1.25;
}

.month-calendar {
  overflow: hidden;
  border: 1px solid #dfe8f5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(38, 78, 130, 0.06);
}

.month-weekdays,
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.month-weekdays {
  background: #f4f8ff;
}

.month-weekday {
  padding: 6px 4px;
  border-bottom: 1px solid #e7eef8;
  color: #667b98;
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.month-day-cell {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 100px;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 4px 5px;
  border: 0;
  border-right: 1px solid #edf1f7;
  border-bottom: 1px solid #edf1f7;
  background: #fff;
  color: #172b4d;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.month-day-cell:nth-child(7n) {
  border-right: 0;
}

.month-day-cell:hover {
  z-index: 1;
  background: #f5f9ff;
  box-shadow: inset 0 0 0 2px #b8d3ff;
}

.month-day-cell:focus { outline: none; }
.month-day-cell:focus-visible {
  z-index: 2;
  outline: 2px solid #2f7cf6;
  outline-offset: -3px;
}

.month-day-outside {
  background: #fafbfd;
  color: #a6b1c1;
}

.month-day-number {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #344054;
  font-size: 0.72rem;
  font-weight: 750;
}

.month-day-outside .month-day-number {
  color: #a6b1c1;
}

.month-day-today .month-day-number {
  background: #eaf2ff;
  color: #2167d8;
}

.month-day-selected {
  z-index: 1;
  background: #f1f6ff;
  box-shadow: inset 0 0 0 2px #2f7cf6;
}

.month-day-selected .month-day-number {
  background: #2f7cf6;
  color: #fff;
}

.month-day-drop-target {
  box-shadow: inset 0 0 0 3px #12a889;
  background: #effbf7;
}

.month-day-cell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.month-day-today-mark {
  color: #2f7cf6;
  font-size: 0.56rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  background: #eaf2ff;
  line-height: 1.2;
}

.month-day-event-list {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.month-event-pill {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  padding: 1px 4px;
  border-radius: 4px;
  background: #fff5df;
  color: #875b00;
  font-size: 0.62rem;
  line-height: 1.25;
  border-left: 3px solid var(--class-accent, transparent);
}

.month-event-draggable {
  cursor: grab;
}
.month-event-draggable:active {
  cursor: grabbing;
}

.month-event-submitted {
  background: #e9f9f1;
  color: #087443;
}
.month-event-inProgress {
  background: #eaf2ff;
  color: #175cd3;
}
.month-event-overdue {
  background: #ffefed;
  color: #b42318;
}

.month-event-time {
  flex: 0 0 auto;
  font-weight: 800;
}

.month-event-title {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-event-more {
  padding-left: 5px;
  color: #667085;
  font-size: 0.65rem;
  font-weight: 700;
}

.month-day-mobile-count {
  display: none;
}

.selected-day-agenda {
  min-height: 210px;
  padding: 22px;
  border: 1px solid #e1eaf7;
  border-radius: 20px;
  background: #fff;
}

.agenda-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2fa;
}

.agenda-eyebrow {
  color: #2f7cf6;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: capitalize;
}

.agenda-heading h2 {
  margin: 2px 0 0;
  color: #172b4d;
  font-size: 1.2rem;
  font-weight: 900;
}

.agenda-events {
  display: grid;
  gap: 10px;
}

.agenda-event {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e3ebf7;
  border-left: 4px solid var(--class-accent, #ffb020);
  border-radius: 15px;
  background: #fbfdff;
}

.day-detail-panel .agenda-event {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 4px !important;
  padding: 6px 8px !important;
  border-radius: 10px;
}

.agenda-event-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.day-detail-panel .agenda-event-time {
  font-size: 0.7rem;
  color: #475467;
  font-weight: 750;
}

.day-detail-panel .agenda-event-title {
  color: #172b4d;
  font-size: 0.76rem;
  font-weight: 750;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.day-detail-panel .agenda-event-context {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 1px;
  font-size: 0.66rem;
  color: #667085;
}

.class-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: #344054;
}

.day-detail-panel .agenda-event-actions {
  display: flex;
  align-items: center;
  justify-content: stretch;
  margin-top: 3px;
  padding-top: 5px;
  border-top: 1px dashed #edf2fa;
}

.day-detail-panel .agenda-event-actions .v-btn {
  width: 100%;
  height: 24px !important;
  min-height: 24px !important;
  padding-inline: 8px !important;
  font-size: 0.68rem !important;
}

.day-detail-panel .agenda-event :deep(.v-chip) {
  height: 21px;
  font-size: 0.64rem;
}

.day-detail-panel .agenda-empty {
  min-height: 80px;
  padding: 12px 8px;
  gap: 8px;
  border-radius: 12px;
}

.day-detail-panel .agenda-empty strong {
  font-size: 0.82rem;
}

.day-detail-panel .agenda-empty span {
  font-size: 0.72rem;
}

.agenda-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #475467;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.upcoming-section-label {
  display: flex;
  align-items: center;
  gap: 7px;
}

.upcoming-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed #e2eaf5;
}

.upcoming-events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upcoming-event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid #e7eef8;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.upcoming-event-item:hover {
  background: #f4f8ff;
  border-color: #b8d3ff;
  transform: translateY(-1px);
}

.upcoming-item-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}

.class-color-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.upcoming-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.upcoming-item-title {
  font-size: 0.76rem;
  font-weight: 750;
  color: #172b4d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.25;
}

.upcoming-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.65rem;
  color: #667085;
}

.upcoming-item-class {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 75px;
}

.upcoming-item-deadline {
  color: #b54708;
  white-space: nowrap;
}

.upcoming-item-arrow {
  flex-shrink: 0;
  color: #98a2b3;
}

.upcoming-event-item:hover .upcoming-item-arrow {
  color: #2f7cf6;
}

.agenda-event[role="button"] {
  cursor: pointer;
  transition:
    box-shadow 0.16s ease,
    background 0.16s ease;
}
.agenda-event[role="button"]:hover {
  background: #f6faff;
  box-shadow: 0 5px 16px rgba(36, 91, 164, 0.08);
}

.class-filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.class-filter-label {
  margin-right: 4px;
  color: #667085;
  font-size: 0.82rem;
  font-weight: 750;
}
.class-filter-muted {
  opacity: 0.45;
}
.event-drawer {
  position: fixed !important;
  top: 90px !important;
  right: 0 !important;
  bottom: 0 !important;
  height: calc(100vh - 90px) !important;
  height: calc(100dvh - 90px) !important;
  max-height: calc(100dvh - 90px) !important;
  border-left: 1px solid #e1eaf7;
  background: #fbfdff;
}
.event-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #eaf0f8;
}
.event-drawer-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: #eaf2ff;
  color: #2f7cf6;
}
.event-drawer-body {
  padding: 22px;
}
.event-drawer-body h2 {
  margin: 5px 0 20px;
  color: #172b4d;
  font-size: 1.35rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.drawer-detail-line {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin: 13px 0;
  color: #475467;
  font-size: 0.9rem;
}
.drawer-detail-line :deep(.v-icon) {
  color: #347cf6;
}
.drawer-progress-heading,
.drawer-pending-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.drawer-progress-heading h3,
.drawer-pending-heading h3 {
  margin: 0;
  color: #26364e;
  font-size: 0.98rem;
  font-weight: 800;
}
.drawer-progress-heading strong {
  color: #147d72;
}
.drawer-student-list {
  max-height: min(42vh, 420px);
  overflow-y: auto;
  margin-top: 10px;
  border: 1px solid #e5edf7;
  border-radius: 13px;
  background: #fff;
}
.drawer-student-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  color: #344054;
  font-size: 0.87rem;
}
.drawer-student-row + .drawer-student-row {
  border-top: 1px solid #f0f3f8;
}
.drawer-all-submitted {
  margin-top: 12px;
  padding: 12px;
  border-radius: 11px;
  background: #eafaf3;
  color: #087443;
  font-size: 0.87rem;
}
.drawer-loading {
  display: grid;
  min-height: 120px;
  place-items: center;
}

.agenda-event-submitted {
  border-left-color: #2bc48a;
}
.agenda-event-inProgress {
  border-left-color: #2f7cf6;
}
.agenda-event-overdue {
  border-left-color: #f04438;
}
.agenda-event-upcoming {
  border-left-color: #ffb020;
}

.agenda-event-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #475467;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
}

.agenda-event-main {
  min-width: 0;
}

.agenda-event-title {
  overflow: hidden;
  color: #172b4d;
  font-size: 1rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-event-context {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  color: #7b8798;
  font-size: 0.78rem;
}

.agenda-event-context span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.agenda-event-context span :deep(.v-icon) {
  flex: 0 0 auto;
}

.agenda-event-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.agenda-empty {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px dashed #d8e4f3;
  border-radius: 15px;
  background: #f9fbff;
  color: #98a2b3;
}

.agenda-empty > :deep(.v-icon) {
  color: #91a9c7;
}

.agenda-empty div {
  display: grid;
  gap: 2px;
}

.agenda-empty strong {
  color: #475467;
  font-size: 0.92rem;
}

.agenda-empty span {
  font-size: 0.8rem;
}

@media (max-width: 1279px) {
  .compact-drawer {
    inset: auto 0 0 !important;
    width: 100% !important;
    max-width: 100vw !important;
    border-radius: 18px 18px 0 0 !important;
    box-shadow: 0 -8px 28px rgba(38, 78, 130, 0.16) !important;
  }
  .compact-drawer :deep(.v-navigation-drawer__content) {
    overflow-y: auto;
  }
  .curriculum-compact-drawer {
    height: min(58vh, 480px) !important;
    max-height: min(58vh, 480px) !important;
  }
  .day-detail-compact-drawer {
    height: min(42vh, 350px) !important;
    max-height: min(42vh, 350px) !important;
  }
  .teacher-workspace {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  .teacher-workspace.curriculum-collapsed {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  .curriculum-sidebar,
  .day-detail-panel {
    display: none !important;
  }
}

.compact-view-triggers {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 760px) {
  .teacher-calendar-toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 10px;
    padding: 10px;
  }
  .teacher-calendar-toolbar h1 {
    font-size: 1.05rem;
  }
  .teacher-toolbar-classes {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .teacher-month-controls {
    grid-column: 1 / -1;
    grid-row: 3;
    justify-content: space-between;
  }
  .teacher-schedule-stats {
    gap: 6px;
  }
  .teacher-stat-card {
    align-items: flex-start;
    gap: 6px;
    flex-direction: column;
    padding: 9px;
  }
  .teacher-stat-card span {
    font-size: 0.67rem;
    white-space: normal;
  }
  .teacher-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .teacher-workspace.curriculum-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }
  .curriculum-sidebar {
    position: relative;
    top: auto;
    max-height: none;
  }
  .curriculum-tree {
    max-height: 45vh;
  }
  .chapter-mobile-action {
    display: inline-flex;
  }
  .event-drawer {
    top: 70px !important;
    height: calc(100vh - 70px) !important;
    height: calc(100dvh - 70px) !important;
    max-height: calc(100dvh - 70px) !important;
  }
  .schedule-hero {
    align-items: flex-start;
    padding: 20px;
  }

  .month-day-cell {
    min-height: 108px;
    padding: 7px 6px;
  }

  .month-event-pill {
    font-size: 0.62rem;
  }

  .month-event-time {
    display: none;
  }

  .agenda-event {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .selected-day-agenda {
    padding: 17px;
  }

  .agenda-event-actions {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .week-toolbar-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .week-controls {
    width: 100%;
    justify-content: space-between;
  }

  .schedule-hero-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .schedule-hero p {
    font-size: 0.84rem;
  }

  .month-calendar {
    border-radius: 14px;
  }

  .month-weekday {
    padding: 9px 1px;
    font-size: 0.59rem;
  }

  .month-day-cell {
    min-height: 56px;
    padding: 4px;
  }

  .month-day-number {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .month-day-today-mark,
  .month-day-event-list {
    display: none;
  }

  .month-day-mobile-count {
    position: absolute;
    right: 4px;
    bottom: 4px;
    display: grid;
    min-width: 17px;
    height: 17px;
    place-items: center;
    padding: 0 4px;
    border-radius: 999px;
    background: #e1efff;
    color: #175cd3;
    font-size: 0.62rem;
    font-weight: 900;
  }

  .month-day-selected .month-day-mobile-count {
    background: #2f7cf6;
    color: #fff;
  }

  .agenda-empty {
    justify-content: flex-start;
    padding: 16px;
  }
}
</style>
