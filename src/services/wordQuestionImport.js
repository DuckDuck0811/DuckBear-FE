export async function parseWordQuestionFile(file) {
  const mammothModule = await import("mammoth/mammoth.browser");
  const mammoth = mammothModule.default || mammothModule;
  const { value: html } = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  return parseWordQuestions(markBoldAnswersInText(html));
}

function markBoldAnswersInText(html) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return [...document.body.querySelectorAll("p, h1, h2, h3, li")]
    .map((paragraph) => {
      const text = paragraph.textContent.replace(/\s+/g, " ").trim();
      const option = text.match(/^([A-D])[.)]\s*/);
      if (!option) return text;
      const prefixLength = option[0].length;
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let boldAnswer = false;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeText = node.textContent || "";
        const bold = Boolean(node.parentElement?.closest("strong, b"));
        const bodyStart = Math.max(0, prefixLength - offset);
        if (
          bold &&
          offset + nodeText.length > prefixLength &&
          nodeText.slice(bodyStart).trim()
        )
          boldAnswer = true;
        offset += nodeText.length;
      }
      return boldAnswer
        ? `${option[1]}. [[CORRECT]]${text.slice(prefixLength)}`
        : text;
    })
    .filter(Boolean)
    .join("\n");
}

function parseWordQuestions(rawText) {
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0111/g, "d")
      .replace(/\u0110/g, "D")
      .toLocaleLowerCase();
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const answerSection = lines.findIndex((line) =>
    /^(?:dap an(?: tham khao)?|answer keys?)\b/i.test(normalize(line)),
  );
  const answerKeys = new Map();
  if (answerSection >= 0) {
    for (const line of lines.slice(answerSection)) {
      const keyPattern =
        /(?:(?:question|cau)\s*)?(\d{1,2})\s*[.):\-]?\s*([a-d])(?=\s|$|[|0-9])/gi;
      for (const match of normalize(line).matchAll(keyPattern)) {
        answerKeys.set(Number(match[1]), match[2].toUpperCase());
      }
    }
  }

  const contentLines =
    answerSection >= 0 ? lines.slice(0, answerSection) : lines;
  const startPattern = /^(?:(?:question|cau)\s*)?(\d+)\s*[.):\-]\s*(.*)$/i;
  const starts = contentLines
    .map((line, index) => (startPattern.test(normalize(line)) ? index : -1))
    .filter((index) => index >= 0);
  const contextByQuestion = new Map();
  contentLines.forEach((line, index) => {
    const range = normalize(line).match(
      /(?:questions?|blanks) from\s+(\d+)\s+to\s+(\d+)/i,
    );
    if (!range) return;
    const firstQuestion = starts.find((questionIndex) => {
      if (questionIndex <= index) return false;
      const match = normalize(contentLines[questionIndex]).match(startPattern);
      const number = Number(match?.[1]);
      return number >= Number(range[1]) && number <= Number(range[2]);
    });
    if (firstQuestion === undefined) return;
    const context = contentLines.slice(index, firstQuestion).join("\n").trim();
    for (
      let number = Number(range[1]);
      number <= Number(range[2]);
      number += 1
    ) {
      contextByQuestion.set(number, context);
    }
  });

  return starts
    .map((start, position) => {
      const end = starts[position + 1] ?? contentLines.length;
      const section = contentLines.slice(start, end);
      const startMatch = normalize(section[0]).match(startPattern);
      const number = Number(startMatch?.[1]);
      const body = [startMatch?.[2] || "", ...section.slice(1)].filter(Boolean);
      const optionPattern = /^([A-F])[.)]\s*(.+)$/;
      const firstOption = body.findIndex((line) => optionPattern.test(line));
      const promptLines = firstOption < 0 ? body : body.slice(0, firstOption);
      const questionPrompt = promptLines.join("\n").trim();
      const sharedContext = contextByQuestion.get(number);
      const prompt = [`Question ${number}.`, sharedContext, questionPrompt]
        .filter(Boolean)
        .join("\n\n")
        .trim();
      const options = [];
      let answer = answerKeys.get(number);

      for (const line of firstOption < 0 ? [] : body.slice(firstOption)) {
        const inlineAnswer = normalize(line).match(
          /^(?:dap an|answer)\s*[:\-]\s*([a-f])\b/i,
        );
        if (inlineAnswer) {
          answer = inlineAnswer[1].toUpperCase();
          continue;
        }
        const option = line.match(optionPattern);
        if (option) {
          const boldCorrect = option[2].includes("[[CORRECT]]");
          options.push({
            content: option[2].replace("[[CORRECT]]", "").trim(),
            isCorrect: boldCorrect,
            label: option[1].toUpperCase(),
          });
        }
      }

      if (options.length >= 2) {
        const correctAnswer =
          answer || options.find((option) => option.isCorrect)?.label;
        if (!options.some((option) => option.label === correctAnswer))
          return null;
        return {
          type: "MCQ",
          difficulty: "MEDIUM",
          content: prompt || `Question ${number}`,
          options: options.map(({ label, ...option }) => ({
            ...option,
            isCorrect: label === correctAnswer,
          })),
        };
      }
      return prompt
        ? {
            type: "ESSAY",
            difficulty: "MEDIUM",
            content: prompt,
            answerText: body.slice(promptLines.length).join("\n"),
          }
        : null;
    })
    .filter((question) => question?.content);
}
