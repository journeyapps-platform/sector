import { Page } from './Page';
import { AbstractConnection } from '../AbstractConnection';
import { v4 } from 'uuid';
import { inject, NotificationStore, NotificationType, TableColumn, VisorStore } from '@journeyapps/reactor-mod';
import { SchemaModelObject } from '../SchemaModelObject';

export abstract class AbstractQuery {
  @inject(VisorStore)
  accessor visorStore: VisorStore;

  @inject(NotificationStore)
  accessor notificationStore: NotificationStore;

  id: string;

  constructor(
    public type: string,
    public connection: AbstractConnection
  ) {
    this.id = v4();
  }

  async batchSave() {
    const dirtyObjects = this.getDirtyObjects();
    await this.visorStore.wrap(`Saving ${dirtyObjects.length} models`, async () => {
      await this.connection.batchSave(dirtyObjects);
    });
    this.notificationStore.showNotification({
      title: 'Models updated',
      description: `${dirtyObjects.length} ${dirtyObjects.length === 1 ? 'model was' : 'models were'} updated`,
      type: NotificationType.SUCCESS
    });
  }

  abstract getDirtyObjects(): SchemaModelObject[];

  abstract getSimpleName(): string;

  abstract load(): Promise<any>;

  abstract getColumns(): TableColumn[];

  abstract get totalPages(): number;

  abstract getPage(number: number): Page;

  abstract matches(query: AbstractQuery): boolean;
}
