import { Id, Link, MinilinksResult } from '@deep-foundation/deeplinks/imports/minilinks';

export interface CytoGraphProps {
  links: Link<Id>[];
  cytoViewportRef?: any;
  cyRef?: any;
  gqlPath: string;
  gqlSsl: boolean;
  children?: any;
  useCytoViewport?: any;
  useSpaceId?: any;
};
