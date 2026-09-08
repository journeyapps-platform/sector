import { ActionStore, EntityAction, EntityActionEvent, ioc, setupDeleteConfirmation } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { runDeleteSchemaModels } from '../../core/delete-schema-models';
import { ModelPanelModel } from '../../panels/model/ModelPanelFactory';

export interface DeleteSchemaModelActionEvent extends EntityActionEvent<SchemaModelObject> {
  sourcePanel?: ModelPanelModel;
}

export class DeleteSchemaModelAction extends EntityAction<SchemaModelObject, DeleteSchemaModelActionEvent> {
  static ID = 'DELETE_SCHEMA_MODEL';

  constructor() {
    super({
      id: DeleteSchemaModelAction.ID,
      name: 'Delete schema model',
      icon: 'trash',
      target: DataBrowserEntities.SCHEMA_MODEL_OBJECT
    });

    setupDeleteConfirmation({
      action: this
    });
  }

  async fireEvent(event: DeleteSchemaModelActionEvent): Promise<any> {
    await runDeleteSchemaModels({
      models: [event.targetEntity],
      sourcePanel: event.sourcePanel
    });
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<DeleteSchemaModelAction>(DeleteSchemaModelAction.ID);
  }
}
