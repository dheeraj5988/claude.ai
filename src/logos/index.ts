// Logo asset definitions and options
export interface AppLogo {
  id: string;
  name: string;
  type: 'svg-sunburst' | 'svg-gem' | 'svg-spark' | 'svg-minimal' | 'custom-image';
  color: string;
  customDataUrl?: string;
}

export const AVAILABLE_LOGOS: AppLogo[] = [
  {
    id: 'aura-amber',
    name: 'Aura Amber Prism (Default)',
    type: 'svg-sunburst',
    color: '#E07A5F',
  },
  {
    id: 'aura-golden',
    name: 'Aura Radiant Gold',
    type: 'svg-sunburst',
    color: '#F59E0B',
  },
  {
    id: 'cyan-spark',
    name: 'Aura Electric Cyan',
    type: 'svg-spark',
    color: '#38BDF8',
  },
  {
    id: 'emerald-gem',
    name: 'Aura Emerald Nexus',
    type: 'svg-gem',
    color: '#10B981',
  },
  {
    id: 'monochrome-minimal',
    name: 'Aura Minimal Monochrome',
    type: 'svg-minimal',
    color: '#EDEDEB',
  },
];
