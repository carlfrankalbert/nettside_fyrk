import OKRReviewer from './OKRReviewer';
import { ToolPageContent } from './ui/ToolPageContent';

const USEFUL_ITEMS = [
  { text: 'Foran en ny OKR-periode, for en rask kvalitetssjekk' },
  { text: 'Når OKR-ene ligner mer på oppgaver enn mål' },
  { text: 'Som utgangspunkt for diskusjon i teamet' },
];

/**
 * OKR Page Content component
 */
export default function OKRPageContent() {
  return (
    <ToolPageContent
      usefulItems={USEFUL_ITEMS}
      contactQuestion="Vil du ha et menneskelig blikk i tillegg?"
      footerText="OKR-sjekken er laget av FYRK som supplement til rådgivning."
    >
      <OKRReviewer />
    </ToolPageContent>
  );
}
