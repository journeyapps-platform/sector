import { TableColumn } from '@journeyapps/reactor-mod';
import { SchemaModelObject } from '../../SchemaModelObject';
import { AbstractQuery } from '../AbstractQuery';
import { Page } from '../Page';
import { SimpleQuery } from '../query-simple/SimpleQuery';
import * as _ from 'lodash';

export class ChangedModelQuery extends AbstractQuery {
  constructor(protected query: SimpleQuery) {
    super(query.type, query.connection);
  }

  getDirtyObjects(): SchemaModelObject[] {
    return this.query.getDirtyObjects();
  }
  getSimpleName(): string {
    return `Changed models`;
  }
  async load(): Promise<any> {}

  getColumns(): TableColumn[] {
    return this.query.getColumns();
  }
  get totalPages(): number {
    return 1;
  }
  getPage(number: number): Page {
    let page = new Page({
      definition: this.query.options.definition,
      index: 0
    });
    page.loading = false;
    page.models = this.query.getDirtyObjects();
    return page;
  }

  matches(query: AbstractQuery): boolean {
    if (query instanceof ChangedModelQuery) {
      return _.isEqual(query.query.serialize(), this.query.serialize());
    }
    return false;
  }
}
