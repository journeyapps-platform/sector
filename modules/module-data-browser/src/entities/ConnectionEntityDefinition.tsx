import {
  DescendantEntityProviderComponent,
  DescendantLoadingEntityProviderComponent,
  EntityCardsPresenterComponent,
  EntityDefinition,
  EntityDescriberComponent,
  EntityPanelComponent,
  inject,
  InlineTreePresenterComponent,
  SearchableTreeSearchScope,
  SimpleEntitySearchEngineComponent,
  TreeBadgeWidget,
  ThemeStore
} from '@journeyapps/reactor-mod';
import * as React from 'react';
import { DataBrowserEntities } from '../entities';
import { ConnectionStore } from '../stores/ConnectionStore';
import { AbstractConnection } from '../core/AbstractConnection';
import { AddConnectionAction } from '../actions/connections/AddConnectionAction';
import { SavedQueryEntity, SavedQueryStore } from '../stores/SavedQueryStore';
import { SchemaModelDefinition } from '../core/SchemaModelDefinition';

export class ConnectionEntityDefinition extends EntityDefinition<AbstractConnection> {
  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  @inject(SavedQueryStore)
  accessor savedQueryStore: SavedQueryStore;

  @inject(ThemeStore)
  accessor themeStore: ThemeStore;

  constructor() {
    super({
      type: DataBrowserEntities.CONNECTION,
      category: 'DataBrowser',
      label: 'Connection',
      icon: 'database',
      iconColor: 'cyan'
    });

    this.registerComponent(
      new EntityDescriberComponent<AbstractConnection>({
        label: 'Simple',
        describe: (entity: AbstractConnection) => {
          return {
            ...entity.name,
            iconColor: entity.color
          };
        }
      })
    );

    this.registerComponent(
      new SimpleEntitySearchEngineComponent<AbstractConnection>({
        label: 'Simple',
        getEntities: async () => {
          return this.connectionStore.connections;
        }
      })
    );

    this.registerComponent(
      new InlineTreePresenterComponent<AbstractConnection>({
        loadChildrenAsNodesAreOpened: true,
        cacheTreeEntities: true,
        searchScope: SearchableTreeSearchScope.VISIBLE_ONLY,
        augmentTreeNodeProps: (entity) => {
          if (!entity.isOnline) {
            return {};
          }
          const theme = this.themeStore.getCurrentTheme();
          return {
            rightChildren: (
              <TreeBadgeWidget
                icon="bolt"
                background={'transparent'}
                foreground={theme.status.success}
                tooltip="Connection online"
              />
            )
          };
        }
      })
    );

    this.registerComponent(new EntityCardsPresenterComponent<AbstractConnection>());

    this.registerComponent(
      new DescendantLoadingEntityProviderComponent<AbstractConnection, SchemaModelDefinition>({
        descendantType: DataBrowserEntities.SCHEMA_MODEL_DEFINITION,
        generateOptions: (parent) => {
          return {
            category: {
              label: 'Models',
              icon: 'cube'
            },
            descendants: parent.schema_models.items,
            loading: () => parent.isLoadingOnline,
            refreshDescendants: async () => {
              await parent.ensureOnline();
            }
          };
        }
      })
    );

    this.registerComponent(
      new DescendantEntityProviderComponent<AbstractConnection, SavedQueryEntity>({
        descendantType: DataBrowserEntities.SAVED_QUERY,
        generateOptions: (parent) => {
          return {
            category: {
              label: 'Saved queries',
              icon: 'bookmark'
            },
            descendants: this.savedQueryStore.getSavedEntitiesForConnection(parent.id)
          };
        }
      })
    );

    this.registerComponent(
      new EntityPanelComponent<AbstractConnection>({
        label: 'Connections',
        getEntities: () => {
          return this.connectionStore.connections;
        },
        additionalActions: [AddConnectionAction.ID]
      })
    );
  }

  matchEntity(t: any): boolean {
    if (t instanceof AbstractConnection) {
      return true;
    }
  }

  getEntityUID(t: AbstractConnection) {
    return t.id;
  }
}
