import {
  Action,
  EntityDefinition,
  EntityDescriberComponent,
  inject,
  InlineEntityEncoderComponent,
  InlineTreePresenterComponent,
  SimpleParentEntitySearchEngine
} from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../entities';
import { ConnectionStore } from '../stores/ConnectionStore';
import { SchemaModelObject } from '../core/SchemaModelObject';
import { SchemaModelDefinition } from '../core/SchemaModelDefinition';
import { validate as validateUUID } from 'uuid';
import { ViewHasManyAction } from '../actions/schema-model/ViewHasManyAction';
import { DeleteSchemaModelAction } from '../actions/schema-model/DeleteSchemaModelAction';

export interface SchemaModelObjectEntityDefinitionEncoded {
  connection_id: string;
  type: string;
  id: string;
}

export class SchemaModelObjectEntityDefinition extends EntityDefinition<SchemaModelObject> {
  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  constructor() {
    super({
      type: DataBrowserEntities.SCHEMA_MODEL_OBJECT,
      category: 'DataBrowser',
      label: 'Schema model',
      icon: 'cube',
      iconColor: 'mediumpurple'
    });

    this.registerComponent(
      new EntityDescriberComponent<SchemaModelObject>({
        label: 'Simple',
        describe: (entity: SchemaModelObject) => {
          return {
            simpleName: entity.data.display,
            complexName: entity.definition.definition.label
          };
        }
      })
    );

    this.registerComponent(
      new SimpleParentEntitySearchEngine<SchemaModelDefinition, SchemaModelObject>({
        label: 'Label',
        type: DataBrowserEntities.SCHEMA_MODEL_DEFINITION,
        filterResultsWithMatcher: false,
        getEntities: async (event) => {
          if (!event.value) {
            return [];
          }
          if (validateUUID(event.value)) {
            const object = await event.parameters.parent.resolve(event.value);
            if (object) {
              return [object];
            }
            return [];
          }
          return await event.parameters.parent.search(event.value);
        }
      })
    );

    this.registerComponent(
      new InlineEntityEncoderComponent<SchemaModelObject, SchemaModelObjectEntityDefinitionEncoded>({
        version: 1,
        encode: (e) => {
          return {
            connection_id: e.definition.connection.id,
            type: e.definition.definition.name,
            id: e.model.id
          };
        },
        decode: async (entity) => {
          let connection = await this.connectionStore.waitForReadyForConnection(entity.connection_id);
          let definition = await connection.waitForSchemaModelDefinitionByName(entity.type);
          return await definition.resolve(entity.id);
        }
      })
    );

    this.registerComponent(new InlineTreePresenterComponent<SchemaModelObject>());
  }

  matchEntity(t: any): boolean {
    if (t instanceof SchemaModelObject) {
      return true;
    }
  }

  getEntityUID(t: SchemaModelObject) {
    return t.model.id;
  }

  isActionAllowedForEntity(action: Action, entity: SchemaModelObject) {
    if (action.id === DeleteSchemaModelAction.ID) {
      return !!entity.model?.persisted;
    }
    if (action.id === ViewHasManyAction.ID) {
      return Object.keys(entity.definition.definition.hasMany || {}).length > 0;
    }
    return super.isActionAllowedForEntity(action, entity);
  }
}
