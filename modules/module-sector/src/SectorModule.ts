import {
  AbstractReactorModule,
  ReactorModuleInitEvent,
  ReactorModuleRegisterEvent,
  UXStore
} from '@journeyapps/reactor-mod';
import { SectorBodyWidget } from './widgets/SectorBodyWidget';
import { setupWorkspaces } from './setupWorkspaces';

import icon from '../media/logo.png';

export class SectorModule extends AbstractReactorModule {
  constructor() {
    super({
      name: 'Sector'
    });
  }
  register({ ioc }: ReactorModuleRegisterEvent) {
    const uxStore = ioc.get(UXStore);
    uxStore.primaryLogo = icon;
    uxStore.primaryHeader = {
      label: 'Sector',
      action: () => {}
    };
    uxStore.secondaryHeader = {
      label: 'Databrowser',
      action: () => {}
    };

    uxStore.setFavicons(icon, icon);
    uxStore.setRootComponent(SectorBodyWidget);

    setupWorkspaces();
  }

  async init(_event: ReactorModuleInitEvent): Promise<any> {}
}
