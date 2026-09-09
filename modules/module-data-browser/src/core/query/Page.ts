import { SchemaModelObject } from '../SchemaModelObject';
import { TableRow } from '@journeyapps/reactor-mod';
import { observable } from 'mobx';
import { SchemaModelDefinition } from '../SchemaModelDefinition';

export interface PageRow extends TableRow {
  model: SchemaModelObject;
  definition: SchemaModelDefinition;
}

export interface PageOptions {
  definition: SchemaModelDefinition;
  index: number;
}

export class Page {
  @observable
  accessor models: SchemaModelObject[];

  @observable
  accessor loading: boolean;

  constructor(protected options: PageOptions) {
    this.loading = true;
    this.models = [];
  }

  get index() {
    return this.options.index;
  }

  reset() {
    this.models.forEach((m) => {
      m.patch.clear();
    });
  }

  getDirtyObjects() {
    return this.models.filter((m) => m.patch.size > 0);
  }

  asRows(): PageRow[] {
    return this.models.map((m) => {
      return {
        key: m.model.id,
        cells: m.model,
        definition: this.options.definition,
        model: m
      };
    });
  }
}
