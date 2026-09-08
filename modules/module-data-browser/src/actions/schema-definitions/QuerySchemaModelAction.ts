import { ActionStore, EntityAction, EntityActionEvent, inject, ioc, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelDefinition } from '../../core/SchemaModelDefinition';
import { QueryPanelModel } from '../../panels/query/QueryPanelFactory';
import { SimpleQuery } from '../../core/query/query-simple/SimpleQuery';

export class QuerySchemaModelAction extends EntityAction<SchemaModelDefinition> {
  static ID = 'QUERY_SCHEMA_MODEL';

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  constructor() {
    super({
      id: QuerySchemaModelAction.ID,
      name: 'Query schema model',
      icon: 'search',
      target: DataBrowserEntities.SCHEMA_MODEL_DEFINITION
    });
  }

  async fireEvent(event: EntityActionEvent<SchemaModelDefinition>): Promise<any> {
    this.workspaceStore.addModel(
      new QueryPanelModel(
        new SimpleQuery({
          definition: event.targetEntity,
          limit: 30
        })
      )
    );
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<QuerySchemaModelAction>(QuerySchemaModelAction.ID);
  }
}
