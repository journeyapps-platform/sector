import {
  ActionStore,
  ComboBoxItem,
  ComboBoxStore2,
  EntityAction,
  EntityActionEvent,
  NotificationStore,
  NotificationType,
  SimpleComboBoxDirective,
  WorkspaceStore,
  inject,
  ioc
} from '@journeyapps/reactor-mod';
import { Relationship } from '@journeyapps/parser-schema';
import { DataBrowserEntities } from '../../entities';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { QueryPanelModel } from '../../panels/query/QueryPanelFactory';
import { SimpleQuery } from '../../core/query/query-simple/SimpleQuery';
import { Condition, SimpleFilter, Statement } from '../../core/query/filters';

export class ViewHasManyAction extends EntityAction<SchemaModelObject> {
  static ID = 'VIEW_HAS_MANY';

  @inject(ComboBoxStore2)
  accessor comboStore: ComboBoxStore2;

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  @inject(NotificationStore)
  accessor notifications: NotificationStore;

  constructor() {
    super({
      id: ViewHasManyAction.ID,
      name: 'View has many',
      icon: 'list',
      target: DataBrowserEntities.SCHEMA_MODEL_OBJECT
    });
  }

  async fireEvent(event: EntityActionEvent<SchemaModelObject>): Promise<any> {
    const relationships = Object.values(event.targetEntity.definition.definition.hasMany || {});
    if (relationships.length === 0) {
      this.notifications.showNotification({
        title: 'No relationships',
        description: 'This record has no has-many relationships to view.',
        type: NotificationType.ERROR
      });
      return;
    }

    const directive = await this.comboStore.show(
      new SimpleComboBoxDirective({
        title: 'View has many',
        subtitle: event.targetEntity.data.display || event.targetEntity.id,
        event: event.position,
        items: relationships.map((relationship) => {
          return {
            key: relationship.foreignName || relationship.name,
            title: relationship.foreignName || relationship.name,
            subtitle: relationship.objectType.label || relationship.objectType.name,
            action: async () => {}
          } as ComboBoxItem;
        })
      })
    );

    const selected = directive.getSelectedItem();
    if (!selected?.key) {
      return;
    }

    const relationship = relationships.find((entry) => (entry.foreignName || entry.name) === selected.key);
    if (!relationship) {
      return;
    }

    await this.openRelationshipQuery(event.targetEntity, relationship);
  }

  private async openRelationshipQuery(parent: SchemaModelObject, relationship: Relationship) {
    const definition = await parent.definition.connection.waitForSchemaModelDefinitionByName(
      relationship.objectType.name
    );
    const variable = definition.getBelongsToIdVariableForRelationship(relationship.name);
    if (!variable) {
      this.notifications.showNotification({
        title: 'Cannot open relationship',
        description: `No belongs-to field found for ${relationship.name}.`,
        type: NotificationType.ERROR
      });
      return;
    }

    variable.label = relationship.name;

    const query = new SimpleQuery({
      definition,
      limit: 30
    });

    query.filterState.setFilter(
      variable.name,
      new SimpleFilter(variable, [new Statement(Condition.EQUALS, parent.id)])
    );

    this.workspaceStore.addModel(new QueryPanelModel(query));
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<ViewHasManyAction>(ViewHasManyAction.ID);
  }
}
