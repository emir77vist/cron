import type { AppRoute, NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    shortcut: 'G D',
  },
  {
    id: 'jobs',
    label: 'Job Hub',
    icon: 'briefcase',
    shortcut: 'G J',
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: 'target',
    shortcut: 'G G',
  },
  {
    id: 'companies',
    label: 'Contacts',
    icon: 'users',
    shortcut: 'G C',
  },
  {
    id: 'notes',
    label: 'Reflections',
    icon: 'sticky-note',
    shortcut: 'G R',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    shortcut: 'G S',
  },
]

export const ROUTE_LABELS: Record<AppRoute, string> = {
  dashboard: 'Dashboard',
  jobs: 'Job Hub',
  goals: 'Goals',
  companies: 'Contacts',
  notes: 'Reflections',
  settings: 'Settings',
}
