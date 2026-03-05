const DEFAULT_TARGET_WORDS = 250;
const TOLERANCE = 0.2; // 20% tolerance for finding natural break points

export interface TextChunk {
  content: string;
  wordCount: number;
  characterCount: number;
}

export function chunkText(
  text: string,
  targetWords: number = DEFAULT_TARGET_WORDS
): TextChunk[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/);
  if (words.length <= targetWords) {
    return [
      {
        content: trimmed,
        wordCount: words.length,
        characterCount: trimmed.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let currentStart = 0;

  while (currentStart < trimmed.length) {
    // Find the position of the target word count
    let wordCount = 0;
    let targetPos = currentStart;

    for (let i = currentStart; i < trimmed.length; i++) {
      if (/\s/.test(trimmed[i]) && i > currentStart && !/\s/.test(trimmed[i - 1])) {
        wordCount++;
        if (wordCount >= targetWords) {
          targetPos = i;
          break;
        }
      }
    }

    // If we didn't find enough words, take the rest
    if (wordCount < targetWords) {
      const remaining = trimmed.slice(currentStart).trim();
      if (remaining) {
        chunks.push({
          content: remaining,
          wordCount: remaining.split(/\s+/).length,
          characterCount: remaining.length,
        });
      }
      break;
    }

    // Look for natural break points near the target
    const minPos = Math.max(
      currentStart,
      Math.floor(targetPos - (targetPos - currentStart) * TOLERANCE)
    );

    let breakPos = -1;

    // Priority 1: Paragraph break (double newline) near target
    for (let i = targetPos; i >= minPos; i--) {
      if (trimmed[i] === "\n" && i > 0 && trimmed[i - 1] === "\n") {
        breakPos = i + 1;
        break;
      }
    }

    // Priority 2: Sentence end near target
    if (breakPos === -1) {
      for (let i = targetPos; i >= minPos; i--) {
        if (
          (trimmed[i] === "." || trimmed[i] === "!" || trimmed[i] === "?") &&
          i + 1 < trimmed.length &&
          /\s/.test(trimmed[i + 1])
        ) {
          breakPos = i + 2;
          break;
        }
      }
    }

    // Priority 3: Word boundary at target
    if (breakPos === -1) {
      breakPos = targetPos;
      // Advance to next whitespace to avoid cutting a word
      while (breakPos < trimmed.length && !/\s/.test(trimmed[breakPos])) {
        breakPos++;
      }
    }

    const chunkText = trimmed.slice(currentStart, breakPos).trim();
    if (chunkText) {
      chunks.push({
        content: chunkText,
        wordCount: chunkText.split(/\s+/).length,
        characterCount: chunkText.length,
      });
    }

    currentStart = breakPos;
    // Skip leading whitespace for next chunk
    while (currentStart < trimmed.length && /\s/.test(trimmed[currentStart])) {
      currentStart++;
    }
  }

  return chunks;
}
