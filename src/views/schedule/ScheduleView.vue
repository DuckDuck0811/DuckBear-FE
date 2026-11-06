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
              v-if="monthOffset !== 0"
              variant="tonal"
              color="primary"
              size="x-small"
              class="text-none font-weight-bold teacher-today-button"
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
          <div class="stat-chip">
            <v-icon icon="mdi-clock-fast" color="warning" size="15" />
            <span class="stat-chip-label">{{ t("schedule.upcomingSevenDays") }}</span>
            <strong class="stat-chip-value">{{ upcomingSevenDaysCount }}</strong>
          </div>
          <div v-if="overdueIncompleteCount !== null" class="stat-chip stat-chip--error">
            <v-icon icon="mdi-alert-circle-outline" color="error" size="15" />
            <span class="stat-chip-label">{{ t("schedule.overdueIncomplete") }}</span>
            <strong class="stat-chip-value">{{ overdueIncompleteCount }}</strong>
          </div>
          <div class="stat-chip stat-chip--primary">
            <v-icon icon="mdi-calendar-month-outline" color="primary" size="15" />
            <span class="stat-chip-label">{{ t("schedule.assignmentsThisMonth") }}</span>
            <strong class="stat-chip-value">{{ monthEvents.length }}</strong>
          </div>
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
          <aside
            v-if="isTeacher"
            class="curriculum-sidebar"
            :class="{ 'curriculum-sidebar--rail': !curriculumSidebarOpen }"
            @mouseenter="railHover = true"
            @mouseleave="railHover = false"
          >
            <template v-if="curriculumSidebarOpen">
              <div class="curriculum-heading">
                <div>
                  <h2>{{ t("schedule.curriculumTitle") }}</h2>
                  <p>{{ t("schedule.curriculumHint") }}</p>
                </div>
                <v-btn
                  icon="mdi-chevron-left"
                  variant="text"
                  size="small"
                  :aria-label="t('schedule.collapseCurriculum')"
                  @click="curriculumSidebarOpen = false"
                />
              </div>
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
                    <div
                      v-else-if="filteredChapters(book).length"
                      class="chapter-list"
                    >
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
                          :aria-expanded="
                            expandedChapters.includes(chapterKey(book, chapter))
                          "
                          @click.stop="toggleChapter(book, chapter)"
                        >
                          <v-icon
                            :icon="
                              expandedChapters.includes(
                                chapterKey(book, chapter),
                              )
                                ? 'mdi-chevron-down'
                                : 'mdi-chevron-right'
                            "
                            size="18"
                          />
                          <v-icon icon="mdi-folder-outline" size="17" />
                          <span class="curriculum-node-title">{{
                            chapter.title
                          }}</span>
                          <v-tooltip
                            :text="t('schedule.lessonCountTooltip', { count: filteredLessons(chapter).length })"
                            location="top"
                          >
                            <template #activator="{ props: tp }">
                              <v-chip v-bind="tp" size="x-small" variant="tonal" class="chapter-lesson-badge">{{
                                filteredLessons(chapter).length
                              }}</v-chip>
                            </template>
                          </v-tooltip>
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
                          v-if="
                            expandedChapters.includes(chapterKey(book, chapter))
                          "
                          class="lesson-list"
                        >
                          <template v-if="filteredLessons(chapter).length">
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
                              @click="
                                selectKeyboardLesson(lesson, chapter, book)
                              "
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
                          </template>
                          <div
                            v-else
                            class="curriculum-state compact-state text-medium-emphasis"
                          >
                            {{ t("schedule.noLessonsInChapter") }}
                          </div>
                        </div>
                      </section>
                    </div>
                    <div
                      v-else
                      class="curriculum-state compact-state text-medium-emphasis"
                    >
                      {{
                        book.chapters?.length
                          ? t("schedule.noCurriculumMatch")
                          : t("schedule.noChapters")
                      }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>

            <!-- Trạng thái ĐÓNG: Rail icon + Flyout -->
            <template v-else>
              <div class="curriculum-rail">
                <v-tooltip :text="t('schedule.expandCurriculum')" location="right">
                  <template #activator="{ props: tp }">
                    <v-btn
                      v-bind="tp"
                      icon="mdi-chevron-right"
                      variant="tonal"
                      color="primary"
                      size="small"
                      class="curriculum-rail-toggle mb-2"
                      :aria-label="t('schedule.expandCurriculum')"
                      @click="curriculumSidebarOpen = true"
                    />
                  </template>
                </v-tooltip>

                <div class="curriculum-rail-books">
                  <v-tooltip
                    v-for="book in filteredBooks"
                    :key="book.id"
                    :text="book.title"
                    location="right"
                  >
                    <template #activator="{ props: tp }">
                      <button
                        v-bind="tp"
                        type="button"
                        class="curriculum-rail-book-btn"
                        :style="{
                          borderColor: bookColor(book.id),
                          backgroundColor: `${bookColor(book.id)}15`,
                          color: bookColor(book.id)
                        }"
                        :aria-label="t('schedule.openAndSelectBook', { title: book.title })"
                        @click="openBookFromRail(book)"
                      >
                        <span class="curriculum-rail-book-text">{{ bookAcronym(book.title) }}</span>
                      </button>
                    </template>
                  </v-tooltip>
                </div>
              </div>

              <!-- Flyout panel nổi đè lên lịch khi rê chuột/focus vào rail -->
              <div
                v-if="railHover"
                class="curriculum-flyout-panel"
                @mouseenter="railHover = true"
                @mouseleave="railHover = false"
              >
                <div class="curriculum-flyout-header">
                  <div>
                    <span class="font-weight-bold d-block text-body-2">{{ t("schedule.curriculumTitle") }}</span>
                    <span class="text-caption text-medium-emphasis">{{ t("schedule.curriculumHint") }}</span>
                  </div>
                  <v-btn
                    icon="mdi-open-in-new"
                    variant="text"
                    size="x-small"
                    :title="t('schedule.expandCurriculum')"
                    @click="curriculumSidebarOpen = true"
                  />
                </div>
                <div class="curriculum-flyout-body">
                  <v-expansion-panels
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
                        <span class="curriculum-node-title" :title="book.title">{{ book.title }}</span>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div
                          v-if="book.loading"
                          class="curriculum-state compact-state"
                        >
                          <v-progress-circular
                            indeterminate
                            size="18"
                            color="primary"
                          />
                          <span>{{ t("schedule.loadingChapters") }}</span>
                        </div>
                        <div
                          v-else-if="filteredChapters(book).length"
                          class="chapter-list"
                        >
                          <section
                            v-for="chapter in filteredChapters(book)"
                            :key="chapter.id"
                            class="curriculum-chapter"
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
                              :aria-expanded="
                                expandedChapters.includes(chapterKey(book, chapter))
                              "
                              @click.stop="toggleChapter(book, chapter)"
                            >
                              <v-icon icon="mdi-drag" size="16" class="curriculum-drag-handle" />
                              <v-icon
                                :icon="
                                  expandedChapters.includes(
                                    chapterKey(book, chapter),
                                  )
                                    ? 'mdi-chevron-down'
                                    : 'mdi-chevron-right'
                                "
                                size="18"
                              />
                              <v-icon icon="mdi-folder-outline" size="17" />
                              <span class="curriculum-node-title" :title="chapter.title">{{
                                chapter.title
                              }}</span>
                              <v-chip size="x-small" variant="tonal" class="chapter-lesson-badge">{{
                                filteredLessons(chapter).length
                              }}</v-chip>
                            </button>
                            <div
                              v-if="
                                expandedChapters.includes(chapterKey(book, chapter))
                              "
                              class="lesson-list"
                            >
                              <div
                                v-for="lesson in filteredLessons(chapter)"
                                :key="lesson.id"
                                class="curriculum-lesson"
                                :draggable="!isMobile"
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
                                <v-icon icon="mdi-drag" size="16" class="curriculum-drag-handle" />
                                <v-icon
                                  icon="mdi-book-open-blank-variant-outline"
                                  size="16"
                                />
                                <span class="curriculum-node-title" :title="lesson.title">{{
                                  lesson.title
                                }}</span>
                              </div>
                            </div>
                          </section>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </div>
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
                          class="month-event-slot"
                        >
                        <v-tooltip
                          :text="event.title"
                          location="top"
                          max-width="280"
                        >
                          <template #activator="{ props: eventTip }">
                            <span
                              v-bind="eventTip"
                              class="month-event-pill"
                              :class="[
                                `month-event-${event.status}`,
                                { 'month-event-draggable': isTeacher },
                              ]"
                              :style="eventClassStyle(event)"
                              :draggable="isTeacher"
                              role="button"
                              tabindex="0"
                              :aria-label="eventTooltip(event)"
                              @click.stop="openEventDrawer(event)"
                              @keydown.enter.stop="openEventDrawer(event)"
                              @keydown.space.prevent.stop="openEventDrawer(event)"
                              @dragstart.stop="startDrag($event, event)"
                              @dragend="dropTargetKey = ''"
                            >
                              <span class="month-event-meta-row">
                                <span class="month-event-time">{{ formatTime(event.deadline) }}</span>
                                <v-icon
                                  :icon="eventKindIcon(event)"
                                  size="12"
                                  class="month-event-kind-icon"
                                  :aria-label="eventKindShortLabel(event)"
                                />
                                <span class="month-event-status-icon">
                                  <v-icon v-if="event.status === 'submitted'" icon="mdi-check-circle" size="11" />
                                  <v-icon v-else-if="event.status === 'overdue'" icon="mdi-alert-circle" size="11" />
                                </span>
                              </span>
                              <span class="month-event-title">{{ event.title }}</span>
                            </span>
                          </template>
                        </v-tooltip>
                        </span>
                        <button
                          v-if="day.events.length > 2"
                          type="button"
                          class="month-event-more"
                          @click.stop="selectCalendarDay(day)"
                        >
                          {{ t("schedule.moreEventsBtn", { count: day.events.length - 2 }) }}
                        </button>
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
            <header class="agenda-heading day-detail-header-two-rows">
              <!-- HÀNG 1: Tiêu đề ngày + badge Hôm nay + nút đóng "×" -->
              <div class="day-detail-row-top">
                <div class="day-detail-heading-copy">
                  <h2 class="day-detail-heading-title">
                    <span>{{ formatDayHeading(selectedDay) }}</span>
                    <span v-if="selectedDay?.isToday" class="day-detail-today-badge">{{ t("schedule.today") }}</span>
                  </h2>
                </div>
                <v-tooltip :text="t('schedule.closeDetails')" location="bottom">
                  <template #activator="{ props: tp }">
                    <v-btn
                      v-bind="tp"
                      icon="mdi-close"
                      variant="text"
                      density="compact"
                      :size="32"
                      :aria-label="t('schedule.closeDetails')"
                      class="day-detail-action-btn"
                      @click="dayDetailExpanded = false"
                    />
                  </template>
                </v-tooltip>
              </div>

              <!-- HÀNG 2: Nút Giao bài có chữ, nổi bật -->
              <div v-if="selectedDay && !isPastDay(selectedDay.date)" class="day-detail-row-action">
                <v-btn
                  variant="flat"
                  color="primary"
                  density="compact"
                  class="day-detail-assign-btn"
                  prepend-icon="mdi-plus"
                  :aria-label="t('schedule.quickCreateTitle')"
                  @click="openQuickCreate(selectedDay)"
                >
                  {{ t('schedule.createAssignmentShort') }}
                </v-btn>
              </div>
            </header>

            <div class="agenda-content">
              <!-- KHỐI 1: Bài trong ngày đã chọn (Luôn hiện trên cùng) -->
              <div class="agenda-section day-current-section mb-2">
                <div class="agenda-section-title">
                  <span>{{ t("schedule.dayAssignmentsTitle") }}</span>
                  <v-chip
                    v-if="selectedDayEvents.length"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ selectedDayEvents.length }}
                  </v-chip>
                </div>
                <!-- Có bài trong ngày -->
                <div v-if="selectedDayEvents.length" class="agenda-events">
                  <article
                    v-for="event in selectedDayEvents"
                    :key="event.id"
                    class="agenda-event compact-agenda-event"
                    :class="`agenda-event-${event.status}`"
                    :style="eventClassStyle(event)"
                    role="button"
                    tabindex="0"
                    @click="openEventDrawer(event)"
                    @keydown.enter="openEventDrawer(event)"
                  >
                    <!-- Dòng 1: Giờ + Nhãn trạng thái (có icon, tương phản cao) -->
                    <div class="agenda-event-top">
                      <div class="agenda-event-time font-weight-bold">
                        <v-icon icon="mdi-clock-outline" size="14" class="mr-1" />
                        <span>{{ formatTime(event.deadline) }}</span>
                      </div>
                      <v-chip
                        size="x-small"
                        variant="tonal"
                        :color="statusColor(event.status)"
                        class="font-weight-bold event-status-chip"
                      >
                        <v-icon
                          v-if="event.status === 'submitted'"
                          icon="mdi-check-circle"
                          size="12"
                          start
                        />
                        <v-icon
                          v-else-if="event.status === 'overdue'"
                          icon="mdi-alert-circle"
                          size="12"
                          start
                        />
                        <v-icon
                          v-else
                          icon="mdi-clock-fast"
                          size="12"
                          start
                        />
                        {{ t(`schedule.${event.status}`) }}
                      </v-chip>
                    </div>

                    <!-- Dòng 2: Tên bài -->
                    <div class="agenda-event-title font-weight-bold" :title="event.title">
                      {{ event.title }}
                    </div>

                    <!-- Dòng 3: Chấm màu lớp + Tên lớp + Thẻ loại bài -->
                    <div class="agenda-event-context">
                      <span v-if="event.class?.name" class="class-badge">
                        <span
                          class="class-color-dot"
                          :style="{
                            backgroundColor: classColor(
                              event.classId || event.class?.id,
                            ),
                          }"
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

                    <!-- Tiến độ nộp nếu có dữ liệu -->
                    <div
                      v-if="
                        event.submittedCount !== undefined &&
                        event.totalStudents
                      "
                      class="agenda-event-progress mt-1"
                    >
                      <div
                        class="d-flex justify-space-between text-caption text-medium-emphasis"
                      >
                        <span>{{ t("schedule.submissionProgress") }}</span>
                        <strong
                          >{{ event.submittedCount }}/{{
                            event.totalStudents
                          }}</strong
                        >
                      </div>
                      <v-progress-linear
                        :model-value="
                          (event.submittedCount / event.totalStudents) * 100
                        "
                        color="success"
                        height="4"
                        rounded
                      />
                    </div>

                    <!-- Dòng 4: Hàng nút gọn gàng -->
                    <div class="agenda-event-actions-row mt-2" @click.stop>
                      <v-btn
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        class="event-action-btn flex-grow-1"
                        prepend-icon="mdi-eye-outline"
                        @click.stop="openEventDrawer(event)"
                      >
                        {{ t("schedule.viewAssigned") }}
                      </v-btn>
                      <v-btn
                        v-if="event.type === 'manual'"
                        size="x-small"
                        variant="tonal"
                        color="secondary"
                        class="event-action-btn"
                        prepend-icon="mdi-paperclip"
                        @click.stop="openEventDrawer(event)"
                      >
                        {{ t("schedule.attachmentsCount", { count: event.attachments?.length || 1 }) }}
                      </v-btn>
                      <v-btn
                        v-else
                        size="x-small"
                        variant="tonal"
                        color="secondary"
                        class="event-action-btn"
                        prepend-icon="mdi-file-document-outline"
                        @click.stop="openEventDrawer(event)"
                      >
                        {{ t("schedule.viewAssignmentContent") }}
                      </v-btn>
                    </div>
                  </article>
                </div>
                <!-- Ngày trống: Hiện thông báo rõ ràng -->
                <div v-else class="day-empty-card">
                  <v-icon icon="mdi-calendar-blank-outline" size="24" color="primary" class="mb-1" />
                  <div class="day-empty-title">{{ t("schedule.noDayAssignments") }}</div>
                  <div class="day-empty-sub">{{ t("schedule.dragToAssignHint") }}</div>
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- KHỐI 2: Danh sách bài Sắp tới khác -->
              <div
                v-if="upcomingDisplayEvents.length"
                class="agenda-section upcoming-section"
              >
                <div class="agenda-section-title">
                  <div class="upcoming-section-label">
                    <v-icon icon="mdi-clock-fast" size="15" color="warning" />
                    <span>{{ t("schedule.upcomingOtherAssignmentsTitle") }}</span>
                  </div>
                  <v-chip
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    class="font-weight-bold"
                  >
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
                        :style="{
                          backgroundColor: classColor(
                            item.classId || item.class?.id,
                          ),
                        }"
                      ></span>
                      <div class="upcoming-item-info">
                        <div class="upcoming-item-title">{{ item.title }}</div>
                        <div class="upcoming-item-meta">
                          <span class="upcoming-item-class">{{
                            item.class?.name || item.className
                          }}</span>
                          <span class="upcoming-item-dot">·</span>
                          <span class="upcoming-item-deadline font-weight-bold">
                            {{ getRelativeDeadlineText(item.deadlineDate) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <v-icon
                      icon="mdi-chevron-right"
                      size="16"
                      class="upcoming-item-arrow"
                    />
                  </div>
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
      <div
        class="drawer-header pa-3 d-flex align-center justify-space-between border-b"
      >
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
              <div
                v-else-if="filteredChapters(book).length"
                class="chapter-list"
              >
                <section
                  v-for="chapter in filteredChapters(book)"
                  :key="chapter.id"
                  class="curriculum-chapter"
                >
                  <button
                    type="button"
                    class="chapter-toggle"
                    :aria-expanded="
                      expandedChapters.includes(chapterKey(book, chapter))
                    "
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
                    <template v-if="filteredLessons(chapter).length">
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
                    </template>
                    <div
                      v-else
                      class="curriculum-state compact-state text-medium-emphasis"
                    >
                      {{ t("schedule.noLessonsInChapter") }}
                    </div>
                  </div>
                </section>
              </div>
              <div
                v-else
                class="curriculum-state compact-state text-medium-emphasis"
              >
                {{
                  book.chapters?.length
                    ? t("schedule.noCurriculumMatch")
                    : t("schedule.noChapters")
                }}
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
            {{ formatDayHeading(selectedDay) }}
          </h3>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="selectedDay && !isPastDay(selectedDay.date)"
            icon="mdi-plus"
            variant="text"
            size="small"
            :aria-label="t('schedule.quickCreateTitle')"
            @click="
              openQuickCreate(selectedDay);
              dayDetailMobileDrawer = false;
            "
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
            <v-chip
              size="x-small"
              color="primary"
              variant="tonal"
              class="font-weight-bold"
            >
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
                      :style="{
                        backgroundColor: classColor(
                          event.classId || event.class?.id,
                        ),
                      }"
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
              <v-expansion-panels class="assignment-content-accordion mt-2" @click.stop @update:model-value="(value) => value !== null && loadCalendarContent(event)">
                <v-expansion-panel value="content">
                  <v-expansion-panel-title @click.stop>{{ t("schedule.assignmentContent") }}</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-progress-linear v-if="calendarContentFor(event).loading" indeterminate color="primary" />
                    <v-alert v-else-if="calendarContentFor(event).error" type="error" variant="tonal" density="compact">{{ calendarContentFor(event).error }}<v-btn size="small" variant="text" @click.stop="loadCalendarContent(event)">{{ t("schedule.retry") }}</v-btn></v-alert>
                    <template v-else-if="calendarContentFor(event).loaded && event.type === 'manual'">
                      <div v-if="calendarContentFor(event).attachments.length" class="assignment-attachment-list"><div v-for="attachment in calendarContentFor(event).attachments" :key="attachment.id" class="d-flex align-center ga-2 py-1"><v-icon icon="mdi-paperclip" size="16" />{{ attachment.fileName }}</div></div>
                      <div v-else class="text-caption text-medium-emphasis">{{ t("schedule.noAttachments") }}</div>
                    </template>
                    <template v-else-if="calendarContentFor(event).loaded">
                      <v-alert v-if="calendarContentFor(event).hasAttempts" type="info" variant="tonal" density="compact" class="mb-2">{{ t("schedule.questionsLocked") }}</v-alert>
                      <div v-if="calendarContentFor(event).questions.length" class="assignment-question-list"><div v-for="(item, index) in calendarContentFor(event).questions" :key="item.question.id" class="assignment-question-row"><span class="text-caption font-weight-bold">{{ index + 1 }}.</span><span class="assignment-question-text" :title="item.question.content">{{ item.question.content }}</span><v-chip size="x-small" variant="tonal">{{ t(`schedule.questionTypes.${item.question.type}`) }}</v-chip><span class="text-caption text-medium-emphasis">{{ t("schedule.questionPoints", { points: item.points }) }}</span></div></div>
                      <v-btn v-if="calendarContentFor(event).hasAttempts" :to="`/submissions/${event.id}`" size="small" variant="tonal" prepend-icon="mdi-eye-outline" class="mt-2" @click.stop>{{ t("schedule.viewExam") }}</v-btn>
                      <v-btn v-else :to="questionBankTarget(event)" size="small" variant="tonal" prepend-icon="mdi-pencil-outline" class="mt-2" @click.stop>{{ t("schedule.viewEditExam") }}</v-btn>
                    </template>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
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

        <div
          v-if="upcomingDisplayEvents.length"
          class="agenda-section upcoming-section"
        >
          <div class="agenda-section-title">
            <div class="d-flex align-center gap-1">
              <v-icon icon="mdi-clock-fast" size="15" color="warning" />
              <span>{{ t("schedule.upcomingOtherAssignmentsTitle") }}</span>
            </div>
            <v-chip
              size="x-small"
              color="warning"
              variant="tonal"
              class="font-weight-bold"
            >
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
              @click="
                selectEventDateOnCalendar(item);
                dayDetailMobileDrawer = false;
              "
            >
              <div class="upcoming-item-left">
                <span
                  class="class-color-dot"
                  :style="{
                    backgroundColor: classColor(item.classId || item.class?.id),
                  }"
                ></span>
                <div class="upcoming-item-info">
                  <div class="upcoming-item-title">{{ item.title }}</div>
                  <div class="upcoming-item-meta">
                    <span class="upcoming-item-class">{{
                      item.class?.name || item.className
                    }}</span>
                    <span class="upcoming-item-dot">·</span>
                    <span class="upcoming-item-deadline font-weight-bold">
                      {{ getRelativeDeadlineText(item.deadlineDate) }}
                    </span>
                  </div>
                </div>
              </div>
              <v-icon
                icon="mdi-chevron-right"
                size="16"
                class="upcoming-item-arrow"
              />
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
      max-width="840"
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
            <v-btn size="small" variant="text" class="ml-2" @click="reloadCurriculumQuestionPreview">{{ t("schedule.retry") }}</v-btn>
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
              <strong>{{ curriculumBreadcrumb }}</strong>
              <span>{{ curriculumForm.deadline?.replace("T", " ") }}</span>
            </div>
          </div>
          <v-progress-linear v-if="curriculumQuestionsLoading" indeterminate color="primary" rounded class="mb-4" />
          <v-alert v-else-if="!curriculumQuestionsLoading && curriculumQuestionLessons.length === 0" type="info" variant="tonal" class="mb-4">
            {{ t("schedule.noCurriculumLessons") }}
          </v-alert>
          <template v-else-if="!curriculumQuestionsLoading">
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
              <div class="text-body-2 font-weight-bold">{{ t("schedule.selectedQuestionSummary", { count: curriculumSelectedCount, total: curriculumQuestionCount }) }}</div>
              <v-btn size="small" variant="tonal" @click="toggleAllCurriculumQuestions">{{ curriculumAllSelected ? t("schedule.deselectAllQuestions") : t("schedule.selectAllQuestions") }}</v-btn>
            </div>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip v-for="(count, type) in curriculumSelectedTypeCounts" :key="type" size="small" variant="tonal">{{ t(`schedule.questionTypes.${type}`) }} · {{ count }}</v-chip>
            </div>
            <v-alert v-if="curriculumQuestionLessons.some((lesson) => lesson.questions.length && !curriculumSelectedForLesson(lesson).length)" type="info" variant="tonal" density="compact" class="mb-3">{{ t("schedule.unselectedLessonWillSkip") }}</v-alert>
            <v-alert v-for="lesson in curriculumQuestionLessons.filter((item) => !item.questions.length)" :key="`empty-${lesson.id}`" type="warning" variant="tonal" density="compact" class="mb-2">
              {{ t("schedule.lessonHasNoQuestions", { title: lesson.title }) }} {{ t("schedule.emptyLessonWillSkip") }}
            </v-alert>
            <v-expansion-panels v-if="curriculumSelection?.type === 'chapter'" v-model="expandedCurriculumLessons" multiple class="mb-4">
              <v-expansion-panel v-for="lesson in curriculumQuestionLessons" :key="lesson.id" :value="lesson.id">
                <v-expansion-panel-title>
                  <span class="flex-grow-1">{{ lesson.title }} · {{ curriculumSelectedForLesson(lesson).length }}/{{ lesson.questions.length }}</span>
                  <v-text-field v-model="curriculumLessonDates[lesson.id]" type="date" density="compact" hide-details :min="minimumDeadline.slice(0, 10)" class="lesson-date-input mr-3" :aria-label="t('schedule.lessonDeadline', { title: lesson.title })" @click.stop />
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-if="lesson.questions.length" class="question-preview-list">
                    <div v-for="(question, index) in lesson.questions" :key="question.id" class="question-preview-row">
                      <v-checkbox-btn :model-value="curriculumSelectedIds.includes(Number(question.id))" density="compact" :aria-label="t('schedule.toggleQuestion', { number: index + 1 })" @update:model-value="toggleCurriculumQuestion(question.id, $event)" />
                      <v-tooltip :text="question.content" location="top">
                      <template #activator="{ props: tooltipProps }"><span v-bind="tooltipProps" class="question-preview-content">{{ index + 1 }}. {{ question.preview || question.content }}</span></template>
                      </v-tooltip>
                      <v-chip size="x-small" variant="tonal">{{ t(`schedule.questionTypes.${question.type}`) }}</v-chip>
                    </div>
                  </div>
                  <div v-else class="text-medium-emphasis">{{ t("schedule.noQuestionsInLesson") }}</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <div v-else class="question-preview-list mb-4">
              <div v-for="(question, index) in curriculumQuestionLessons[0]?.questions || []" :key="question.id" class="question-preview-row">
                <v-checkbox-btn :model-value="curriculumSelectedIds.includes(Number(question.id))" density="compact" :aria-label="t('schedule.toggleQuestion', { number: index + 1 })" @update:model-value="toggleCurriculumQuestion(question.id, $event)" />
                <v-tooltip :text="question.content" location="top">
                  <template #activator="{ props: tooltipProps }"><span v-bind="tooltipProps" class="question-preview-content">{{ index + 1 }}. {{ question.preview || question.content }}</span></template>
                </v-tooltip>
                <v-chip size="x-small" variant="tonal">{{ t(`schedule.questionTypes.${question.type}`) }}</v-chip>
              </div>
            </div>
          </template>
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
            <v-btn size="small" variant="text" class="mt-1" @click="spreadChapterDates">{{ t("schedule.spreadDates") }}</v-btn>
          </template>
          <v-row dense>
            <v-col cols="6"><v-switch v-model="curriculumForm.shuffleQuestions" :label="t('schedule.shuffleQuestions')" color="primary" hide-details /></v-col>
            <v-col cols="6"><v-switch v-model="curriculumForm.shuffleOptions" :label="t('schedule.shuffleOptions')" color="primary" hide-details /></v-col>
          </v-row>
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
              curriculumQuestionsLoading ||
              curriculumSelectedCount === 0 ||
              curriculumSubmitting
            "
            @click="createCurriculumAssignments"
            >{{
              curriculumSelection?.type === "chapter"
                ? t("schedule.assignNLessons", { count: curriculumQuestionLessons.filter((lesson) => curriculumSelectedForLesson(lesson).length > 0).length })
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
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AppHeader from "../../components/shared/AppHeader.vue";
import TeacherSidebar from "../../components/shared/TeacherSidebar.vue";
import StudentSidebar from "../../components/shared/StudentSidebar.vue";
import { useAuthStore } from "../../stores/auth";
import { useScheduleStore } from "../../stores/schedule";
import { api } from "../../services/api";

const { t, locale } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const scheduleStore = useScheduleStore();
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
const calendarContent = reactive({});
const reminding = ref(false);
const quickCreateDialog = ref(false);
const quickCreating = ref(false);
const quickCreateError = ref("");
const quickCreateForm = reactive({ classId: null, title: "", deadline: "" });
const draggedEvent = ref(null);
const dropTargetKey = ref("");
const undoMove = ref(null);
const calendarToast = reactive({ show: false, message: "", color: "success" });
const CURRICULUM_SIDEBAR_STORAGE_KEY = "schedule-curriculum-open-state";
function getInitialCurriculumOpen() {
  try {
    const val = localStorage.getItem(CURRICULUM_SIDEBAR_STORAGE_KEY);
    return val !== null ? val === "true" : true;
  } catch {
    return true;
  }
}
const curriculumSidebarOpen = ref(getInitialCurriculumOpen());
watch(curriculumSidebarOpen, (val) => {
  try {
    localStorage.setItem(CURRICULUM_SIDEBAR_STORAGE_KEY, String(val));
  } catch {
    // ignore
  }
});
const railHover = ref(false);
function openBookFromRail(book) {
  curriculumSidebarOpen.value = true;
  expandedBooks.value = [book.id];
}
const curriculumLoading = ref(false);
const curriculumError = ref("");
const curriculumBooks = ref([]);
const curriculumSearch = ref("");
const expandedBooks = ref(null);
const expandedChapters = ref([]);
const CURRICULUM_EXPANSION_KEY = "schedule-curriculum-expansion";
const curriculumRestored = ref(false);
const draggedCurriculum = ref(null);
const keyboardLesson = ref(null);
const curriculumDialog = ref(false);
const curriculumSelection = ref(null);
const curriculumQuestionsLoading = ref(false);
const curriculumQuestionLessons = ref([]);
const curriculumSelectedIds = ref([]);
const expandedCurriculumLessons = ref([]);
const curriculumLessonDates = reactive({});
const curriculumSubmitting = ref(false);
const curriculumDialogError = ref("");
const curriculumForm = reactive({
  classId: null,
  deadline: "",
  durationMinutes: 30,
  maxAttempts: 1,
  intervalDays: 1,
  skipWeekends: true,
  shuffleQuestions: false,
  shuffleOptions: false,
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

const bookPalette = [
  "#0284c7",
  "#7c3aed",
  "#b45309",
  "#047857",
  "#c026d3",
  "#0891b2",
  "#be123c",
  "#4338ca",
];

function bookColor(bookId) {
  const idNum = Number(bookId) || 0;
  return bookPalette[Math.abs(idNum) % bookPalette.length];
}

function bookAcronym(title) {
  if (!title) return "S";
  const mainPart = title.split(/[—–-]/)[0].trim();
  const gradeMatch = mainPart.match(/l[ớo]p\s*(\d+)/i) || title.match(/l[ớo]p\s*(\d+)/i) || title.match(/(\d+)/);
  const grade = gradeMatch ? gradeMatch[1] : "";
  const subjectPart = mainPart.replace(/l[ớo]p\s*\d+/gi, "").trim();
  const words = subjectPart.split(/\s+/).filter(Boolean);
  if (!words.length) return (title.slice(0, 2) + grade).toUpperCase();
  const letters = words.map((w) => w[0]).join("").toUpperCase();
  const shortLetters = letters.slice(0, 2);
  return `${shortLetters}${grade}`;
}

const minimumDeadline = computed(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
});
const curriculumBreadcrumb = computed(() => {
  const selection = curriculumSelection.value;
  if (!selection) return "";
  return [selection.book?.title, selection.chapter?.title,
    selection.type === "lesson" ? selection.lesson?.title : null]
    .filter(Boolean).join(" › ");
});
const curriculumQuestionById = computed(() => new Map(
  curriculumQuestionLessons.value.flatMap((lesson) => lesson.questions)
    .map((question) => [Number(question.id), question]),
));
const curriculumSelectedCount = computed(() => curriculumSelectedIds.value.length);
const curriculumQuestionCount = computed(() => curriculumQuestionLessons.value.reduce((total, lesson) => total + lesson.questions.length, 0));
const curriculumSelectedTypeCounts = computed(() => {
  const counts = {};
  for (const id of curriculumSelectedIds.value) {
    const type = curriculumQuestionById.value.get(id)?.type;
    if (type) counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
});
const curriculumAllSelected = computed(() => {
  const ids = curriculumQuestionLessons.value.flatMap((lesson) => lesson.questions.map((question) => Number(question.id)));
  return ids.length > 0 && ids.every((id) => curriculumSelectedIds.value.includes(id));
});
const filteredBooks = computed(() => {
  const query = String(curriculumSearch.value || "")
    .trim()
    .toLocaleLowerCase();
  if (!query) return curriculumBooks.value;
  return curriculumBooks.value.filter((book) => {
    const bookTitle = String(book?.title || "").toLocaleLowerCase();
    if (bookTitle.includes(query)) return true;
    return (book?.chapters || []).some((chapter) => {
      const chapterTitle = String(chapter?.title || "").toLocaleLowerCase();
      if (chapterTitle.includes(query)) return true;
      return (chapter?.lessons || []).some((lesson) =>
        String(lesson?.title || "")
          .toLocaleLowerCase()
          .includes(query),
      );
    });
  });
});

function filteredChapters(book) {
  const query = String(curriculumSearch.value || "")
    .trim()
    .toLocaleLowerCase();
  const chapters = Array.isArray(book?.chapters) ? book.chapters : [];
  if (!query) return chapters;
  return chapters.filter((chapter) => {
    const chapterTitle = String(chapter?.title || "").toLocaleLowerCase();
    if (chapterTitle.includes(query)) return true;
    return (chapter?.lessons || []).some((lesson) =>
      String(lesson?.title || "")
        .toLocaleLowerCase()
        .includes(query),
    );
  });
}

function filteredLessons(chapter) {
  const query = String(curriculumSearch.value || "")
    .trim()
    .toLocaleLowerCase();
  const lessons = Array.isArray(chapter?.lessons) ? chapter.lessons : [];
  if (
    !query ||
    String(chapter?.title || "")
      .toLocaleLowerCase()
      .includes(query)
  )
    return lessons;
  return lessons.filter((lesson) =>
    String(lesson?.title || "")
      .toLocaleLowerCase()
      .includes(query),
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

function eventKindShortLabel(event) {
  if (event.type === "manual") return t("schedule.manualEventKindShort");
  if (event.scope === "BOOK") return t("schedule.bookExamShort");
  return t("schedule.lessonAssignmentShort");
}

function eventKindIcon(event) {
  if (event.type === "manual") return "mdi-paperclip";
  return event.scope === "BOOK"
    ? "mdi-clipboard-text-search-outline"
    : "mdi-book-open-page-variant-outline";
}

function eventSource(event) {
  if (event.type === "manual") return event.class?.name || t("schedule.manualAssignmentShort");
  if (event.scope === "BOOK") return event.book?.title || t("schedule.bookSource");
  return [event.book?.title, event.lesson?.chapter?.title, event.lesson?.title]
    .filter(Boolean)
    .join(" › ") || t("schedule.lessonSource");
}

function eventTooltip(event) {
  return t("schedule.eventTooltip", {
    title: event.title,
    source: eventSource(event),
  });
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
const dueWithinSevenDays = computed(() =>
  scheduleStore.dueWithinSevenDays(visibleEvents.value),
);
const upcomingSevenDaysCount = computed(() => dueWithinSevenDays.value.length);
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

const upcomingDisplayEvents = computed(() => {
  const selectedIds = new Set(selectedDayEvents.value.map((e) => e.id));
  return scheduleStore
    .upcomingAssignments(visibleEvents.value)
    .filter((e) => !selectedIds.has(e.id))
    .slice(0, 10);
});

function formatDayHeading(day) {
  if (!day) return t("schedule.selectDayPrompt");
  const date = day.date instanceof Date ? day.date : new Date(day.date);
  const currentYear = new Date().getFullYear();
  const dayMonth = `${date.getDate()}/${date.getMonth() + 1}`;
  if (date.getFullYear() !== currentYear) {
    return `${day.weekday}, ${dayMonth}/${date.getFullYear()}`;
  }
  return `${day.weekday}, ${dayMonth}`;
}

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
    ? expandedChapters.value.filter((item) => item !== key)
    : [...expandedChapters.value, key];
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
  const preview = document.createElement("div");
  preview.className = "curriculum-drag-preview";
  preview.style.cssText = "position:fixed;left:0;top:0;z-index:99999;max-width:360px;padding:10px 14px;border:1px solid rgba(52,124,245,.22);border-radius:12px;background:#fff;color:#193258;font:700 14px/1.35 Arial,sans-serif;box-shadow:0 8px 24px rgba(25,50,88,.18);white-space:nowrap;";
  preview.textContent = selection.type === "lesson"
    ? t("schedule.lessonDragPreview", {
        title: selection.lesson.title,
        count: lessonQuestionCount(selection.lesson),
      })
    : t("schedule.chapterDragPreview", {
        title: selection.chapter.title,
        lessons: selection.chapter.lessons?.length || 0,
        count: chapterQuestionCount(selection.chapter),
      });
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 18, 18);
  requestAnimationFrame(() => preview.remove());
}

function lessonQuestionCount(lesson) {
  return Number(lesson?._count?.questions ?? lesson?.questionCount ?? 0);
}

function chapterQuestionCount(chapter) {
  return (chapter?.lessons || []).reduce(
    (total, lesson) => total + lessonQuestionCount(lesson),
    0,
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
  curriculumForm.shuffleQuestions = false;
  curriculumForm.shuffleOptions = false;
  curriculumQuestionLessons.value = [];
  curriculumSelectedIds.value = [];
  expandedCurriculumLessons.value = selection.type === "chapter"
    ? (selection.chapter.lessons || []).map((lesson) => lesson.id)
    : [];
  for (const key of Object.keys(curriculumLessonDates)) delete curriculumLessonDates[key];
  const lessons = selection.type === "lesson" ? [selection.lesson] : selection.chapter.lessons || [];
  const spreadDates = scheduleChapterDates(date, lessons.length);
  lessons.forEach((lesson, index) => {
    curriculumLessonDates[lesson.id] = dateKey(spreadDates[index] || date);
  });
  curriculumDialog.value = true;
  loadCurriculumQuestionPreview(lessons);
}

async function loadCurriculumQuestionPreview(lessons) {
  curriculumQuestionsLoading.value = true;
  curriculumDialogError.value = "";
  try {
    curriculumQuestionLessons.value = await Promise.all(lessons.map(async (lesson) => {
      const preview = await api(`/lessons/${lesson.id}/questions-preview`);
      return { ...lesson, questions: Array.isArray(preview?.questions) ? preview.questions : [] };
    }));
    curriculumSelectedIds.value = curriculumQuestionLessons.value.flatMap((lesson) => lesson.questions.map((question) => Number(question.id)));
  } catch (error) {
    curriculumDialogError.value = error?.message || t("schedule.questionPreviewError");
  } finally {
    curriculumQuestionsLoading.value = false;
  }
}

function reloadCurriculumQuestionPreview() {
  const selection = curriculumSelection.value;
  if (!selection) return;
  const lessons = selection.type === "lesson" ? [selection.lesson] : selection.chapter.lessons || [];
  loadCurriculumQuestionPreview(lessons);
}

function curriculumSelectedForLesson(lesson) {
  return lesson.questions.filter((question) => curriculumSelectedIds.value.includes(Number(question.id)));
}

function toggleCurriculumQuestion(questionId, checked) {
  const id = Number(questionId);
  curriculumSelectedIds.value = checked
    ? [...new Set([...curriculumSelectedIds.value, id])]
    : curriculumSelectedIds.value.filter((value) => value !== id);
}

function toggleAllCurriculumQuestions() {
  curriculumSelectedIds.value = curriculumAllSelected.value
    ? []
    : curriculumQuestionLessons.value.flatMap((lesson) => lesson.questions.map((question) => Number(question.id)));
}

function spreadChapterDates() {
  const firstDate = new Date(`${curriculumForm.deadline}:00`);
  if (Number.isNaN(firstDate.getTime())) return;
  const dates = scheduleChapterDates(firstDate, curriculumQuestionLessons.value.length);
  curriculumQuestionLessons.value.forEach((lesson, index) => {
    curriculumLessonDates[lesson.id] = dateKey(dates[index]);
  });
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
    const schoolClass = calendarClasses.value.find(
      (item) => item.id === curriculumForm.classId,
    );
    const created = [];
    const failures = [];
    const selectedLessons = lessons.filter((lesson) => curriculumSelectedForLesson(
      curriculumQuestionLessons.value.find((item) => item.id === lesson.id) || { questions: [] },
    ).length > 0);
    for (const lesson of selectedLessons) {
      const chosenQuestions = curriculumSelectedForLesson(
        curriculumQuestionLessons.value.find((item) => item.id === lesson.id),
      );
      const lessonDate = curriculumLessonDates[lesson.id] || dateKey(firstDeadline);
      const time = curriculumForm.deadline.slice(11, 16) || "23:59";
      const deadline = new Date(`${lessonDate}T${time}:00`);
      if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
        failures.push({ title: lesson.title, message: t("schedule.deadlineMustBeFuture") });
        continue;
      }
      try {
        const assignment = await api("/assignments", {
          method: "POST",
          body: {
            title: lesson.title,
            scope: "LESSON",
            classId: Number(curriculumForm.classId),
            lessonId: lesson.id,
            questionIds: chosenQuestions.map((question) => Number(question.id)),
            deadline: deadline.toISOString(),
            durationMinutes:
              Number(curriculumForm.durationMinutes) || undefined,
            maxAttempts: Number(curriculumForm.maxAttempts) || 0,
            shuffleQuestions: curriculumForm.shuffleQuestions,
            shuffleOptions: curriculumForm.shuffleOptions,
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

function calendarContentKey(event) {
  return event.type === "manual"
    ? `manual-${event.manualAssignmentId}`
    : `assignment-${event.id}`;
}

function calendarContentFor(event) {
  return calendarContent[calendarContentKey(event)] || {
    loading: false,
    loaded: false,
    error: "",
    hasAttempts: false,
    questions: [],
    attachments: [],
  };
}

async function loadCalendarContent(event) {
  const key = calendarContentKey(event);
  const current = calendarContent[key] || (calendarContent[key] = {
    loading: false,
    loaded: false,
    error: "",
    hasAttempts: false,
    questions: [],
    attachments: [],
  });
  if (current.loading || current.loaded) return;
  current.loading = true;
  current.error = "";
  try {
    const details = event.type === "manual"
      ? await api(`/classes/manual-assignments/${event.manualAssignmentId}/calendar-details`)
      : await api(`/assignments/${event.id}/calendar-details`);
    current.hasAttempts = Boolean(details.hasAttempts || details.hasSubmissions);
    current.questions = details.questions || [];
    current.attachments = details.attachments || [];
    current.loaded = true;
  } catch (error) {
    current.error = error?.message || t("schedule.contentLoadError");
  } finally {
    current.loading = false;
  }
}

function questionBankTarget(event) {
  return {
    path: "/question-bank",
    query: {
      ...(event.bookId ? { bookId: String(event.bookId) } : {}),
      ...(event.lessonId ? { lessonId: String(event.lessonId) } : {}),
    },
  };
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
    const curriculumSourceBooks = Array.isArray(books) ? books : [];
    const trees = await Promise.all(
      curriculumSourceBooks.map(async (book) => {
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
    // Keep the teacher's place when the view is recreated (for example, when
    // changing browser zoom switches between the page sidebar and drawer).
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(CURRICULUM_EXPANSION_KEY) || "null",
      );
      const savedBook = trees.find((book) => book.id === saved?.bookId);
      if (savedBook) {
        expandedBooks.value = saved.bookId;
        const savedChapterKeys = Array.isArray(saved.chapterKeys)
          ? saved.chapterKeys.filter((key) =>
              (savedBook.chapters || []).some(
                (chapter) => key === chapterKey(savedBook, chapter),
              ),
            )
          : [];
        expandedChapters.value = savedChapterKeys.length
          ? savedChapterKeys
          : (savedBook.chapters || []).slice(0, 1).map((chapter) =>
              chapterKey(savedBook, chapter),
            );
      } else if (trees.length) {
        const defaultBook =
          trees.find((book) => /toán/i.test(String(book.title || ""))) ||
          trees[0];
        const defaultChapter =
          (defaultBook.chapters || []).find((chapter) =>
            /làm quen/i.test(String(chapter.title || "")),
          ) || (defaultBook.chapters || [])[0];
        expandedBooks.value = defaultBook.id;
        expandedChapters.value = defaultChapter
          ? [chapterKey(defaultBook, defaultChapter)]
          : [];
      }
    } catch {
      // Ignore unavailable or malformed saved UI state.
    }
  } catch (error) {
    curriculumError.value = error?.message || t("schedule.curriculumLoadError");
  } finally {
    curriculumLoading.value = false;
    curriculumRestored.value = true;
  }
}

function syncMobileViewport() {
  const wasCompact = isCompactLayout.value;
  isMobile.value = window.matchMedia("(max-width: 767px)").matches;
  // Keep the curriculum tree in the page at normal desktop zoom. At 1279px,
  // browser zoom could switch to the compact drawer and reset its expansion
  // state, hiding the selected book and chapter contents.
  isCompactLayout.value = window.matchMedia("(max-width: 1099px)").matches;
  if (wasCompact !== isCompactLayout.value && isTeacher.value) {
    void nextTick(() => {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(CURRICULUM_EXPANSION_KEY) || "null",
        );
        if (saved?.bookId && expandedBooks.value == null) {
          const savedBook = curriculumBooks.value.find(
            (book) => book.id === saved.bookId,
          );
          if (savedBook) {
            expandedBooks.value = saved.bookId;
            expandedChapters.value = Array.isArray(saved.chapterKeys) &&
               saved.chapterKeys.length
              ? saved.chapterKeys
              : (savedBook.chapters || []).slice(0, 1).map((chapter) =>
                  chapterKey(savedBook, chapter),
                );
          }
        }
      } catch {
        // Ignore unavailable or malformed saved UI state.
      }
    });
  }
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
  console.log("Schedule mounted");
  syncMobileViewport();
  window.addEventListener("resize", syncMobileViewport);
  void loadAssignments();
  if (isTeacher.value) void loadCurriculumBooks();
});

onUnmounted(() => window.removeEventListener("resize", syncMobileViewport));

watch(curriculumSearch, (query, previous) => {
  if (!query?.trim()) {
    // chỉ reset khi vừa xóa một từ khóa đang có
    // Keep the current expansion when clearing search.
    return;
  }

  expandedBooks.value = filteredBooks.value[0]?.id ?? null;
  expandedChapters.value = filteredBooks.value.flatMap((book) =>
    filteredChapters(book)
      .slice(0, 1)
      .map((chapter) => chapterKey(book, chapter)),
  );
});

watch([expandedBooks, expandedChapters], ([bookId, chapterKeys]) => {
  // chưa khôi phục xong thì không ghi, tránh ghi đè bằng giá trị rỗng
  if (!curriculumRestored.value) return;
  // Ignore transient empty models emitted while Vuetify swaps responsive trees.
  if (bookId == null) return;
  try {
    window.localStorage.setItem(
      CURRICULUM_EXPANSION_KEY,
      JSON.stringify({ bookId: bookId ?? null, chapterKeys }),
    );
  } catch {
    // bỏ qua nếu không có storage
  }
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
  transition: opacity 0.2s ease;
}
.teacher-today-button--current {
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
}

.teacher-schedule-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

/* Điểm 4: Chip KPI gọn ngang */
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid #e1eaf7;
  border-radius: 20px;
  background: #fff;
  white-space: nowrap;
}
.stat-chip--error {
  border-color: #fecdd3;
  background: #fff8f8;
}
.stat-chip--primary {
  border-color: #c7dcfd;
  background: #f4f8ff;
}
.stat-chip-label {
  color: #667085;
  font-size: 0.72rem;
  font-weight: 600;
}
.stat-chip-value {
  color: #172b4d;
  font-size: 0.82rem;
  font-weight: 800;
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
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.teacher-workspace.day-detail-expanded {
  grid-template-columns: 280px minmax(0, 1fr) minmax(280px, 310px);
}

.teacher-workspace.curriculum-collapsed {
  grid-template-columns: 56px minmax(0, 1fr);
}

.teacher-workspace.curriculum-collapsed.day-detail-expanded {
  grid-template-columns: 56px minmax(0, 1fr) minmax(280px, 310px);
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
  /* AppHeader height=70px + 12px gap */
  top: 82px;
  /* 100dvh - AppBar(70) - top-gap(12) - bottom-gap(12) */
  height: calc(100dvh - 94px);
  max-height: calc(100dvh - 94px);
  min-width: 0;
  width: 100%;
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
  top: 82px;
  height: fit-content;
  max-height: calc(100dvh - 94px);
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
  margin-bottom: 0;
  border-bottom: 1px solid #edf2fa;
}

.day-detail-header-two-rows {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 8px !important;
  padding: 10px 12px 10px !important;
}

.day-detail-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.day-detail-heading-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.day-detail-heading-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: #172b4d;
  line-height: 1.25;
}

.day-detail-today-badge {
  flex: 0 0 auto;
  padding: 1px 7px;
  border-radius: 10px;
  background: #2f7cf6;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.day-detail-row-action {
  width: 100%;
}

.day-detail-assign-btn {
  width: 100%;
  height: 32px !important;
  font-size: 0.78rem !important;
  font-weight: 750 !important;
  border-radius: 8px !important;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 6px rgba(47, 124, 246, 0.25) !important;
}

.day-detail-action-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
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
  display: block;
  flex: 1 1 0;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 0 6px 8px;
  scrollbar-width: thin;
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
  margin-right: 0;
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
  /* Điểm 5: padding-right đủ để badge không bị mép */
  padding: 5px 6px 5px 2px;
  overflow: visible;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #344054;
  font-size: 0.78rem;
  line-height: 1.3;
  text-align: left;
}
/* Điểm 5: badge không bị cắt mép */
.chapter-lesson-badge {
  flex: 0 0 auto !important;
  margin-left: auto;
}
.chapter-toggle:hover,
.curriculum-lesson:hover {
  background: #f3f7ff;
}
.chapter-toggle :deep(.v-chip) {
  flex: 0 0 auto;
  min-width: 20px;
  height: 20px;
  margin-right: 0;
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
.assignment-content-accordion {
  width: 100%;
  background: transparent;
}
.assignment-content-accordion :deep(.v-expansion-panel-title) {
  min-height: 38px;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}
.assignment-content-accordion :deep(.v-expansion-panel-text__wrapper) {
  padding: 10px;
}
.assignment-question-list {
  display: grid;
  max-height: 240px;
  overflow-y: auto;
}
.assignment-question-row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
  padding: 7px 0;
  border-bottom: 1px solid #edf1f7;
}
.assignment-question-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.assignment-attachment-list {
  max-height: 180px;
  overflow-y: auto;
  overflow-wrap: anywhere;
}
.question-preview-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e6edf7;
  border-radius: 12px;
}
.question-preview-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 5px 10px;
  border-bottom: 1px solid #edf1f7;
}
.question-preview-row:last-child {
  border-bottom: 0;
}
.question-preview-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}
.lesson-date-input {
  max-width: 170px;
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
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: calc(100dvh - 110px);
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

.month-grid {
  align-items: stretch;
  grid-auto-rows: minmax(96px, 1fr);
  flex: 1 1 auto;
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
  width: 100%;
  min-width: 0;
  min-height: 96px;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
  gap: 3px;
  padding: 5px 6px;
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

.month-day-cell:focus {
  outline: none;
}
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
  background: #2f7cf6;
  color: #fff;
  font-weight: 800;
}

.month-day-selected {
  z-index: 1;
  background: #edf5ff;
  box-shadow: inset 0 0 0 1.5px #2f7cf6;
}

.month-day-selected:not(.month-day-today) .month-day-number {
  background: transparent;
  color: #172b4d;
}

.month-day-selected.month-day-today .month-day-number {
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

.month-day-has-events {
  height: auto;
  min-height: min-content;
}

.month-day-event-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.month-event-slot {
  display: block;
  width: 100%;
  min-width: 0;
}

.month-event-slot :deep(.v-overlay__content) {
  white-space: normal;
}

.month-event-pill {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  gap: 1px;
  padding: 2px 4px;
  border-radius: 4px;
  background: #fff5df;
  color: #875b00;
  font-size: 0.62rem;
  line-height: 1.3;
  border-left: 3px solid var(--class-accent, transparent);
  cursor: pointer;
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
  font-size: 0.72rem;
  font-weight: 750;
  color: #374151;
  letter-spacing: -0.01em;
}

.month-event-meta-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  line-height: 1.25;
}

.month-event-kind-label {
  min-width: 0;
  overflow: hidden;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-event-status-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}

.month-event-kind-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}

.month-event-title {
  display: -webkit-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 650;
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.month-event-more {
  display: block;
  padding: 1px 5px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #2f7cf6;
  font-size: 0.65rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}
.month-event-more:hover {
  background: #edf5ff;
  text-decoration: underline;
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
  gap: 5px !important;
  padding: 8px 10px !important;
  border-radius: 10px;
}

.agenda-event-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.day-detail-panel .agenda-event-time {
  font-size: 0.72rem;
  color: #374151;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
}

.event-status-chip {
  font-weight: 800 !important;
  letter-spacing: 0.02em;
}

.agenda-event-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 5px;
  border-top: 1px dashed #edf2fa;
}

.event-action-btn {
  height: 24px !important;
  font-size: 0.68rem !important;
  font-weight: 700 !important;
  padding: 0 6px !important;
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

/* Nút Giao bài ở cột Chi tiết */
.day-detail-create-btn {
  height: 28px !important;
  font-size: 0.72rem !important;
  padding: 0 8px !important;
  border-radius: 8px !important;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.day-detail-create-text {
  font-weight: 700;
}
.day-detail-create-btn--prominent {
  background: #2f7cf6 !important;
  color: #fff !important;
  box-shadow: 0 2px 6px rgba(47, 124, 246, 0.35);
}

/* Empty state ngày được chọn */
.day-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  background: #f8fbff;
  border: 1px dashed #c9defc;
  border-radius: 12px;
  text-align: center;
}
.day-empty-title {
  font-size: 0.8rem;
  font-weight: 750;
  color: #172b4d;
  margin-top: 2px;
}
.day-empty-sub {
  font-size: 0.7rem;
  color: #667085;
  margin-top: 2px;
  line-height: 1.35;
}

/* Cây Giáo trình Rail */
.curriculum-sidebar--rail {
  height: fit-content !important;
  max-height: calc(100dvh - 94px);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.curriculum-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.curriculum-rail-toggle {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  border-radius: 10px !important;
}
.curriculum-rail-books {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  width: 100%;
  margin-top: 4px;
}
.curriculum-rail-book-btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.curriculum-rail-book-btn:hover {
  filter: brightness(0.93);
  transform: translateY(-1px);
}
.curriculum-rail-book-text {
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  line-height: 1;
}

/* Flyout panel khi rê chuột vào rail */
.curriculum-flyout-panel {
  position: absolute;
  left: 62px;
  top: 0;
  z-index: 60;
  width: 310px;
  max-height: calc(100dvh - 94px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #c9defc;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 34, 64, 0.15);
  overflow: hidden;
}
.curriculum-flyout-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px 6px;
  border-bottom: 1px solid #edf2fa;
  background: #fbfdff;
}
.curriculum-flyout-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px;
}

/* Drag handle */
.curriculum-drag-handle {
  cursor: grab;
  color: #98a2b3;
  margin-right: 1px;
  flex: 0 0 auto;
}
.curriculum-drag-handle:active {
  cursor: grabbing;
}

@media (max-width: 1099px) {
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
    gap: 4px;
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
    height: auto;
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
    min-height: 36px;
    padding: 7px 6px;
  }

  .month-event-pill {
    font-size: 0.62rem;
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
