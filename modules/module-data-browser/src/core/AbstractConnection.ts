import { Database, ObjectType } from '@journeyapps/db';
import { Schema } from '@journeyapps/parser-schema';
import { AbstractConnectionFactory } from './AbstractConnectionFactory';
import { SchemaModelDefinition } from './SchemaModelDefinition';
import { v4 } from 'uuid';
import { BaseObserver } from '@journeyapps/common-utils';
import { Collection, LifecycleCollection } from '@journeyapps/reactor-lib-data-layer';
import { when } from 'mobx';
import { computed, observable } from 'mobx';
import { EntityDescription } from '@journeyapps/reactor-mod';
import { V4BackendClient, V4Index, V4Indexes } from '@ja-platform/sdk-backend-v4';
import { SchemaModelObject } from './SchemaModelObject';
import { getDefaultConnectionColor } from './connection-colors';
import { SchemaModelOrderValue, SchemaModelOrderingPreference } from '../preferences/SchemaOrderingPreferences';
import * as _ from 'lodash';

export interface AbstractConnectionSerialized {
  factory: string;
  id: string;
  payload: any;
  color?: string;
}

export interface AbstractConnectionListener {
  removed: () => any;
}

export enum ConnectionOnlineState {
  OFFLINE = 'offline',
  LOADING = 'loading',
  ONLINE = 'online'
}

export abstract class AbstractConnection extends BaseObserver<AbstractConnectionListener> {
  id: string;
  @observable accessor color: string;
  @observable accessor onlineState: ConnectionOnlineState;

  schema_models_collection: Collection<ObjectType>;
  schema_models: LifecycleCollection<ObjectType, SchemaModelDefinition>;
  private fetch_indexes_promise: Promise<V4Indexes['models']>;
  private initialize_online_promise: Promise<void>;

  constructor(public factory: AbstractConnectionFactory) {
    super();
    this.id = v4();
    this.color = getDefaultConnectionColor(this.id);
    this.onlineState = ConnectionOnlineState.OFFLINE;
    this.schema_models_collection = new Collection();
    this.schema_models = new LifecycleCollection({
      collection: this.schema_models_collection,
      generateModel: (o) => {
        let model = new SchemaModelDefinition({
          definition: o,
          connection: this
        });

        model.init();
        return model;
      },
      getKeyForSerialized: (o) => {
        return o.name;
      }
    });
  }

  abstract getBackendClient(): V4BackendClient;

  async getIndexes() {
    if (!this.fetch_indexes_promise) {
      this.fetch_indexes_promise = this.getBackendClient()
        .getIndexes()
        .then((res) => res.models)
        .finally(() => {
          this.fetch_indexes_promise = null;
        });
    }
    return this.fetch_indexes_promise;
  }

  async batchSave(models: SchemaModelObject[]) {
    if (models.length === 0) {
      return;
    }
    const database = await this.getConnection();
    let batch = new database.Batch();
    for (let model of models) {
      await model.applyPatches();
      batch.save(model.model);
    }
    await batch.execute();
    for (let model of models) {
      await model.reload();
      model.clearEdits();
    }
  }

  async batchDelete(models: SchemaModelObject[]) {
    if (models.length === 0) {
      return;
    }
    const database = await this.getConnection();
    let batch = new database.Batch();
    for (let model of models) {
      if (!model?.model?.persisted) {
        continue;
      }
      batch.destroy(model.model);
    }
    await batch.execute();
    for (let model of models) {
      if (!model?.model?.persisted) {
        continue;
      }
      model.definition.cache.delete(model.id);
    }
  }

  getSchemaModelDefinitionByName(name: string) {
    return this.schema_models.items.find((i) => i.definition.name === name);
  }

  @computed get isOnline() {
    return this.onlineState === ConnectionOnlineState.ONLINE;
  }

  @computed get isLoadingOnline() {
    return this.onlineState === ConnectionOnlineState.LOADING;
  }

  async waitForSchemaModelDefinitionByName(name: string) {
    await this.ensureOnline();
    await when(() => !!this.getSchemaModelDefinitionByName(name));
    return this.getSchemaModelDefinitionByName(name);
  }

  abstract getConnection(): Promise<Database>;

  protected async getSchema(): Promise<Schema> {
    const connection = await this.getConnection();
    return connection.schema;
  }

  protected getOrderedSchemaObjects(schema: Schema): ObjectType[] {
    const objects = Object.keys(schema.objects).map((key) => schema.objects[key]);
    if (SchemaModelOrderingPreference.getValue() === SchemaModelOrderValue.ALPHABETICAL) {
      return _.sortBy(objects, (object) => (object.label || object.name || '').toLowerCase());
    }
    return objects;
  }

  async reload() {
    await this.schema_models_collection.load(async () => {
      const schema = await this.getSchema();
      return this.getOrderedSchemaObjects(schema);
    });
  }

  async init() {}

  protected async connectOnline() {
    await this.reload();
  }

  async ensureOnline() {
    if (this.isOnline) {
      return;
    }
    if (!this.initialize_online_promise) {
      this.initialize_online_promise = this.initializeOnline();
    }
    await this.initialize_online_promise;
  }

  private async initializeOnline() {
    this.onlineState = ConnectionOnlineState.LOADING;
    try {
      await this.connectOnline();
      this.onlineState = ConnectionOnlineState.ONLINE;
    } finally {
      if (this.onlineState === ConnectionOnlineState.LOADING) {
        this.onlineState = ConnectionOnlineState.OFFLINE;
      }
      this.initialize_online_promise = null;
    }
  }

  protected async getSchemaModelDefinitions() {
    const schema = await this.getSchema();
    return this.getOrderedSchemaObjects(schema).map((o) => {
      return new SchemaModelDefinition({
        definition: o,
        connection: this
      });
    });
  }

  remove() {
    this.iterateListeners((cb) => cb.removed?.());
  }

  serialize(): AbstractConnectionSerialized {
    return {
      id: this.id,
      factory: this.factory.options.key,
      payload: this._serialize(),
      color: this.color
    };
  }

  get name(): EntityDescription {
    return {
      simpleName: this.id
    };
  }

  abstract _serialize(): any;

  abstract _deSerialize(data: ReturnType<this['_serialize']>): Promise<any>;
}
