/**
 * Parser for Konseptspeilet v2 structured output format
 */

import type {
  ParsedKonseptSpeilResultV2,
  Summary,
  Dimension,
  DimensionType,
  DimensionStatus,
  ExplorationLevel,
} from '../types/konseptspeil-v2';
import { EXPLORATION_LABELS } from '../types/konseptspeil-v2';

/**
 * Extract content between delimiters
 */
function extractSection(text: string, startDelimiter: string, endDelimiter: string): string | null {
  const startPattern = new RegExp(`${startDelimiter}\\s*\\n?`, 'i');
  const endPattern = new RegExp(`\\n?\\s*${endDelimiter}`, 'i');

  const startMatch = text.match(startPattern);
  if (!startMatch) return null;

  const startIndex = startMatch.index! + startMatch[0].length;
  const afterStart = text.slice(startIndex);

  const endMatch = afterStart.match(endPattern);
  if (!endMatch) return null;

  return afterStart.slice(0, endMatch.index).trim();
}

/**
 * Parse the summary section
 */
function parseSummary(text: string): Summary | null {
  const summaryContent = extractSection(text, '---SUMMARY---', '---END_SUMMARY---');
  if (!summaryContent) return null;

  const lines = summaryContent.split('\n');
  const data: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  }

  const assumptionCount = parseInt(data.assumptions || '0', 10) || 0;
  const unclearCount = parseInt(data.unclear || '0', 10) || 0;
  // Support both 'exploration' (new) and 'maturity' (legacy) fields
  const explorationRaw = parseInt(data.exploration || data.maturity || '1', 10);
  const explorationLevel = (Math.min(5, Math.max(1, explorationRaw)) as ExplorationLevel);
  // Support both 'conditional_step' (new) and 'recommendation' (legacy)
  const conditionalStep = data.conditional_step || data.recommendation || '';

  return {
    assumptionCount,
    unclearCount,
    explorationLevel,
    explorationLabel: EXPLORATION_LABELS[explorationLevel],
    conditionalStep,
    // Backward compatibility
    maturityLevel: explorationLevel,
    maturityLabel: EXPLORATION_LABELS[explorationLevel],
    recommendation: conditionalStep,
  };
}

/**
 * Parse dimension status from string
 */
function parseDimensionStatus(value: string): DimensionStatus {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'described') return 'described';
  if (normalized === 'assumed') return 'assumed';
  return 'not_addressed';
}

/**
 * Parse key:value pairs from content, handling both newline-separated and single-line formats
 */
function parseKeyValuePairs(content: string): Record<string, string> {
  const data: Record<string, string> = {};

  // First try normal newline-separated parsing
  const lines = content.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  }

  // Check if we got valid dimension data
  const hasValidDimensions = ['value', 'usability', 'feasibility', 'viability'].some(
    dim => data[dim] && ['assumed', 'described', 'not_addressed'].includes(data[dim].toLowerCase())
  );

  // If normal parsing didn't work, try to parse as single line with multiple key:value pairs
  if (!hasValidDimensions && content.includes(':')) {
    // Pattern: "key1: value1 key2: value2" or "key1: value1key2: value2"
    // Known keys in dimensions section
    const knownKeys = [
      'value', 'value_desc',
      'usability', 'usability_desc',
      'feasibility', 'feasibility_desc',
      'viability', 'viability_desc'
    ];

    // Build regex to split by known keys
    const keyPattern = new RegExp(`\\b(${knownKeys.join('|')})\\s*:`, 'gi');
    const matches: { key: string; index: number }[] = [];

    let match;
    while ((match = keyPattern.exec(content)) !== null) {
      matches.push({ key: match[1].toLowerCase(), index: match.index });
    }

    // Extract values between keys
    for (let i = 0; i < matches.length; i++) {
      const key = matches[i].key;
      const startIndex = matches[i].index + key.length + 1; // +1 for the colon
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const value = content.slice(startIndex, endIndex).trim();
      data[key] = value;
    }
  }

  return data;
}

/**
 * Parse the dimensions section
 */
function parseDimensions(text: string): Dimension[] {
  const dimensionsContent = extractSection(text, '---DIMENSIONS---', '---END_DIMENSIONS---');
  if (!dimensionsContent) return [];

  const data = parseKeyValuePairs(dimensionsContent);

  const dimensionTypes: DimensionType[] = ['value', 'usability', 'feasibility', 'viability'];
  const dimensions: Dimension[] = [];

  for (const type of dimensionTypes) {
    const status = parseDimensionStatus(data[type] || 'not_addressed');
    const description = data[`${type}_desc`] || '';

    dimensions.push({
      type,
      status,
      description,
    });
  }

  return dimensions;
}

/**
 * Extract bullet points from a section
 * Handles both proper newline-separated bullets and malformed single-line bullets
 */
function extractBulletPoints(content: string): string[] {
  const lines = content.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      let text = trimmed.slice(2).trim();

      // Check if multiple bullets are on the same line (malformed response)
      // Pattern: "Question 1?- Question 2?- Question 3?"
      if (text.includes('?- ') || text.includes('.- ')) {
        // Split by common patterns where a new bullet starts mid-line
        const parts = text.split(/(?<=\?|\.)- /);
        for (const part of parts) {
          const cleaned = part.trim();
          if (cleaned) {
            bullets.push(cleaned);
          }
        }
      } else if (text) {
        bullets.push(text);
      }
    }
  }

  return bullets;
}

/**
 * Parse the assumptions section
 */
function parseAssumptions(text: string): string[] {
  const content = extractSection(text, '---ASSUMPTIONS---', '---END_ASSUMPTIONS---');
  if (!content) return [];
  return extractBulletPoints(content);
}

/**
 * Parse the questions section
 */
function parseQuestions(text: string): string[] {
  const content = extractSection(text, '---QUESTIONS---', '---END_QUESTIONS---');
  if (!content) return [];
  return extractBulletPoints(content);
}

/**
 * Create a default empty summary
 */
function createDefaultSummary(assumptionCount = 0): Summary {
  return {
    assumptionCount,
    unclearCount: 0,
    explorationLevel: 1,
    explorationLabel: EXPLORATION_LABELS[1],
    conditionalStep: '',
    // Backward compatibility
    maturityLevel: 1,
    maturityLabel: EXPLORATION_LABELS[1],
    recommendation: '',
  };
}

/**
 * Parse the v2 KonseptSpeil result from raw output
 */
export function parseKonseptSpeilResultV2(text: string): ParsedKonseptSpeilResultV2 {
  if (!text || text.trim().length === 0) {
    return {
      summary: createDefaultSummary(),
      dimensions: [],
      antagelser: [],
      sporsmal: [],
      priorityExploration: null,
      isComplete: false,
      parseError: null,
    };
  }

  try {
    const summary = parseSummary(text);
    const dimensions = parseDimensions(text);
    const antagelser = parseAssumptions(text);
    const sporsmal = parseQuestions(text);

    // Check completeness - need at least summary, one dimension, one assumption, one question
    const isComplete =
      summary !== null &&
      dimensions.length === 4 &&
      antagelser.length > 0 &&
      sporsmal.length > 0;

    // Priority exploration is the first question (or first assumption if no questions)
    const priorityExploration = sporsmal[0] || antagelser[0] || null;

    return {
      summary: summary || createDefaultSummary(antagelser.length),
      dimensions,
      antagelser,
      sporsmal,
      priorityExploration,
      isComplete,
      parseError: null,
    };
  } catch (error) {
    console.error('Failed to parse KonseptSpeil v2 result:', error);
    return {
      summary: createDefaultSummary(),
      dimensions: [],
      antagelser: [],
      sporsmal: [],
      priorityExploration: null,
      isComplete: false,
      parseError: 'Kunne ikke tolke svaret',
    };
  }
}

/**
 * Check if the result has any meaningful content (for streaming display)
 */
export function hasContentV2(result: ParsedKonseptSpeilResultV2): boolean {
  return (
    result.summary.conditionalStep.length > 0 ||
    result.dimensions.length > 0 ||
    result.antagelser.length > 0 ||
    result.sporsmal.length > 0
  );
}

/**
 * Check if the response text contains v2 format markers (for streaming detection)
 */
export function isV2Format(text: string): boolean {
  return text.includes('---SUMMARY---') || text.includes('---DIMENSIONS---');
}
