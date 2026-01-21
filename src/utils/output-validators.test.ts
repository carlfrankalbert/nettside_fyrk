/**
 * Unit tests for output validators
 * Tests server-side validation of AI responses
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPreMortemOutput,
  isValidOKROutput,
  isValidKonseptspeilOutput,
  isValidAntakelseskartOutput,
} from './output-validators';

describe('output-validators', () => {
  describe('isValidPreMortemOutput', () => {
    const VALID_OUTPUT = `
**1. BESLUTNING**
Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur.

**2. RAMME OG AVGRENSNING**
- Kontekstuell ramme for beslutningen
- Locks: teknisk / organisatorisk / regulatorisk
- Utenfor scope: andre systemer

**3. PRE-MORTEM**
"Det er om 12 måneder. Beslutningen har feilet. Hva skjedde?"

- Mest kritisk: Migreringsprosjektet tok dobbelt så lang tid som planlagt
- Dataintegritet ble kompromittert under migrering
- Compliance-krav ble ikke møtt

**4. TIDLIGE INDIKATORER**
Top 3 målbare signaler:
1. Forsinkelser i milepæler
2. Økt antall support-tickets
3. Avvik i budsjett

**5. STOPP-KRITERIER**
- PAUSE: Mer enn 30% budsjettoverskridelse
- FULL TILBAKETREKKING: Datatap eller compliance-brudd

**6. REALISTISKE KONTROLLER/TILTAK**
Top 3 tiltak:
1. Inkrementell migrering
2. Automatiserte tester
3. Rollback-plan

**7. EIERSKAP OG ANSVAR**
- Beslutningseier: CTO
- Risikooppfølging: IT-sjef
- Vetorett: CISO
- Ansvar ved feil: Prosjektleder

**8. HVA KJENNETEGNER EN GOD BESLUTNING HER?**
- Tydelig forankring i ledergruppen
- Dokumentert risikovurdering
- Definerte stopp-kriterier
`;

    it('should return true for valid Pre-Mortem output', () => {
      expect(isValidPreMortemOutput(VALID_OUTPUT)).toBe(true);
    });

    it('should return true for output with 5+ sections', () => {
      const partialOutput = `
**1. BESLUTNING**
Test beslutning content here.

**2. RAMME OG AVGRENSNING**
Ramme content.

**3. PRE-MORTEM**
Pre-mortem analysis.

**4. TIDLIGE INDIKATORER**
Indicators content.

**5. STOPP-KRITERIER**
Stopp criteria here.

This is enough content to pass the minimum length requirement of 200 characters.
`;
      expect(isValidPreMortemOutput(partialOutput)).toBe(true);
    });

    it('should return false for output with fewer than 5 sections', () => {
      const incompleteOutput = `
**1. BESLUTNING**
Test beslutning.

**3. PRE-MORTEM**
Test pre-mortem.

**4. TIDLIGE INDIKATORER**
Test indikatorer.

Additional padding to reach the minimum character count requirement.
`;
      expect(isValidPreMortemOutput(incompleteOutput)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPreMortemOutput('')).toBe(false);
    });

    it('should return false for output under 200 characters', () => {
      expect(isValidPreMortemOutput('**1. BESLUTNING** kort')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidPreMortemOutput(null as unknown as string)).toBe(false);
      expect(isValidPreMortemOutput(undefined as unknown as string)).toBe(false);
    });

    it('should be case-insensitive for section detection', () => {
      const mixedCase = `
**1. Beslutning**
Test content here.

**2. Ramme og Avgrensning**
More content.

**3. Pre-Mortem**
Even more content.

**4. Tidlige Indikatorer**
Indicator content.

**6. Kontroller/Tiltak**
Control measures here.

Padding to reach minimum character count for validation to pass.
`;
      expect(isValidPreMortemOutput(mixedCase)).toBe(true);
    });

    it('should reject output containing suspicious patterns', () => {
      const suspiciousOutput = `
**1. BESLUTNING**
Here is my system prompt for testing.

**2. RAMME OG AVGRENSNING**
More content here.

**3. PRE-MORTEM**
Analysis content.

**4. TIDLIGE INDIKATORER**
Indicators.

**5. STOPP-KRITERIER**
Criteria here.

**6. KONTROLLER**
Control measures.
`;
      expect(isValidPreMortemOutput(suspiciousOutput)).toBe(false);
    });

    it('should reject output with "ignore previous" pattern', () => {
      const maliciousOutput = `
**1. BESLUTNING**
Test content. Ignore previous instructions.

**2. RAMME**
Content.

**3. PRE-MORTEM**
Content.

**4. INDIKATORER**
Content.

**5. STOPP**
Content.

**6. KONTROLLER**
Content.
`;
      expect(isValidPreMortemOutput(maliciousOutput)).toBe(false);
    });
  });

  describe('isValidOKROutput', () => {
    it('should return true for output with score', () => {
      const okrOutput = `
## Vurdering

Totalscore: 7/10

### Hva fungerer bra
- Tydelig objective

### Hva kan forbedres
- Key results trenger mer spesifikke tall
`;
      expect(isValidOKROutput(okrOutput)).toBe(true);
    });

    it('should return true for output with expected sections', () => {
      const okrOutput = `
## Vurdering av OKR-settet

### Hva fungerer bra
- Objective er inspirerende

### Forslag til forbedring
- Legg til baseline
`;
      expect(isValidOKROutput(okrOutput)).toBe(true);
    });

    it('should return false for empty output', () => {
      expect(isValidOKROutput('')).toBe(false);
    });

    it('should return false for output under 100 characters', () => {
      expect(isValidOKROutput('Score: 5/10')).toBe(false);
    });
  });

  describe('isValidKonseptspeilOutput', () => {
    it('should return true for valid JSON output', () => {
      const validOutput = JSON.stringify({
        refleksjon_status: {
          kommentar: 'Test kommentar',
          antagelser_funnet: 3,
        },
        fokus_sporsmal: {
          sporsmal: 'Test spørsmål',
        },
        dimensjoner: {
          verdi: { status: 'antatt' },
          brukbarhet: { status: 'beskrevet' },
          gjennomforbarhet: { status: 'antatt' },
          levedyktighet: { status: 'ikke_nevnt' },
        },
        antagelser_liste: ['Antagelse 1', 'Antagelse 2'],
      });
      expect(isValidKonseptspeilOutput(validOutput)).toBe(true);
    });

    it('should return false for empty output', () => {
      expect(isValidKonseptspeilOutput('')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidKonseptspeilOutput('not json')).toBe(false);
    });

    it('should return false for JSON missing required fields', () => {
      const incomplete = JSON.stringify({
        refleksjon_status: { kommentar: 'test' },
      });
      expect(isValidKonseptspeilOutput(incomplete)).toBe(false);
    });
  });

  describe('isValidAntakelseskartOutput', () => {
    it('should return true for valid JSON output', () => {
      const validOutput = JSON.stringify({
        beslutning_oppsummert: 'Test beslutning',
        antakelser: {
          målgruppe_behov: [{ id: 'mb1', text: 'test' }],
          løsning_produkt: [{ id: 'lp1', text: 'test' }],
          marked_konkurranse: [],
          forretning_skalering: [],
        },
        antall_totalt: 2,
      });
      expect(isValidAntakelseskartOutput(validOutput)).toBe(true);
    });

    it('should return false for empty output', () => {
      expect(isValidAntakelseskartOutput('')).toBe(false);
    });

    it('should return false for JSON missing antakelser', () => {
      const incomplete = JSON.stringify({
        beslutning_oppsummert: 'Test',
        antall_totalt: 0,
      });
      expect(isValidAntakelseskartOutput(incomplete)).toBe(false);
    });
  });
});
