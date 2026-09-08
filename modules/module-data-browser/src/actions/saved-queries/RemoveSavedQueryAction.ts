import { ActionStore, EntityAction, EntityActionEvent, inject, ioc } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../../entities';
import { SavedQueryEntity, SavedQueryStore } from '../../stores/SavedQueryStore';

export class RemoveSavedQueryAction extends EntityAction<SavedQueryEntity> {
  static ID = 'REMOVE_SAVED_QUERY';

  @inject(SavedQueryStore)
  accessor savedQueryStore: SavedQueryStore;

  constructor() {
    super({
      id: RemoveSavedQueryAction.ID,
      name: 'Delete saved query',
      icon: 'trash',
      target: DataBrowserEntities.SAVED_QUERY
    });
  }

  async fireEvent(event: EntityActionEvent<SavedQueryEntity>): Promise<any> {
    await this.savedQueryStore.removeSavedQuery(event.targetEntity.id);
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<RemoveSavedQueryAction>(RemoveSavedQueryAction.ID);
  }
}
