import { ApiObjectData, DatabaseAdapter, DatabaseObject } from '@journeyapps/db';
import { SchemaModelDefinition } from './SchemaModelDefinition';
import { action, observable, runInAction } from 'mobx';
import { inject, NotificationStore, NotificationType, VisorStore } from '@journeyapps/reactor-mod';

export interface SchemaModelObjectOptions {
  definition: SchemaModelDefinition;
  adapter: DatabaseAdapter;
  model?: ApiObjectData;
}

export class SchemaModelObject {
  @inject(VisorStore)
  accessor visorStore: VisorStore;

  @inject(NotificationStore)
  accessor notificationStore: NotificationStore;

  @observable
  accessor data: ApiObjectData;

  @observable
  accessor model: DatabaseObject;

  @observable
  accessor updated_at: Date;

  @observable
  accessor patch: Map<string, any>;

  constructor(public options: SchemaModelObjectOptions) {
    if (options.model) {
      this.setData(options.model);
    }
    this.patch = new Map<string, any>();
  }

  async applyPatches() {
    if (!this.model) {
      const collection = await this.definition.getCollection();
      runInAction(() => {
        this.model = collection.create();
      });
    }
    for (let entry of this.patch.entries()) {
      if (this.definition.definition.belongsTo[entry[0]]) {
        this.model[entry[0]](entry[1]?.model || null);
      } else {
        this.model[entry[0]] = entry[1];
      }
    }
    this.clearEdits();
  }

  async save() {
    await this.visorStore.wrap(`Saving ${this.definition.definition.label}`, async () => {
      await this.definition.connection.batchSave([this]);
    });
    this.notificationStore.showNotification({
      title: 'Model updated',
      description: `${this.definition.definition.label} was updated`,
      type: NotificationType.SUCCESS
    });
  }

  @action
  clearEdits() {
    this.patch.clear();
  }

  @action
  revert(field: string) {
    this.patch.delete(field);
  }

  @action
  set(field: string, value: any) {
    if (this.model?.[field] === value) {
      this.patch.delete(field);
    } else {
      this.patch.set(field, value);
    }
  }

  getBelongsToId(relationshipName: string): string | null {
    const idVariable = this.definition.getBelongsToIdVariableForRelationship(relationshipName);
    if (idVariable && this.model?.[idVariable.name]) {
      return this.model[idVariable.name];
    }
    if (this.data?.belongs_to?.[relationshipName]) {
      return this.data.belongs_to[relationshipName];
    }
    return null;
  }

  @action setData(data: ApiObjectData) {
    this.data = data;
    this.model = new DatabaseObject(this.options.adapter, this.definition.definition, data.id);
    // @ts-ignore
    this.model.resolve(data);
    this.updated_at = new Date(data._updated_at);
  }

  async reload() {
    const model = await this.definition.load(this.id);
    if (model && model !== this) {
      this.setData(model.data);
      this.definition.cache.set(this.id, this);
    }
  }

  get definition(): SchemaModelDefinition {
    return this.options.definition;
  }

  get id() {
    return this.data?.id;
  }
}
