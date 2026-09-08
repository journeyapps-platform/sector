import { EntityDefinition, EntityDescriberComponent, InlineTreePresenterComponent } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '../entities';
import { IndexModel } from '../core/IndexModel';

export class SchemaModelIndexDefinition extends EntityDefinition<IndexModel> {
  constructor() {
    super({
      type: DataBrowserEntities.SCHEMA_MODEL_INDEX,
      category: 'DataBrowser',
      label: 'Schema model index',
      icon: 'search',
      iconColor: 'cyan'
    });

    this.registerComponent(
      new EntityDescriberComponent<IndexModel>({
        label: 'Simple',
        describe: (entity: IndexModel) => {
          return {
            simpleName: entity.index.name,
            complexName: entity.index.type
          };
        }
      })
    );

    this.registerComponent(new InlineTreePresenterComponent());
  }

  matchEntity(t: any): boolean {
    if (t instanceof IndexModel) {
      return true;
    }
  }

  getEntityUID(t: IndexModel) {
    return `${t.definition.definition.media}-${t.index.name}`;
  }
}
