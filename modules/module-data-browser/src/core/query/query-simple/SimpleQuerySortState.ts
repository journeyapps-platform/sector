import { observable } from 'mobx';
import * as _ from 'lodash';
import { BaseObserver } from '@journeyapps/common-utils';
import { SchemaModelDefinition } from '../../SchemaModelDefinition';
import { SerializedSimpleQuerySort, SimpleQuerySort, SortDirection } from './SimpleQueryTypes';
import { STANDARD_MODEL_FIELD_LABELS, StandardModelFields } from '../StandardModelFields';

export interface SimpleQuerySortStateListener {
  changed: () => any;
}

export class SimpleQuerySortState extends BaseObserver<SimpleQuerySortStateListener> {
  @observable
  accessor sorts: SimpleQuerySort[];

  accessor definition: SchemaModelDefinition | undefined;

  constructor(definition?: SchemaModelDefinition) {
    super();
    this.sorts = [];
    this.definition = definition;
  }

  setDefinition(definition: SchemaModelDefinition | undefined) {
    const changed = this.definition?.definition?.name !== definition?.definition?.name;
    this.definition = definition;
    if (changed) {
      this.iterateListeners((cb) => cb.changed?.());
    }
    return changed;
  }

  getSort(field: string): SimpleQuerySort | undefined {
    return this.sorts.find((sort) => sort.field === field);
  }

  addSort(sort: SimpleQuerySort): boolean {
    if (!sort?.field) {
      return false;
    }
    const existing = this.getSort(sort.field);
    if (existing) {
      return false;
    }
    let unsubscribe = sort.registerListener({
      changed: () => {
        this.iterateListeners((cb) => cb.changed?.());
      },
      removeRequested: () => {
        unsubscribe();
        this.sorts = this.sorts.filter((entry) => entry !== sort);
        this.iterateListeners((cb) => cb.changed?.());
      }
    });
    this.sorts = [...this.sorts, sort];
    this.iterateListeners((cb) => cb.changed?.());
    return true;
  }

  moveSortBefore(sourceField: string, targetField: string): boolean {
    if (!sourceField || !targetField || sourceField === targetField) {
      return false;
    }
    const sourceIndex = this.sorts.findIndex((sort) => sort.field === sourceField);
    const targetIndex = this.sorts.findIndex((sort) => sort.field === targetField);
    if (sourceIndex < 0 || targetIndex < 0) {
      return false;
    }
    const next = [...this.sorts];
    const [source] = next.splice(sourceIndex, 1);
    const nextTargetIndex = next.findIndex((sort) => sort.field === targetField);
    const insertIndex = sourceIndex < targetIndex ? nextTargetIndex + 1 : nextTargetIndex;
    next.splice(insertIndex, 0, source);
    this.sorts = next;
    this.iterateListeners((cb) => cb.changed?.());
    return true;
  }

  setSorts(sorts: SimpleQuerySort[]) {
    const next = this.normalizeSorts(sorts);
    [...this.sorts].forEach((sort) => sort.remove());
    this.sorts = [];
    next.forEach((sort) => this.addSort(sort));
    return true;
  }

  hydrateSorts(serializedSorts: SerializedSimpleQuerySort[] = []) {
    const next = (serializedSorts || []).map((sort) => SimpleQuerySort.deserialize(sort));
    return this.setSorts(next);
  }

  getSerializedSorts(): SerializedSimpleQuerySort[] {
    return this.sorts.map((sort) => sort.serialize());
  }

  getSortableFields(): { key: string; label: string }[] {
    const definition = this.definition;
    if (!definition?.definition) {
      return [];
    }
    const dynamic = _.map(definition.definition.attributes, (attribute) => {
      return {
        key: attribute.name,
        label: attribute.label || attribute.name
      };
    });
    return [
      {
        key: StandardModelFields.UPDATED_AT,
        label: STANDARD_MODEL_FIELD_LABELS[StandardModelFields.UPDATED_AT]
      },
      ...dynamic
    ];
  }

  private normalizeSorts(sorts: SimpleQuerySort[]): SimpleQuerySort[] {
    const seen = new Set<string>();
    return (sorts || []).filter((sort) => {
      if (!sort?.field) {
        return false;
      }
      if (!(sort.direction === SortDirection.ASC || sort.direction === SortDirection.DESC)) {
        return false;
      }
      if (seen.has(sort.field)) {
        return false;
      }
      seen.add(sort.field);
      return true;
    });
  }
}
