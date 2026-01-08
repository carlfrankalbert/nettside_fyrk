/**
 * Parser for Konseptspeilet v2 structured output format
 */

import type {
  ParsedKonseptSpeilResultV2,
  Summary,
  Dimension,
  DimensionType,
  DimensionStatus,
  MaturityLevel,
} from '../types/konseptspeil-v2';
import { MATURITY_LABELS } from '../types/konseptspeil-v2';

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
  const maturityRaw = parseInt(data.maturity || '1', 10);
  const maturityLevel = (Math.min(5, Math.max(1, maturityRaw)) as MaturityLevel);
  const recommendation = data.recommendation || '';

  return {
    assumptionCount,
    unclearCount,
    maturityLevel,
    maturityLabel: MATURITY_LABELS[maturityLevel],
    recommendation,
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
 * Parse the dimensions section
 */
function parseDimensions(text: string): Dimension[] {
  const dimensionsContent = extractSection(text, '---DIMENSIONS---', '---END_DIMENSIONS---');
  if (!dimensionsContent) return [];

  const lines = dimensionsContent.split('\n');
  const data: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  }

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
 */
function extractBulletPoints(content: string): string[] {
  const lines = content.split('\n');
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.slice(2).trim();
      if (text) {
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
 * Parse the v2 KonseptSpeil result from raw output
 */
export function parseKonseptSpeilResultV2(text: string): ParsedKonseptSpeilResultV2 {
  if (!text || text.trim().length === 0) {
    return {
      summary: {
        assumptionCount: 0,
        unclearCount: 0,
        maturityLevel: 1,
        maturityLabel: MATURITY_LABELS[1],
        recommendation: '',
      },
      dimensions: [],
      antagelser: [],
      sporsmal: [],
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

    return {
      summary: summary || {
        assumptionCount: antagelser.length,
        unclearCount: 0,
        maturityLevel: 1,
        maturityLabel: MATURITY_LABELS[1],
        recommendation: '',
      },
      dimensions,
      antagelser,
      sporsmal,
      isComplete,
      parseError: null,
    };
  } catch (error) {
    console.error('Failed to parse KonseptSpeil v2 result:', error);
    return {
      summary: {
        assumptionCount: 0,
        unclearCount: 0,
        maturityLevel: 1,
        maturityLabel: MATURITY_LABELS[1],
        recommendation: '',
      },
      dimensions: [],
      antagelser: [],
      sporsmal: [],
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
    result.summary.recommendation.length > 0 ||
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
