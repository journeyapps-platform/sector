import {
  CachedEntityTreePresenterContext,
  EntityReactorNode,
  EntityTreePresenterComponent,
  ReactorTreeEntity
} from '@journeyapps/reactor-mod';
import { SchemaModelDefinition } from '../core/SchemaModelDefinition';
import { SchemaModelOrderValue, SchemaModelOrderingPreference } from '../preferences/SchemaOrderingPreferences';

class SchemaModelTreePresenterContext extends CachedEntityTreePresenterContext<SchemaModelDefinition> {
  getSortedEntities(entities: SchemaModelDefinition[]) {
    if (SchemaModelOrderingPreference.getValue() === SchemaModelOrderValue.AS_DEFINED_IN_SCHEMA) {
      return entities;
    }
    return super.getSortedEntities(entities);
  }

  protected doGenerateTreeNode(entity: SchemaModelDefinition, options): ReactorTreeEntity {
    return new EntityReactorNode({
      entity,
      definition: this.definition,
      events: options?.events
    });
  }
}

export class SchemaModelTreePresenterComponent extends EntityTreePresenterComponent<SchemaModelDefinition> {
  protected _generateContext() {
    return new SchemaModelTreePresenterContext(this);
  }
}
