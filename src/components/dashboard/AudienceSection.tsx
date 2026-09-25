import { MapPin, Building2, Smartphone, AppWindow, Unlink } from 'lucide-react';
import { RankedList, type RankedListStyle } from './RankedList';
import type { AudienceData } from '../../utils/visitor-dimensions';

interface AudienceSectionProps {
  audience: AudienceData;
  notFoundPaths: Record<string, number>;
}

const STYLES: Record<keyof AudienceData | 'notFound', RankedListStyle> = {
  countries: {
    title: 'Land',
    icon: <MapPin className="w-4 h-4" />,
    iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', barFrom: 'from-emerald-100', barTo: 'to-emerald-50',
  },
  organizations: {
    title: 'Nettverk (organisasjon)',
    icon: <Building2 className="w-4 h-4" />,
    iconBg: 'bg-blue-50', iconText: 'text-blue-600', barFrom: 'from-blue-100', barTo: 'to-blue-50',
  },
  devices: {
    title: 'Enhet',
    icon: <Smartphone className="w-4 h-4" />,
    iconBg: 'bg-violet-50', iconText: 'text-violet-600', barFrom: 'from-violet-100', barTo: 'to-violet-50',
  },
  browsers: {
    title: 'Nettleser',
    icon: <AppWindow className="w-4 h-4" />,
    iconBg: 'bg-amber-50', iconText: 'text-amber-600', barFrom: 'from-amber-100', barTo: 'to-amber-50',
  },
  notFound: {
    title: 'Lenker som ga 404',
    icon: <Unlink className="w-4 h-4" />,
    iconBg: 'bg-red-50', iconText: 'text-red-600', barFrom: 'from-red-100', barTo: 'to-red-50',
  },
};

const regionNames = new Intl.DisplayNames(['nb'], { type: 'region' });

function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Who visits (per unique visitor per day) and which broken links people hit */
export function AudienceSection({ audience, notFoundPaths }: AudienceSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankedList config={STYLES.organizations} data={audience.organizations} maxEntries={15} />
        <RankedList config={STYLES.countries} data={audience.countries} formatKey={countryName} />
        <RankedList config={STYLES.devices} data={audience.devices} />
        <RankedList config={STYLES.browsers} data={audience.browsers} />
      </div>
      <RankedList config={STYLES.notFound} data={notFoundPaths} maxEntries={20} />
    </div>
  );
}
