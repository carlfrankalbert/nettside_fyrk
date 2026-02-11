import { MousePointer } from 'lucide-react';

interface ButtonData {
  id: string;
  label: string;
  count: number;
}

interface ButtonClickListProps {
  title: string;
  buttons: ButtonData[];
  icon?: React.ReactNode;
}

/** Primary actions that represent main tool usage */
const PRIMARY_ACTIONS = new Set([
  'okr_submit', 'konseptspeil_submit', 'antakelseskart_submit', 'premortem_submit',
  'hero_cta', 'tools_okr_cta', 'tools_konseptspeilet_cta',
  'okr_copy_suggestion', 'konseptspeil_copy_analysis', 'antakelseskart_copy', 'premortem_copy',
]);

/** Actions that indicate engagement */
const ENGAGEMENT_ACTIONS = new Set([
  'okr_example', 'konseptspeil_example', 'antakelseskart_example',
  'okr_read_more', 'konseptspeil_share_colleague',
  'contact_email', 'contact_linkedin', 'about_linkedin',
]);

function getActionType(id: string): 'primary' | 'engagement' | 'secondary' {
  if (PRIMARY_ACTIONS.has(id)) return 'primary';
  if (ENGAGEMENT_ACTIONS.has(id)) return 'engagement';
  return 'secondary';
}

const BAR_COLORS = {
  primary: 'from-indigo-100 to-indigo-50',
  engagement: 'from-emerald-100 to-emerald-50',
  secondary: 'from-slate-100 to-slate-50',
};

const ICON_COLORS = {
  primary: 'text-indigo-500',
  engagement: 'text-emerald-500',
  secondary: 'text-slate-400',
};

function ButtonRow({ button, maxCount }: { button: ButtonData; maxCount: number }) {
  const percentage = maxCount > 0 ? (button.count / maxCount) * 100 : 0;
  const actionType = getActionType(button.id);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${BAR_COLORS[actionType]} transition-all`}
        style={{ width: `${percentage}%` }}
      />
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <MousePointer className={`w-4 h-4 ${ICON_COLORS[actionType]}`} />
          <span className={`font-medium ${actionType === 'secondary' ? 'text-slate-500' : 'text-slate-700'}`}>
            {button.label}
          </span>
          {actionType === 'primary' && (
            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
              Hoved
            </span>
          )}
        </div>
        <span className={`font-bold text-lg ${button.count === 0 ? 'text-slate-300' : actionType === 'secondary' ? 'text-slate-600' : 'text-slate-900'}`}>
          {button.count.toLocaleString('no-NO')}
        </span>
      </div>
    </div>
  );
}

export function ButtonClickList({ title, buttons, icon }: ButtonClickListProps) {
  const maxCount = Math.max(...buttons.map(b => b.count), 1);

  // Sort by action type priority (primary > engagement > secondary), then by count
  const actionTypePriority = { primary: 0, engagement: 1, secondary: 2 };
  const sortedButtons = [...buttons].sort((a, b) => {
    const priorityDiff = actionTypePriority[getActionType(a.id)] - actionTypePriority[getActionType(b.id)];
    if (priorityDiff !== 0) return priorityDiff;
    return b.count - a.count;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{icon}</div>}
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {sortedButtons.map((button) => (
          <ButtonRow key={button.id} button={button} maxCount={maxCount} />
        ))}
      </div>
    </div>
  );
}
