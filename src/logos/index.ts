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
    id: 'coral-sunburst',
    name: 'Anthropic Coral Sunburst (Default)',
    type: 'svg-sunburst',
    color: '#DE7959',
  },
  {
    id: 'golden-sunburst',
    name: 'Warm Gold Star',
    type: 'svg-sunburst',
    color: '#E5A93C',
  },
  {
    id: 'cyan-spark',
    name: 'Electric Cyan Spark',
    type: 'svg-spark',
    color: '#38BDF8',
  },
  {
    id: 'emerald-gem',
    name: 'Emerald Nexus',
    type: 'svg-gem',
    color: '#10B981',
  },
  {
    id: 'monochrome-minimal',
    name: 'Minimal Monochrome Star',
    type: 'svg-minimal',
    color: '#EDEDEB',
  },
];
