export type Plan = 'FREE' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM';

export type WidgetId =
  | 'overview'
  | 'activity'
  | 'progress'
  | 'completion'
  | 'analytics'
  | 'calendar'
  | 'inventory'
  | 'timer_active';

export const WIDGET_LABELS: Record<WidgetId, string> = {
  overview: 'Time Tracking Overview',
  activity: 'Team Activity Feed',
  progress: 'Project Progress',
  completion: 'Task Completion',
  analytics: 'Analytics',
  calendar: 'Calendar',
  inventory: 'Inventory Tracking',
  timer_active: 'Pinned Timer',
};

export const WIDGET_IDS: WidgetId[] = [
  'overview',
  'activity',
  'progress',
  'completion',
  'analytics',
  'calendar',
  'inventory',
  'timer_active',
];

export function canUseWidget(plan: Plan, id: WidgetId): boolean {
  if (id === 'inventory') return plan === 'ENTERPRISE' || plan === 'CUSTOM';
  if (id === 'analytics') return plan !== 'FREE';
  return true;
}

export function getAvailableWidgets(plan: Plan): WidgetId[] {
  return WIDGET_IDS.filter((id) => canUseWidget(plan, id));
}

export function dispatchAddWidget(id: WidgetId): void {
  document.dispatchEvent(new CustomEvent('tc:add-widget', { detail: { id } }));
}
