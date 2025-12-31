import KonseptSpeil from './KonseptSpeil';
import { ToolPageContent } from './ui/ToolPageContent';

const USEFUL_ITEMS = [
  { text: 'Tidlig i utforskning, når du vil tenke høyt uten å forplikte deg' },
  { text: 'Før du presenterer en idé, for å se hvilke antakelser du lener deg på' },
  { text: 'Når du vil ha et strukturert blikk på hva du vet vs. hva du tror' },
  { text: 'Som forberedelse til samtaler med interessenter' },
];

/**
 * Konseptspeil Page Content component
 */
export default function KonseptSpeilPageContent() {
  return (
    <ToolPageContent
      usefulItems={USEFUL_ITEMS}
      contactQuestion="Vil du gå dypere med en erfaren produktleder?"
      footerText="Konseptspeilet er laget av FYRK som supplement til rådgivning."
    >
      <KonseptSpeil />
    </ToolPageContent>
  );
}
