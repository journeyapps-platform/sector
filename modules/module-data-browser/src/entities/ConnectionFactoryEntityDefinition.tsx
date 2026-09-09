import {
  EntityDefinition,
  EntityDescriberComponent,
  inject,
  SimpleEntitySearchEngineComponent
} from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../entities';
import { ConnectionStore } from '../stores/ConnectionStore';
import { AbstractConnectionFactory } from '../core/AbstractConnectionFactory';

export class ConnectionFactoryEntityDefinition extends EntityDefinition<AbstractConnectionFactory> {
  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  constructor() {
    super({
      type: DataBrowserEntities.CONNECTION_FACTORY,
      category: 'DataBrowser',
      label: 'Connection type',
      icon: 'database',
      iconColor: 'blue'
    });

    this.registerComponent(
      new EntityDescriberComponent<AbstractConnectionFactory>({
        label: 'Simple',
        describe: (entity: AbstractConnectionFactory) => {
          return {
            simpleName: entity.options.label
          };
        }
      })
    );

    this.registerComponent(
      new SimpleEntitySearchEngineComponent<AbstractConnectionFactory>({
        label: 'Simple',
        getEntities: async () => {
          return this.connectionStore.connectionFactories;
        }
      })
    );
  }

  matchEntity(t: any): boolean {
    if (t instanceof AbstractConnectionFactory) {
      return true;
    }
  }

  getEntityUID(t: AbstractConnectionFactory) {
    return t.options.key;
  }
}
