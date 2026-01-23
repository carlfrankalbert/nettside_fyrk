import { BarChart3, Clock, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  type: 'metrics' | 'funnel' | 'activity';
  toolName?: string;
}

const EMPTY_STATE_CONFIG = {
  metrics: {
    icon: BarChart3,
    title: 'Ingen data ennå',
    description: 'Ytelsesmetrikker vises når brukere begynner å bruke AI-verktøyene.',
    tip: 'Data samles inn automatisk når noen fullfører en sjekk.',
  },
  funnel: {
    icon: Lightbulb,
    title: 'Venter på aktivitet',
    description: 'Funnelen viser hvordan brukere beveger seg gjennom verktøyet.',
    tip: 'Første steg registreres når noen begynner å skrive.',
  },
  activity: {
    icon: Clock,
    title: 'Ingen aktivitet i dag',
    description: 'Timefordeling vises når brukere bruker verktøyene i dag.',
    tip: 'Grafen oppdateres automatisk gjennom dagen.',
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
