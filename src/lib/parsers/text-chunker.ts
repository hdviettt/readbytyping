const DEFAULT_TARGET_WORDS = 250;
const TOLERANCE = 0.2; // 20% tolerance for finding natural break points

// Normalize Unicode characters to ASCII typeable equivalents
const CHAR_REPLACEMENTS: [RegExp, string][] = [
  // Quotes
  [/[\u2018\u2019\u201A\u2039\u203A]/g, "'"],  // smart single quotes
  [/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"'],   // smart double quotes
  [/[\u2032]/g, "'"],                             // prime
  [/[\u2033]/g, '"'],                             // double prime
  // Dashes
  [/[\u2013\u2014\u2015]/g, "-"],                // en dash, em dash, horizontal bar
  [/[\u2012]/g, "-"],                             // figure dash
  [/[\u2212]/g, "-"],                             // minus sign
  // Spaces
  [/[\u00A0\u2007\u202F]/g, " "],               // non-breaking spaces
  [/[\u2000-\u200A]/g, " "],                     // various unicode spaces
  // Dots
  [/[\u2026]/g, "..."],                           // ellipsis
  [/[\u2024]/g, "."],                             // one dot leader
  // Other punctuation
  [/[\u2010\u2011]/g, "-"],                      // hyphens
  [/[\u00B7\u2022\u2027]/g, "-"],                // middle dot, bullet
  [/[\u00D7]/g, "x"],                            // multiplication sign
  [/[\u00F7]/g, "/"],                            // division sign
  [/[\u00BC]/g, "1/4"],                          // vulgar fraction 1/4
  [/[\u00BD]/g, "1/2"],                          // vulgar fraction 1/2
  [/[\u00BE]/g, "3/4"],                          // vulgar fraction 3/4
  [/[\u00A9]/g, "(c)"],                          // copyright
  [/[\u00AE]/g, "(R)"],                          // registered
  [/[\u2122]/g, "(TM)"],                         // trademark
  [/[\u00B0]/g, " degrees"],                     // degree sign
  // Ligatures
  [/[\uFB01]/g, "fi"],
  [/[\uFB02]/g, "fl"],
  [/[\u0152]/g, "OE"],
  [/[\u0153]/g, "oe"],
  [/[\u00C6]/g, "AE"],
  [/[\u00E6]/g, "ae"],
];

export function normalizeToAscii(text: string): string {
  let result = text;
  for (const [pattern, replacement] of CHAR_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  // Strip any remaining non-ASCII non-printable characters, keep newlines and tabs
  result = result.replace(/[^\x20-\x7E\n\t]/g, "");
  return result;
}

export interface TextChunk {
  content: string;
  wordCount: number;
  characterCount: number;
}

export function chunkText(
  text: string,
  targetWords: number = DEFAULT_TARGET_WORDS
): TextChunk[] {
  const trimmed = normalizeToAscii(text).trim();
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
