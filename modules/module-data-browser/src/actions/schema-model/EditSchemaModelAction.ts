import { ActionStore, EntityAction, EntityActionEvent, inject, ioc, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { ModelPanelModel } from '../../panels/model/ModelPanelFactory';

export class EditSchemaModelAction extends EntityAction<SchemaModelObject> {
  static ID = 'EDIT_SCHEMA_MODEL';

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  constructor() {
    super({
      id: EditSchemaModelAction.ID,
      name: 'Edit schema model',
      icon: 'edit',
      target: DataBrowserEntities.SCHEMA_MODEL_OBJECT
    });
  }

  async fireEvent(event: EntityActionEvent<SchemaModelObject>): Promise<any> {
    this.workspaceStore.addModel(
      new ModelPanelModel({
        definition: event.targetEntity.definition,
        model: event.targetEntity
      })
    );
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<EditSchemaModelAction>(EditSchemaModelAction.ID);
  }
}
