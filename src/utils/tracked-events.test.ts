import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRACKED_BUTTONS } from '../pages/api/track';

const SRC = join(__dirname, '..');

/** Tools whose events are built from a template (`${toolName}_submit` etc.) */
const TOOL_NAMES = ['okr', 'konseptspeil', 'antakelseskart', 'premortem'];
const TEMPLATED_SUFFIXES = ['submit', 'submit_attempted', 'input_started', 'success', 'error', 'privacy_toggle'];

const LITERAL_PATTERNS = [
  /trackClick\('([a-z_]+)'\)/g,
  /logEvent\('([a-z_]+)'/g,
  /data-track-button="([a-z_]+)"/g,
  /trackingId: '([a-z_]+)'/g,
  /retryEventName: '([a-z_]+)'/g,
];

function eventIdsInSource(): Set<string> {
  const ids = new Set<string>();
  const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(tsx?|astro)$/.test(f) && !f.includes('.test.'));

  for (const file of files) {
    const text = readFileSync(join(SRC, file), 'utf8');
    for (const pattern of LITERAL_PATTERNS) {
      for (const match of text.matchAll(pattern)) ids.add(match[1]);
    }
  }
  for (const tool of TOOL_NAMES) {
    for (const suffix of TEMPLATED_SUFFIXES) ids.add(`${tool}_${suffix}`);
  }
  return ids;
}

describe('TRACKED_BUTTONS', () => {
  // Regression: unknown IDs used to fall back to okr_submit, inflating the OKR funnel
  it('knows every event ID the client sends', () => {
    const unknown = [...eventIdsInSource()].filter((id) => !(id in TRACKED_BUTTONS));
    expect(unknown).toEqual([]);
  });

  it('uses a distinct KV key per event', () => {
    const keys = Object.values(TRACKED_BUTTONS).map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
