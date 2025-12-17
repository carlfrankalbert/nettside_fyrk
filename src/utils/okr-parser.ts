/**
 * Utilities for parsing OKR review results into structured sections
 */

export interface ParsedOKRResult {
  score: number | null;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestion: string;
  isComplete: boolean;
}

/**
 * Extract numeric score from text (e.g., "8/10" or "Score: 8")
 */
export function extractScore(text: string): number | null {
  // Match patterns like "8/10", "8 av 10", "score: 8", "Score 8/10"
  const patterns = [
    /(\d+)\s*\/\s*10/i,
    /(\d+)\s+av\s+10/i,
    /score[:\s]+(\d+)/i,
    /vurdering[:\s]+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseInt(match[1], 10);
      if (score >= 1 && score <= 10) {
        return score;
      }
    }
  }
  return null;
}

/**
 * Extract bullet points from a text section
 */
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with -, *, •, or numbered like "1." or "1)"
    const bulletMatch = trimmed.match(/^[-*•]\s*(.+)$/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s*(.+)$/);

    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
    } else if (numberedMatch) {
      bullets.push(numberedMatch[1].trim());
    }
  }

  return bullets;
}

/**
 * Find a section by its header and extract content until the next section
 */
function findSection(text: string, headers: string[]): string {
  const lines = text.split('\n');
  let capturing = false;
  let content: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();

    // Check if this line starts a new section (any section header)
    const isNewSection =
      line.includes('samlet vurdering') ||
      line.includes('hva fungerer') ||
      line.includes('hva bør') ||
      line.includes('hva kan') ||
      line.includes('forslag til') ||
      line.includes('forbedret okr') ||
      /^#{1,3}\s/.test(lines[i].trim());

    // Check if this line matches our target headers
    const isTargetHeader = headers.some((h) => line.includes(h.toLowerCase()));

    if (isTargetHeader) {
      capturing = true;
      continue;
    } else if (capturing && isNewSection) {
      break;
    }

    if (capturing) {
      content.push(lines[i]);
    }
  }

  return content.join('\n').trim();
}

/**
 * Parse the full OKR review result into structured sections
 */
export function parseOKRResult(text: string): ParsedOKRResult {
  if (!text || text.trim().length === 0) {
    return {
      score: null,
      summary: '',
      strengths: [],
      improvements: [],
      suggestion: '',
      isComplete: false,
    };
  }

  // Extract score from anywhere in the text
  const score = extractScore(text);

  // Extract summary section
  const summarySection = findSection(text, ['samlet vurdering']);

  // Extract strengths
  const strengthsSection = findSection(text, ['hva fungerer', 'fungerer bra']);
  const strengths = extractBulletPoints(strengthsSection);

  // Extract improvements
  const improvementsSection = findSection(text, [
    'hva bør',
    'hva kan',
    'bør forbedres',
    'kan forbedres',
  ]);
  const improvements = extractBulletPoints(improvementsSection);

  // Extract suggestion
  const suggestionSection = findSection(text, [
    'forslag til',
    'forbedret okr',
    'omskrevet',
  ]);

  // Check if the result seems complete (has all major sections)
  const hasAllSections =
    score !== null &&
    strengths.length > 0 &&
    improvements.length > 0 &&
    suggestionSection.length > 0;

  return {
    score,
    summary: summarySection,
    strengths,
    improvements,
    suggestion: suggestionSection,
    isComplete: hasAllSections,
  };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): {
  bg: string;
  text: string;
  ring: string;
  label: string;
} {
  if (score >= 8) {
    return {
      bg: 'bg-feedback-success/10',
      text: 'text-feedback-success',
      ring: 'stroke-feedback-success',
      label: 'Utmerket',
    };
  } else if (score >= 6) {
    return {
      bg: 'bg-feedback-info/10',
      text: 'text-feedback-info',
      ring: 'stroke-feedback-info',
      label: 'God',
    };
  } else if (score >= 4) {
    return {
      bg: 'bg-feedback-warning/10',
      text: 'text-feedback-warning',
      ring: 'stroke-feedback-warning',
      label: 'Middels',
    };
  } else {
    return {
      bg: 'bg-feedback-error/10',
      text: 'text-feedback-error',
      ring: 'stroke-feedback-error',
      label: 'Trenger arbeid',
    };
  }
}
