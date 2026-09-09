import { AbstractPersistedStore, inject, LocalStorageSerializer } from '@journeyapps/reactor-mod';
import { action, computed, observable } from 'mobx';
import { v4 } from 'uuid';
import { SimpleQuery, SimpleQueryEncoded } from '../core/query/query-simple/SimpleQuery';
import { ConnectionStore } from './ConnectionStore';

export interface SavedQuery {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  query: SimpleQueryEncoded;
}

export interface SavedQueryStoreSerialized {
  queries: SavedQuery[];
}

export class SavedQueryEntity {
  constructor(public saved: SavedQuery) {}

  get id(): string {
    return this.saved.id;
  }

  get name(): string {
    return this.saved.name;
  }
}

export class SavedQueryStore extends AbstractPersistedStore<SavedQueryStoreSerialized> {
  @inject(ConnectionStore)
  accessor connectionStore: ConnectionStore;

  @observable
  protected accessor _queries: SavedQuery[];

  constructor() {
    super({
      name: 'SAVED_QUERY_STORE',
      serializer: new LocalStorageSerializer({
        key: 'SAVED_QUERY_STORE'
      })
    });
    this._queries = [];
  }

  @computed
  get queries(): SavedQuery[] {
    return [...this._queries].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  protected serialize(): SavedQueryStoreSerialized {
    return {
      queries: this._queries
    };
  }

  protected async deserialize(data: SavedQueryStoreSerialized): Promise<void> {
    this._queries = data?.queries || [];
  }

  getSavedForQuery(query: SimpleQuery): SavedQuery[] {
    const definition = query.options.definition?.definition?.name;
    const connectionID = query.connection?.id;
    return this.queries.filter((saved) => {
      return saved.query.definition === definition && saved.query.connection_id === connectionID;
    });
  }

  getSavedEntitiesForConnection(connectionID: string): SavedQueryEntity[] {
    return this.queries
      .filter((saved) => saved.query.connection_id === connectionID)
      .map((saved) => new SavedQueryEntity(saved));
  }

  @action
  async saveQuery(name: string, query: SimpleQuery): Promise<SavedQuery> {
    const now = new Date().toISOString();
    const saved: SavedQuery = {
      id: v4(),
      name,
      created_at: now,
      updated_at: now,
      query: query.serialize()
    };
    this._queries.push(saved);
    await this.save();
    return saved;
  }

  getByID(id: string): SavedQuery | null {
    return this._queries.find((query) => query.id === id) || null;
  }

  getSavedEntityByID(id: string): SavedQueryEntity | null {
    const saved = this.getByID(id);
    if (!saved) {
      return null;
    }
    return new SavedQueryEntity(saved);
  }

  async loadSavedQuery(id: string): Promise<SimpleQuery | null> {
    const saved = this.getByID(id);
    if (!saved) {
      return null;
    }
    const query = new SimpleQuery({
      limit: saved.query.limit
    });
    await query.deserialize(this.connectionStore, saved.query);
    return query;
  }

  @action
  async removeSavedQuery(id: string): Promise<void> {
    this._queries = this._queries.filter((query) => query.id !== id);
    await this.save();
  }
}
