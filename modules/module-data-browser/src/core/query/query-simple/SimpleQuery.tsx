import { inject, ioc, TableColumn } from '@journeyapps/reactor-mod';
import { ConnectionStore } from '../../../stores/ConnectionStore';
import { Promise } from '@journeyapps/db';
import { Page } from '../Page';
import { SchemaModelDefinition } from '../../SchemaModelDefinition';
import { action, observable } from 'mobx';
import { SchemaModelObject } from '../../SchemaModelObject';
import { SimplePage } from './SimplePage';
import { AbstractQueryEncoded, AbstractSerializableQuery } from '../AbstractSerializableQuery';
import { SerializedSimpleFilter } from '../filters';
import { TypeEngine } from '../../../forms/TypeEngine';
import { SerializedSimpleQuerySort, SimpleQuerySort, SortDirection } from './SimpleQueryTypes';
import { applyFiltersAndSorts } from './SimpleQueryPlanner';
import { buildSimpleQueryColumns } from './SimpleQueryColumns';
import { SimpleQuerySortState } from './SimpleQuerySortState';
import { SimpleQueryFilterState } from './SimpleQueryFilterState';
import { AbstractQuery } from '../AbstractQuery';
import { StandardModelFields } from '../StandardModelFields';
import * as _ from 'lodash';

export interface SimpleQueryOptions {
  definition?: SchemaModelDefinition;
  limit?: number;
}

export interface SimpleQueryEncoded extends AbstractQueryEncoded {
  limit: number;
  filters?: SerializedSimpleFilter[];
  sorts?: SerializedSimpleQuerySort[];
}

export { SortDirection, SimpleQuerySort, type SerializedSimpleQuerySort };

export class SimpleQuery extends AbstractSerializableQuery<SimpleQueryEncoded> {
  @inject(ConnectionStore)
  accessor connStore: ConnectionStore;

  @observable
  accessor _totalPages: number;

  @observable
  accessor _pages: Page[];

  readonly sortState: SimpleQuerySortState;
  readonly filterState: SimpleQueryFilterState;
  private suspendStateLoad: boolean;
  private readonly scheduleLoad: () => void;

  constructor(public options: SimpleQueryOptions = {}) {
    super('simple', options.definition?.connection);
    this._totalPages = 0;
    this._pages = [];
    this.sortState = new SimpleQuerySortState(options.definition);
    this.filterState = new SimpleQueryFilterState({
      definition: options.definition,
      typeEngine: ioc.get(TypeEngine)
    });
    this.suspendStateLoad = false;
    this.scheduleLoad = _.debounce(
      () => {
        if (this.suspendStateLoad) {
          return;
        }
        this.load();
      },
      10,
      { trailing: true, leading: false }
    );
    const onStateChange = () => {
      if (this.suspendStateLoad) {
        return;
      }
      this.scheduleLoad();
    };
    this.sortState.registerListener({
      changed: () => {
        onStateChange();
      }
    });
    this.filterState.registerListener({
      changed: () => {
        onStateChange();
      }
    });

    // Some code paths construct a shell query (no definition) before deserialize/hydration.
    // Only seed the default sort once a definition exists to avoid premature load() calls.
    if (options.definition && this.sortState.sorts.length === 0) {
      this.sortState.addSort(SimpleQuerySort.create(StandardModelFields.UPDATED_AT, SortDirection.DESC));
    }
  }

  matches(query: AbstractQuery): boolean {
    if (query instanceof SimpleQuery) {
      return _.isEqual(this.serialize(), query.serialize());
    }
    return false;
  }

  @action async load() {
    this._pages = [];
    const collection = await this.options.definition.getCollection();
    const query = applyFiltersAndSorts(
      collection.all(),
      Array.from(this.filterState.simpleFilters.values()),
      this.sortState.sorts
    );
    const results = await (collection.adapter as any).doApiQuery(query);
    this._totalPages = Math.ceil(results.total / this.options.limit);
  }

  getPage(number: number): Page {
    if (!this._pages[number]) {
      const page = new SimplePage({
        offset: number * this.options.limit,
        limit: this.options.limit,
        definition: this.options.definition,
        index: number,
        filters: Array.from(this.filterState.simpleFilters.values()),
        sorts: this.sortState.sorts
      });
      page.load();
      this._pages[number] = page;
    }
    return this._pages[number];
  }

  get totalPages(): number {
    return this._totalPages;
  }

  serialize(): SimpleQueryEncoded {
    return {
      ...super.serialize(),
      definition: this.options.definition.definition.name,
      limit: this.options.limit,
      filters: this.filterState.getSerializedFilters(),
      sorts: this.sortState.getSerializedSorts()
    };
  }

  async deserialize(connectionStore: ConnectionStore, data: SimpleQueryEncoded): Promise<void> {
    await super.deserialize(connectionStore, data);
    this.suspendStateLoad = true;
    try {
      this.options.limit = data.limit;
      const definition = await this.connection.waitForSchemaModelDefinitionByName(data.definition);
      this.options.definition = definition;
      this.sortState.setDefinition(definition);
      this.filterState.setDefinition(definition);
      this.filterState.hydrateFilters(data.filters || []);
      this.sortState.hydrateSorts(data.sorts || []);
    } finally {
      this.suspendStateLoad = false;
    }
  }

  getColumns(): TableColumn[] {
    return buildSimpleQueryColumns({
      definition: this.options.definition,
      connection: this.connection,
      sortState: this.sortState,
      filterState: this.filterState
    });
  }

  getSimpleName(): string {
    return `Query: ${this.options.definition.definition.label}`;
  }

  getDirtyObjects(): SchemaModelObject[] {
    return this._pages.flatMap((page) => page?.getDirtyObjects() || []);
  }
}
