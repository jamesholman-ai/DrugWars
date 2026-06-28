import { RootStackParamList } from '../types/game';

export type MainNavTab = 'Command' | 'Market' | 'Operations' | 'Empire' | 'More';

export const MAIN_NAV_TABS: { id: MainNavTab; label: string; icon: string; route: keyof RootStackParamList }[] = [
  { id: 'Command', label: 'Command', icon: '⌂', route: 'Game' },
  { id: 'Market', label: 'Market', icon: '◈', route: 'Market' },
  { id: 'Operations', label: 'Operations', icon: '◉', route: 'OperationsDashboard' },
  { id: 'Empire', label: 'Empire', icon: '☷', route: 'EmpireDashboard' },
  { id: 'More', label: 'More', icon: '⋯', route: 'MoreScreen' },
];

/** Map any in-game route to its parent bottom-nav tab for highlight state. */
export function getMainNavTabForRoute(route: keyof RootStackParamList): MainNavTab {
  switch (route) {
    case 'Game':
      return 'Command';
    case 'Market':
      return 'Market';
    case 'OperationsDashboard':
    case 'Missions':
    case 'Contracts':
    case 'Suppliers':
      return 'Operations';
    case 'EmpireDashboard':
    case 'Crew':
    case 'CrewDetail':
    case 'Businesses':
    case 'BusinessDetail':
    case 'Safehouses':
    case 'PropertyDetail':
    case 'Inventory':
      return 'Empire';
    case 'Store':
      return 'More';
    default:
      return 'More';
  }
}
