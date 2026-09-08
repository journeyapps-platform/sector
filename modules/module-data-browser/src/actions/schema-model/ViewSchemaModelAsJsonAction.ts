import { ActionStore, EntityAction, EntityActionEvent, inject, ioc, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { ModelJsonPanelModel } from '../../panels/model-json/ModelJsonPanelFactory';

export class ViewSchemaModelAsJsonAction extends EntityAction<SchemaModelObject> {
  static ID = 'VIEW_SCHEMA_MODEL_AS_JSON';

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  constructor() {
    super({
      id: ViewSchemaModelAsJsonAction.ID,
      name: 'View schema model as JSON',
      icon: 'eye',
      target: DataBrowserEntities.SCHEMA_MODEL_OBJECT
    });
  }

  async fireEvent(event: EntityActionEvent<SchemaModelObject>): Promise<any> {
    this.workspaceStore.addModel(
      new ModelJsonPanelModel({
        definition: event.targetEntity.definition,
        model: event.targetEntity
      })
    );
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<ViewSchemaModelAsJsonAction>(ViewSchemaModelAsJsonAction.ID);
  }
}
