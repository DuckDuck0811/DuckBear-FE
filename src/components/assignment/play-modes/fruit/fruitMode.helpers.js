export function getFruitClimbProgress(displayNum, totalQuestions) {
  const total = Math.max(1, Math.floor(Number(totalQuestions) || 1));
  const current = Math.min(
    total,
    Math.max(1, Math.floor(Number(displayNum) || 1)),
  );
  if (total === 1) return 1;
  return (current - 1) / (total - 1);
}

export function getFruitClimbTrackDistance(
  zoneHeight,
  squirrelHeight,
  flagTop,
  flagHeight,
  bottomGap,
) {
  return Math.max(
    0,
    zoneHeight - bottomGap - squirrelHeight - flagTop - flagHeight - 8,
  );
}

export function getFruitQuestionDuration(
  question,
  assignment,
  assignmentRemainingSeconds,
) {
  const typeDefault = ["MCQ", "MULTI_MCQ", "TRUE_FALSE"].includes(question?.type)
    ? 15
    : 60;
  const configuredSeconds = [
    question?.timeLimitSeconds,
    assignment?.questionTimeLimitSeconds,
  ]
    .map((seconds) => (seconds == null ? Number.NaN : Number(seconds)))
    .find((seconds) => Number.isFinite(seconds) && seconds > 0);
  const questionSeconds = Math.ceil(configuredSeconds ?? typeDefault);
  const remainingSeconds =
    assignmentRemainingSeconds == null
      ? Number.NaN
      : Number(assignmentRemainingSeconds);

  return Number.isFinite(remainingSeconds) && remainingSeconds >= 0
    ? Math.min(questionSeconds, Math.floor(remainingSeconds))
    : questionSeconds;
}

export function hasCompleteMatchingAnswer(question, answer) {
  const options = question?.options;
  const matches = answer?.matchAnswers;
  return (
    Array.isArray(options) &&
    options.length > 0 &&
    options.every((option) => {
      const target = matches?.[option.id];
      return target !== null && target !== undefined && String(target).trim() !== "";
    })
  );
}
