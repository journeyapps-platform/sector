import { Query, Variable } from '@journeyapps/db';
import { EntityLabel } from '@journeyapps/reactor-mod';
import { BaseObserver } from '@journeyapps/common-utils';

export interface AbstractFilterListener {
  removeRequested: () => any;
}

export abstract class AbstractFilter extends BaseObserver<AbstractFilterListener> {
  constructor() {
    super();
  }

  delete() {
    this.iterateListeners((listener) => listener.removeRequested?.());
  }

  abstract augment(query: Query);
}

export enum Condition {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  STARTS_WITH = 'starts with',
  CONTAINS = 'contains'
}

export enum StatementMatch {
  ANY = 'ANY',
  ALL = 'ALL'
}

export enum FilterType {
  SIMPLE = 'simple'
}

export interface SerializedStatement {
  condition: Condition;
  arg: any;
}

export interface SerializedSimpleFilter {
  type: FilterType;
  variable: string;
  match?: StatementMatch;
  statements: SerializedStatement[];
}

export class Statement {
  constructor(
    public condition: Condition,
    public arg: any
  ) {}

  serialize(): SerializedStatement {
    return {
      condition: this.condition,
      arg: this.arg
    };
  }

  static deserialize(data: SerializedStatement): Statement {
    if (
      data.condition === Condition.EQUALS ||
      data.condition === Condition.NOT_EQUALS ||
      data.condition === Condition.GREATER_THAN ||
      data.condition === Condition.GREATER_THAN_OR_EQUAL ||
      data.condition === Condition.LESS_THAN ||
      data.condition === Condition.LESS_THAN_OR_EQUAL ||
      data.condition === Condition.STARTS_WITH ||
      data.condition === Condition.CONTAINS
    ) {
      return new Statement(data.condition, data.arg);
    }
    throw new Error(`Unsupported statement condition: ${data.condition}`);
  }

  getMetadataLabel(): EntityLabel {
    return {
      label: this.condition,
      value: `${this.arg}`
    };
  }
}

export class SimpleFilter extends AbstractFilter {
  readonly type = FilterType.SIMPLE;
  public statements: Statement[];
  public match: StatementMatch;

  constructor(
    variable: Variable,
    statements: (Statement | SerializedStatement)[],
    match: StatementMatch = StatementMatch.ANY
  ) {
    super();
    this.variable = variable;
    this.match = match;
    this.statements = (statements || []).map((statement) => {
      if (statement instanceof Statement) {
        return statement;
      }
      return Statement.deserialize(statement);
    });
  }

  public variable: Variable;

  augment(query: Query) {
    const separator = this.match === StatementMatch.ALL ? ' and ' : ' or ';
    return query.where(
      this.statements.map((s) => `${this.variable.name} ${s.condition} ?`).join(separator),
      ...this.statements.map((s) => s.arg)
    );
  }

  serialize(): SerializedSimpleFilter {
    return {
      type: this.type,
      variable: this.variable.name,
      match: this.match,
      statements: this.statements.map((statement) => statement.serialize())
    };
  }

  static deserialize(variable: Variable, data: SerializedSimpleFilter): SimpleFilter {
    return new SimpleFilter(variable, data?.statements || [], data?.match || StatementMatch.ANY);
  }

  static canDeserialize(data: any): data is SerializedSimpleFilter {
    return !!data && (data.type == null || data.type === FilterType.SIMPLE);
  }

  getMetadata() {
    if (!this.statements || this.statements.length === 0) {
      return [];
    }

    return this.statements.map((statement) => statement.getMetadataLabel());
  }
}
