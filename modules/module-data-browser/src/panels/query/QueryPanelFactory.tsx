import * as React from 'react';
import { inject, ioc, ReactorPanelModel } from '@journeyapps/reactor-mod';
import { QueryPanelWidget } from './QueryPanelWidget';
import { AbstractQuery } from '../../core/query/AbstractQuery';
import { ConnectionStore } from '../../stores/ConnectionStore';
import { observable, observableRef } from 'mobx';
import { WorkspaceEngine, WorkspaceModelFactoryEvent } from '@projectstorm/react-workspaces-core';
import { AbstractSerializableQuery } from '../../core/query/AbstractSerializableQuery';
import { SavedQueryStore } from '../../stores/SavedQueryStore';
import { AbstractConnection } from '../../core/AbstractConnection';
import { SharedConnectionPanelFactory } from '../_shared/SharedConnectionPanelFactory';
import { Page } from '../../core/query/Page';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { action } from 'mobx';
import * as _ from 'lodash';

export class QueryPanelModel extends ReactorPanelModel {
  @inject(ConnectionStore)
  accessor connStore: ConnectionStore;

  @observable
  accessor query: AbstractQuery;

  @observable
  accessor current_page: number;

  @observableRef
  accessor current_page_data: Page | null;

  @observableRef
  accessor selected_models: SchemaModelObject[];

  accessor table_scroll_top: number;
  accessor table_scroll_left: number;

  constructor(query: AbstractQuery) {
    super(QueryPanelFactory.TYPE);
    this.setExpand(true, true);
    this.query = query;
    this.current_page = 0;
    this.current_page_data = null;
    this.selected_models = [];
    this.table_scroll_top = 0;
    this.table_scroll_left = 0;
  }

  @action clearSelection() {
    this.selected_models = [];
  }

  @action mergeSelectionForPage(event: { page: Page; models: SchemaModelObject[] }) {
    const pageRowKeys = new Set(event.page.asRows().map((row) => row.key));
    const nextSelectedModels = this.selected_models.filter((model) => !pageRowKeys.has(model.id));
    this.selected_models = _.uniqBy([...nextSelectedModels, ...event.models], (model) => model.id);
  }

  @action async reloadQuery() {
    this.clearSelection();
    await this.query.load();
  }

  isSerializable() {
    return this.query instanceof AbstractSerializableQuery;
  }

  toArray() {
    return {
      ...super.toArray(),
      current_page: this.current_page
    };
  }

  fromArray(data: ReturnType<this['toArray']>, engine: WorkspaceEngine) {
    super.fromArray(data, engine);
    this.current_page = data.current_page || 0;
  }

  encodeEntities() {
    return {
      query: this.query
    };
  }

  decodeEntities(data: ReturnType<this['encodeEntities']>) {
    this.query = data.query;
    this.current_page_data = null;
  }

  async loadSavedQuery(id: string): Promise<void> {
    const query = await ioc.get(SavedQueryStore).loadSavedQuery(id);
    if (!query) {
      return;
    }
    this.current_page = 0;
    this.current_page_data = null;
    this.clearSelection();
    this.query = query;
    await query.load();
  }
}

export class QueryPanelFactory extends SharedConnectionPanelFactory<QueryPanelModel> {
  static TYPE = 'query';

  constructor() {
    super({
      icon: 'table',
      color: 'rgb(0,192,255)',
      name: 'Query',
      allowManualCreation: false,
      isMultiple: true,
      renderTitlebar: true,
      type: QueryPanelFactory.TYPE,
      category: 'Databrowser'
    });
  }

  matchesModel(m1: QueryPanelModel, m2: QueryPanelModel) {
    return m1.query.matches(m2.query);
  }

  getSimpleName(model: QueryPanelModel): string {
    return model.query?.getSimpleName();
  }

  protected getConnection(model: QueryPanelModel): AbstractConnection | null {
    return model.query?.connection || null;
  }

  _generateModel(): QueryPanelModel {
    return new QueryPanelModel(null);
  }

  generatePanelContent(event: WorkspaceModelFactoryEvent<QueryPanelModel>): React.JSX.Element {
    return <QueryPanelWidget key={event.model.id} model={event.model} />;
  }
}
