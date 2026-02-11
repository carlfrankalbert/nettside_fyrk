import { BarChart3, Clock, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  type: 'metrics' | 'funnel' | 'activity';
  toolName?: string;
}

const EMPTY_STATE_CONFIG = {
  metrics: {
    icon: BarChart3,
    title: 'Ingen data enn\u00e5',
    description: 'Ytelsesmetrikker vises n\u00e5r brukere begynner \u00e5 bruke AI-verkt\u00f8yene.',
    tip: 'Data samles inn automatisk n\u00e5r noen fullf\u00f8rer en sjekk.',
  },
  funnel: {
    icon: Lightbulb,
    title: 'Venter p\u00e5 aktivitet',
    description: 'Funnelen viser hvordan brukere beveger seg gjennom verkt\u00f8yet.',
    tip: 'F\u00f8rste steg registreres n\u00e5r noen begynner \u00e5 skrive.',
  },
  activity: {
    icon: Clock,
    title: 'Ingen aktivitet i valgt periode',
    description: 'Timefordeling vises n\u00e5r brukere bruker verkt\u00f8yene.',
    tip: 'Grafen oppdateres automatisk.',
  },
};

export function EmptyState({ type, toolName }: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="p-3 bg-slate-100 rounded-full mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="font-medium text-slate-700 mb-1">
        {config.title}
        {toolName && ` for ${toolName}`}
      </h4>
      <p className="text-sm text-slate-500 mb-3 max-w-xs">
        {config.description}
      </p>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        {config.tip}
      </p>
    </div>
  );
}
