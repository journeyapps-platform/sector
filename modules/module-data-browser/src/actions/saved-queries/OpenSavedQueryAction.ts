import { ActionStore, EntityAction, EntityActionEvent, inject, ioc, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SavedQueryEntity, SavedQueryStore } from '../../stores/SavedQueryStore';
import { QueryPanelModel } from '../../panels/query/QueryPanelFactory';

export class OpenSavedQueryAction extends EntityAction<SavedQueryEntity> {
  static ID = 'OPEN_SAVED_QUERY';

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  @inject(SavedQueryStore)
  accessor savedQueryStore: SavedQueryStore;

  constructor() {
    super({
      id: OpenSavedQueryAction.ID,
      name: 'Open saved query',
      icon: 'play',
      target: DataBrowserEntities.SAVED_QUERY
    });
  }

  async fireEvent(event: EntityActionEvent<SavedQueryEntity>): Promise<any> {
    const query = await this.savedQueryStore.loadSavedQuery(event.targetEntity.id);
    if (!query) {
      return;
    }
    await query.load();
    this.workspaceStore.addModel(new QueryPanelModel(query));
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<OpenSavedQueryAction>(OpenSavedQueryAction.ID);
  }
}
