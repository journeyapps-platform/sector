import { ActionStore, EntityAction, EntityActionEvent, inject, ioc, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelDefinition } from '../../core/SchemaModelDefinition';
import { ModelPanelModel } from '../../panels/model/ModelPanelFactory';

export class CreateModelAction extends EntityAction<SchemaModelDefinition> {
  static ID = 'CREATE_SCHEMA_MODEL';

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  constructor() {
    super({
      id: CreateModelAction.ID,
      name: 'Create schema model',
      icon: 'plus',
      target: DataBrowserEntities.SCHEMA_MODEL_DEFINITION
    });
  }

  async fireEvent(event: EntityActionEvent<SchemaModelDefinition>): Promise<any> {
    this.workspaceStore.addModel(
      new ModelPanelModel({
        definition: event.targetEntity,
        model: await event.targetEntity.generateNewModelObject()
      })
    );
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<CreateModelAction>(CreateModelAction.ID);
  }
}
