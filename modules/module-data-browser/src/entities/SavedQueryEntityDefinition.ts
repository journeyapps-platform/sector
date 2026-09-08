import {
  EntityActionHandlerComponent,
  EntityCardsPresenterComponent,
  EntityDefinition,
  EntityDescriberComponent,
  inject,
  InlineEntityEncoderComponent,
  InlineTreePresenterComponent
} from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../entities';
import { SavedQueryEntity, SavedQueryStore } from '../stores/SavedQueryStore';
import { OpenSavedQueryAction } from '../actions/saved-queries/OpenSavedQueryAction';
import { RemoveSavedQueryAction } from '../actions/saved-queries/RemoveSavedQueryAction';

interface SavedQueryEntityEncoded {
  id: string;
}

export class SavedQueryEntityDefinition extends EntityDefinition<SavedQueryEntity> {
  @inject(SavedQueryStore)
  accessor savedQueryStore: SavedQueryStore;

  constructor() {
    super({
      type: DataBrowserEntities.SAVED_QUERY,
      category: 'DataBrowser',
      label: 'Saved query',
      icon: 'bookmark',
      iconColor: 'gold'
    });

    this.registerComponent(
      new EntityDescriberComponent<SavedQueryEntity>({
        label: 'Simple',
        describe: (entity) => {
          return {
            simpleName: entity.saved.name,
            complexName: entity.saved.query.definition,
            tags: ['saved']
          };
        }
      })
    );

    this.registerComponent(new InlineTreePresenterComponent<SavedQueryEntity>());
    this.registerComponent(new EntityCardsPresenterComponent<SavedQueryEntity>());

    this.registerComponent(
      new InlineEntityEncoderComponent<SavedQueryEntity, SavedQueryEntityEncoded>({
        version: 1,
        encode: (entity) => {
          return {
            id: entity.id
          };
        },
        decode: async (entity) => {
          return this.savedQueryStore.getSavedEntityByID(entity.id);
        }
      })
    );

    this.registerComponent(new EntityActionHandlerComponent(OpenSavedQueryAction.ID));
  }

  matchEntity(t: any): boolean {
    return t instanceof SavedQueryEntity;
  }

  getEntityUID(t: SavedQueryEntity) {
    return t.id;
  }
}
