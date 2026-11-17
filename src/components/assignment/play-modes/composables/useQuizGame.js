import { computed, onMounted, ref, watch } from 'vue';

const SOUND_PREF_KEY = 'duckbear_quiz_sound';

// Web Audio API Synthesizer (không cần load file mp3 bên ngoài, không lo lỗi 404)
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
  }

  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainLevel = 0.15) {
    if (!this.unlocked || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    } catch {
      // Bỏ qua lỗi audio trình duyệt hạn chế
    }
  }

  playSweep(startFreq, endFreq, type = 'sine', duration = 0.3) {
    if (!this.unlocked || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignored
    }
  }

  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0, 0.2);     // C5
    this.playTone(659.25, 'triangle', 0.14, 0.08, 0.22); // E5
    this.playTone(783.99, 'triangle', 0.22, 0.16, 0.25); // G5
  }

  playWrong() {
    this.playTone(240, 'sawtooth', 0.18, 0, 0.15);
    this.playTone(190, 'sawtooth', 0.25, 0.12, 0.18);
  }

  playClick() {
    this.playTone(750, 'sine', 0.04, 0, 0.08);
  }

  playBoost() {
    this.playSweep(180, 720, 'triangle', 0.35);
  }

  playFinish() {
    this.playTone(523.25, 'triangle', 0.15, 0, 0.2);
    this.playTone(659.25, 'triangle', 0.15, 0.12, 0.2);
    this.playTone(783.99, 'triangle', 0.15, 0.24, 0.2);
    this.playTone(1046.50, 'triangle', 0.45, 0.36, 0.3); // C6
  }
}

const synthesizer = new SoundSynthesizer();

export function useQuizGame(session, options = {}) {
  const isSoundEnabled = ref(localStorage.getItem(SOUND_PREF_KEY) !== 'false');
  const hasUserInteracted = ref(false);

  const combo = ref(0);
  const maxCombo = ref(0);
  const checkFeedback = ref(null); // 'correct' | 'wrong' | null
  const isChecking = ref(false);
  const networkError = ref(null);
  const isComplete = ref(false);

  const prefersReducedMotion = ref(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Tổng số câu hỏi
  const totalQuestions = computed(() => session.totalQuestions?.value || 1);
  const currentIndex = computed(() => session.currentIndex?.value || 0);
  const displayNum = computed(() => currentIndex.value + 1);
  const currentQuestionItem = computed(() => session.currentQuestionItem?.value);

  // Tính số sao (sao = số câu đã check đúng)
  const stars = computed(() => {
    const checked = session.checkedQuestions || {};
    return Object.values(checked).filter((c) => c && c.isCorrect === true).length;
  });

  // Điểm số hiển thị (Visual score)
  const scoreDisplay = computed(() => {
    return stars.value * 10 + maxCombo.value * 2;
  });

  // Khởi động âm thanh khi người dùng tương tác lần đầu
  function onUserInteraction() {
    if (!hasUserInteracted.value) {
      hasUserInteracted.value = true;
      synthesizer.unlock();
    }
  }

  function toggleSound() {
    onUserInteraction();
    isSoundEnabled.value = !isSoundEnabled.value;
    localStorage.setItem(SOUND_PREF_KEY, String(isSoundEnabled.value));
    if (isSoundEnabled.value) {
      synthesizer.playClick();
    }
  }

  function playSfx(type) {
    if (!isSoundEnabled.value) return;
    onUserInteraction();
    switch (type) {
      case 'correct':
        synthesizer.playCorrect();
        break;
      case 'wrong':
        synthesizer.playWrong();
        break;
      case 'click':
        synthesizer.playClick();
        break;
      case 'boost':
        synthesizer.playBoost();
        break;
      case 'finish':
        synthesizer.playFinish();
        break;
    }
  }

  // Gửi câu trả lời và kiểm tra đúng/sai qua session
  async function submitAndCheck(questionId, answerPatch, { onResolved, delayNext = 1200 } = {}) {
    if (!questionId || isChecking.value) return null;

    onUserInteraction();
    isChecking.value = true;
    checkFeedback.value = null;
    networkError.value = null;

    if (answerPatch) {
      session.setAnswer(questionId, answerPatch);
    }

    try {
      const result = await session.checkQuestion(questionId);
      const isCorrect = result?.isCorrect === true;

      if (isCorrect) {
        combo.value += 1;
        if (combo.value > maxCombo.value) maxCombo.value = combo.value;
        checkFeedback.value = 'correct';
        playSfx('correct');
      } else {
        combo.value = 0;
        checkFeedback.value = 'wrong';
        playSfx('wrong');
      }

      if (typeof onResolved === 'function') {
        onResolved(isCorrect, result);
      }

      // Thời gian chờ hiệu ứng hoạt hình trước khi chuyển câu
      const delay = prefersReducedMotion.value ? 300 : delayNext;
      setTimeout(() => {
        checkFeedback.value = null;
        if (!session.isLastQuestion?.value) {
          session.next();
        } else {
          isComplete.value = true;
          playSfx('finish');
        }
      }, delay);

      return result;
    } catch (err) {
      networkError.value = err?.message || 'Có lỗi kết nối mạng, vui lòng thử lại!';
      playSfx('wrong');
      return null;
    } finally {
      isChecking.value = false;
    }
  }

  // Khôi phục trạng thái từ checkedQuestions khi load lại trang
  function restoreState() {
    const checked = session.checkedQuestions || {};
    const checkedCount = Object.keys(checked).length;
    const questions = session.questions.value || [];

    const firstUnansweredIndex = questions.findIndex(
      ({ question }) => !checked[String(question.id)]
    );

    if (firstUnansweredIndex >= 0) {
      session.goTo(firstUnansweredIndex);
    } else if (checkedCount > 0 && checkedCount === questions.length) {
      isComplete.value = true;
    }
  }

  onMounted(() => {
    restoreState();
  });

  return {
    isSoundEnabled,
    hasUserInteracted,
    combo,
    maxCombo,
    stars,
    scoreDisplay,
    checkFeedback,
    isChecking,
    networkError,
    isComplete,
    prefersReducedMotion,
    totalQuestions,
    currentIndex,
    displayNum,
    currentQuestionItem,
    toggleSound,
    playSfx,
    onUserInteraction,
    submitAndCheck,
    restoreState,
  };
}
