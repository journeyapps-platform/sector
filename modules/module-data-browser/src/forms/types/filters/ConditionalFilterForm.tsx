import { ArrayInput, FormInput, FormModel, GroupInput, SelectInput } from '@journeyapps/reactor-mod';
import { Condition, StatementMatch } from '../../../core/query/filters';

export interface ConditionalStatementValue<T = any> {
  condition: Condition;
  value: T;
}

export interface ConditionalFilterFormValue<T = any> {
  match: StatementMatch;
  statements: ConditionalStatementValue<T>[];
}

export interface ConditionalFilterFormOptions<T = any> {
  match?: StatementMatch;
  statements?: ConditionalStatementValue<T>[];
}

export abstract class ConditionalFilterForm<T = any> extends FormModel<ConditionalFilterFormValue<T>> {
  constructor(protected options2?: ConditionalFilterFormOptions<T>) {
    super();
    const matchInput = this.addInput(
      new SelectInput({
        name: 'match',
        label: 'Match',
        visible: false,
        value: options2?.match || StatementMatch.ALL,
        options: {
          [StatementMatch.ALL]: 'Match all conditions (AND)',
          [StatementMatch.ANY]: 'Match any condition (OR)'
        }
      })
    );
    const statementsInput = this.addInput(
      new ArrayInput<ConditionalStatementValue<T>>({
        name: 'statements',
        label: 'Conditions',
        value: this.getInitialStatements(),
        generate: () => {
          return new GroupInput<ConditionalStatementValue<T>>({
            name: 'statement',
            label: 'Condition',
            layout: {
              horizontal: true,
              border: false
            },
            inputs: [
              new SelectInput({
                name: 'condition',
                label: 'Operator',
                value: this.getDefaultCondition(),
                options: this.getConditionOptions()
              }),
              this.generateValueInput()
            ]
          });
        }
      })
    );
    const syncMatchVisibility = () => {
      const count = statementsInput.value?.length || 0;
      matchInput.update({
        visible: count > 1
      });
    };
    syncMatchVisibility();
    statementsInput.registerListener({
      valueChanged: () => {
        syncMatchVisibility();
      }
    });
  }

  private getInitialStatements(): ConditionalStatementValue<T>[] {
    if (this.options2?.statements && this.options2.statements.length > 0) {
      return this.options2.statements.map((statement) => ({
        condition: statement.condition || this.getDefaultCondition(),
        value: statement.value
      }));
    }
    return [
      {
        condition: this.getDefaultCondition(),
        value: this.getDefaultValue()
      }
    ];
  }

  protected getDefaultCondition(): Condition {
    return Condition.EQUALS;
  }

  protected getConditionOptions(): Record<string, string> {
    return {
      [Condition.GREATER_THAN]: '>',
      [Condition.GREATER_THAN_OR_EQUAL]: '>=',
      [Condition.EQUALS]: '=',
      [Condition.LESS_THAN]: '<',
      [Condition.LESS_THAN_OR_EQUAL]: '<=',
      [Condition.NOT_EQUALS]: '!='
    };
  }

  protected getDefaultValue(): T {
    return null;
  }

  protected abstract generateValueInput(): FormInput;
}
