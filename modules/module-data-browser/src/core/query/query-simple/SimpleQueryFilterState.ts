import { Variable } from '@journeyapps/db';
import * as _ from 'lodash';
import { BaseObserver } from '@journeyapps/common-utils';
import { FilterableField, SchemaModelDefinition } from '../../SchemaModelDefinition';
import { SerializedSimpleFilter, SimpleFilter } from '../filters';
import { TypeEngine } from '../../../forms/TypeEngine';
import { setupBelongsToFilter } from '../../../forms/types/belongs-to-filter';
import { idVariable, StandardModelFields } from '../StandardModelFields';

export interface SimpleQueryFilterStateListener {
  changed: () => any;
}

export interface SimpleQueryFilterStateOptions {
  definition?: SchemaModelDefinition;
  typeEngine: TypeEngine;
}

export interface ActiveFilterEntry {
  variable: Variable;
  filter: SimpleFilter;
}

export class SimpleQueryFilterState extends BaseObserver<SimpleQueryFilterStateListener> {
  readonly simpleFilters: Map<Variable, SimpleFilter>;
  accessor definition: SchemaModelDefinition | undefined;
  readonly typeEngine: TypeEngine;

  constructor(options: SimpleQueryFilterStateOptions) {
    super();
    this.simpleFilters = new Map();
    this.definition = options.definition;
    this.typeEngine = options.typeEngine;
  }

  get filters(): SimpleFilter[] {
    return Array.from(this.simpleFilters.values());
  }

  clear() {
    this.filters.forEach((filter) => filter.delete());
  }

  setDefinition(definition: SchemaModelDefinition | undefined) {
    const definitionChanged = this.definition?.definition?.name !== definition?.definition?.name;
    this.definition = definition;
    const hadFilters = this.simpleFilters.size > 0;
    if (definitionChanged) {
      this.clear();
    }
    if (definitionChanged && !hadFilters) {
      this.iterateListeners((cb) => cb.changed?.());
    }
    return definitionChanged || hadFilters;
  }

  getFilterableFields(): FilterableField[] {
    if (!this.definition?.definition) {
      return [];
    }
    return this.definition.getFilterableFields(this.typeEngine);
  }

  getActiveFilters(): ActiveFilterEntry[] {
    return Array.from(this.simpleFilters.entries()).map(([variable, filter]) => {
      return {
        variable,
        filter
      };
    });
  }

  getFilter(field: string): SimpleFilter | undefined {
    const variable = this.resolveField(field);
    return variable ? this.simpleFilters.get(variable) : undefined;
  }

  getSerializedFilters() {
    return this.filters.map((filter) => filter.serialize());
  }

  hydrateFilters(filters: SerializedSimpleFilter[]) {
    this.clear();
    const definition = this.definition;
    if (!definition?.definition) {
      return;
    }
    (filters || []).forEach((filter) => {
      if (!SimpleFilter.canDeserialize(filter)) {
        return;
      }
      const variable = this.resolveField(filter.variable);
      if (!variable) {
        return;
      }
      this.addFilter(variable, SimpleFilter.deserialize(variable, filter));
    });
  }

  setFilter(field: string, filter: SimpleFilter) {
    const variable = this.resolveField(field);
    if (!variable) {
      return false;
    }
    return this.addFilter(variable, filter);
  }

  async setupFilterForField(field: string, position?: MouseEvent): Promise<boolean> {
    const relationship = this.resolveBelongsToField(field);
    if (relationship) {
      const existing = this.simpleFilters.get(relationship.variable);
      const nextFilter = await setupBelongsToFilter({
        definition: this.definition,
        relationship: relationship.relationship,
        variable: relationship.variable,
        filter: existing
      });
      if (!nextFilter) {
        return false;
      }
      return this.addFilter(relationship.variable, nextFilter);
    }
    const variable = this.resolveField(field);
    if (!variable) {
      return false;
    }
    const handler = this.typeEngine.getHandler(variable.type);
    if (!handler?.setupFilter) {
      return false;
    }
    const existing = this.simpleFilters.get(variable);
    const nextFilter = await handler.setupFilter({
      variable,
      filter: existing,
      position
    });
    if (!nextFilter) {
      return false;
    }
    return this.addFilter(variable, nextFilter);
  }

  private addFilter(variable: Variable, filter: SimpleFilter): boolean {
    const existing = this.simpleFilters.get(variable);
    if (existing && existing !== filter) {
      existing.delete();
    }
    if (existing === filter) {
      this.iterateListeners((cb) => cb.changed?.());
      return true;
    }
    let unsubscribe = filter.registerListener({
      removeRequested: () => {
        unsubscribe();
        if (this.simpleFilters.get(variable) === filter) {
          this.simpleFilters.delete(variable);
          this.iterateListeners((cb) => cb.changed?.());
        }
      }
    });
    this.simpleFilters.set(variable, filter);
    this.iterateListeners((cb) => cb.changed?.());
    return true;
  }

  private resolveField(field: string): Variable | undefined {
    if (!this.definition?.definition) {
      return undefined;
    }
    if (field === StandardModelFields.ID) {
      return idVariable;
    }
    const relationship = this.resolveBelongsToField(field);
    if (relationship) {
      return relationship.variable;
    }
    return _.find(_.values(this.definition.definition.attributes), (attribute) => {
      return attribute.name === field;
    });
  }

  private resolveBelongsToField(field: string):
    | {
        variable: Variable;
        relationship: any;
      }
    | undefined {
    if (!this.definition?.definition) {
      return undefined;
    }
    return this.definition.getBelongsToRelationshipForField(field);
  }
}
