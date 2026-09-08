import { BaseObserver } from '@journeyapps/common-utils';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface SerializedSimpleQuerySort {
  field: string;
  direction: SortDirection;
}

export interface SimpleQuerySortListener {
  changed: () => any;
  removeRequested: () => any;
}

export class SimpleQuerySort extends BaseObserver<SimpleQuerySortListener> {
  constructor(
    public field: string,
    public direction: SortDirection
  ) {
    super();
  }

  static deserialize(value: SerializedSimpleQuerySort): SimpleQuerySort {
    return new SimpleQuerySort(value.field, value.direction);
  }

  static create(field: string, direction: SortDirection = SortDirection.ASC): SimpleQuerySort {
    return new SimpleQuerySort(field, direction);
  }

  serialize(): SerializedSimpleQuerySort {
    return {
      field: this.field,
      direction: this.direction
    };
  }

  setDirection(direction: SortDirection): boolean {
    if (this.direction === direction) {
      return false;
    }
    this.direction = direction;
    this.iterateListeners((listener) => listener.changed?.());
    return true;
  }

  toggle(): void {
    if (this.direction === SortDirection.ASC) {
      this.setDirection(SortDirection.DESC);
      return;
    }
    this.remove();
  }

  remove(): void {
    this.iterateListeners((listener) => listener.removeRequested?.());
  }
}
