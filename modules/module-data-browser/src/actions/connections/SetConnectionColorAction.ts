import {
  ActionStore,
  ComboBoxStore2,
  EntityAction,
  EntityActionEvent,
  SimpleComboBoxDirective,
  inject,
  ioc
} from '@journeyapps/reactor-mod';
import { AbstractConnection } from '../../core/AbstractConnection';
import { DataBrowserEntities } from '../../entities';
import { getConnectionColorComboBoxItems } from '../../core/connection-colors';
import { ConnectionStore } from '../../stores/ConnectionStore';

export class SetConnectionColorAction extends EntityAction<AbstractConnection> {
  static ID = 'SET_CONNECTION_COLOR';

  @inject(ComboBoxStore2)
  accessor comboStore: ComboBoxStore2;

  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  constructor() {
    super({
      id: SetConnectionColorAction.ID,
      name: 'Set connection color',
      icon: 'palette',
      target: DataBrowserEntities.CONNECTION
    });
  }

  async fireEvent(event: EntityActionEvent<AbstractConnection>): Promise<any> {
    const directive = await this.comboStore.show(
      new SimpleComboBoxDirective({
        title: 'Connection color',
        event: event.position,
        items: getConnectionColorComboBoxItems()
      })
    );
    const selected = directive.getSelectedItem();
    if (!selected?.key) {
      return;
    }
    event.targetEntity.color = selected.key;
    this.connectionStore.save();
  }

  static get() {
    return ioc.get(ActionStore).getActionByID<SetConnectionColorAction>(SetConnectionColorAction.ID);
  }
}
