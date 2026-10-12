import { ParsedVocabularyItem } from '../types/weeklyPlan';

/**
 * Intelligent parser for classroom notes and vocabulary lists.
 * Handles patterns such as:
 * - "schedule - agendar / eskedul - confundi com timetable na aula"
 * - "actually = na verdade (não é atualmente)"
 * - "look forward to : aguardar ansiosamente (+ verb-ing) / luk foruard tu"
 * - "overwhelmed - sobrecarregado"
 * - "put off: adiar / post-pone"
 * - "fall for (se apaixonar por) - confundi preposição in"
 * - Plain lists: "commitment, crush, ghost someone"
 */
export function parseClassNotes(rawText: string): ParsedVocabularyItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Split by line breaks first, or if single line with many commas and no line breaks, split on commas
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedVocabularyItem[] = [];
  let idCounter = 1;

  for (const line of lines) {
    // If the line contains multiple comma-separated words with no punctuation notes, e.g. "word1, word2, word3"
    // check if it has definitions (dash, colon, equals, parens)
    const hasDefinitionSyntax = /[-:=/()]/.test(line);

    if (!hasDefinitionSyntax && line.includes(',')) {
      const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        const cleaned = cleanWord(part);
        if (cleaned) {
          results.push({
            id: `vocab_${Date.now()}_${idCounter++}`,
            english: cleaned,
          });
        }
      }
      continue;
    }

    // Clean leading bullets, numbers (e.g. "1.", "- ", "• ")
    const strippedLine = line.replace(/^[-*•·\d+.)\]\s]+/, '').trim();
    if (!strippedLine) continue;

    // Pattern 1: Parens right after English: e.g. "fall for (se apaixonar por) - confundi a preposição"
    const parenMatch = strippedLine.match(/^([^(]+?)\s*\(([^)]+)\)\s*(?:[-–—:]\s*(.*))?$/);
    if (parenMatch) {
      const english = cleanWord(parenMatch[1]);
      const meaningOrPron = parenMatch[2].trim();
      const extraNote = parenMatch[3]?.trim();

      if (english) {
        const isPron = looksLikePronunciation(meaningOrPron);
        results.push({
          id: `vocab_${Date.now()}_${idCounter++}`,
          english,
          portuguese: isPron ? undefined : meaningOrPron,
          pronunciation: isPron ? meaningOrPron : undefined,
          note: extraNote,
        });
        continue;
      }
    }

    // Pattern 2: Split by dashes or colons or equals: "schedule - agendar / eskedul - confundi na aula"
    // Split by major delimiter (- , : , = )
    const mainParts = strippedLine.split(/\s*[-–—:=]\s*/);
    if (mainParts.length >= 2) {
      const english = cleanWord(mainParts[0]);
      const rest = mainParts.slice(1).join(' - ');

      // In rest, check for slash '/' which often separates translation from pronunciation or note
      let portuguese: string | undefined;
      let pronunciation: string | undefined;
      let note: string | undefined;

      const slashParts = rest.split(/\s*\/\s*/);
      if (slashParts.length >= 2) {
        portuguese = slashParts[0].trim();
        const secondPart = slashParts[1].trim();

        if (looksLikePronunciation(secondPart)) {
          pronunciation = secondPart;
          if (slashParts.length > 2) {
            note = slashParts.slice(2).join(' / ').trim();
          }
        } else if (looksLikeNote(secondPart)) {
          note = secondPart;
        } else {
          // might be alternative translation or synonym
          portuguese = `${portuguese} (${secondPart})`;
        }

        // If there were additional dash parts originally:
        if (mainParts.length > 2) {
          const trailing = mainParts.slice(2).join(' - ').trim();
          note = note ? `${note}; ${trailing}` : trailing;
        }
      } else {
        // Just "schedule - agendar" or "schedule - agendar (eskédul)"
        const subParen = rest.match(/^(.*?)\s*\((.*?)\)$/);
        if (subParen) {
          portuguese = subParen[1].trim();
          const insideParen = subParen[2].trim();
          if (looksLikePronunciation(insideParen)) {
            pronunciation = insideParen;
          } else {
            note = insideParen;
          }
        } else {
          // Check if rest is note or translation
          if (looksLikeNote(rest)) {
            note = rest;
          } else {
            portuguese = rest;
          }
        }
      }

      if (english) {
        results.push({
          id: `vocab_${Date.now()}_${idCounter++}`,
          english,
          portuguese: portuguese || undefined,
          pronunciation: pronunciation || undefined,
          note: note || undefined,
        });
        continue;
      }
    }

    // Fallback: If line doesn't match complex pattern, take it as clean English expression
    const fallbackWord = cleanWord(strippedLine);
    if (fallbackWord) {
      results.push({
        id: `vocab_${Date.now()}_${idCounter++}`,
        english: fallbackWord,
      });
    }
  }

  // Deduplicate by english term (case-insensitive)
  const seen = new Set<string>();
  const uniqueResults: ParsedVocabularyItem[] = [];
  for (const item of results) {
    const key = item.english.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

function cleanWord(str: string): string {
  return str
    .replace(/^["'`“]+|["'`”]+$/g, '')
    .replace(/[.,;]+$/, '')
    .trim();
}

function looksLikePronunciation(text: string): boolean {
  const t = text.toLowerCase();
  // Contains phonetic symbols, slashes, or typical pt-phonetic spellings (eskedul, aktchuali, etc)
  if (/^[a-zçáàãâéêíóôõúü'\s-]+$/i.test(text) && text.split(/\s+/).length <= 3) {
    if (
      t.startsWith('es') ||
      t.includes('sh') ||
      t.includes('tch') ||
      t.includes('dj') ||
      t.includes('ou') ||
      t.includes('pron:') ||
      t.includes('pronúncia') ||
      t.includes('som de')
    ) {
      return true;
    }
  }
  return false;
}

function looksLikeNote(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('confundi') ||
    t.includes('errei') ||
    t.includes('aula') ||
    t.includes('atenção') ||
    t.includes('cuidado') ||
    t.includes('dica') ||
    t.includes('obs') ||
    t.includes('preposição') ||
    t.includes('professor') ||
    t.includes('+ verb') ||
    t.includes('não usar')
  );
}
