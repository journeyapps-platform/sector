import { IntegerType, NumberType, Variable } from '@journeyapps/db';
import { DialogStore2, FormInput, NumberInput, ioc } from '@journeyapps/reactor-mod';
import { TypeHandler } from './shared/type-handler';
import { Condition, SimpleFilter, Statement, StatementMatch } from '../../core/query/filters';
import {
  ConditionalFilterForm,
  ConditionalFilterFormOptions,
  ConditionalFilterFormValue,
  ConditionalStatementValue
} from './filters/ConditionalFilterForm';
import { ClearableFilterFormDialogDirective } from './filters/ClearableFilterFormDialogDirective';

interface NumberFilterFormValue extends ConditionalFilterFormValue<number> {
  statements: ConditionalStatementValue<number>[];
}

interface NumberFilterFormOptions extends ConditionalFilterFormOptions<number> {
  statements?: ConditionalStatementValue<number>[];
}

const toNumericValue = (value: unknown): number | undefined => {
  if (value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

class NumberFilterForm extends ConditionalFilterForm<number> {
  constructor(options?: NumberFilterFormOptions) {
    super(options);
  }

  static fromFilter(filter?: SimpleFilter): NumberFilterFormOptions {
    return {
      match: filter?.match || StatementMatch.ALL,
      statements: (filter?.statements || [])
        .map((statement) => ({
          condition: statement.condition || Condition.EQUALS,
          value: toNumericValue(statement.arg)
        }))
        .filter((statement) => statement.value != null)
    };
  }

  toFilter(variable: Variable): SimpleFilter | null {
    const formValue = this.value() as NumberFilterFormValue;
    const statements = (formValue.statements || [])
      .map((statement) => ({
        condition: statement?.condition || Condition.EQUALS,
        arg: toNumericValue(statement?.value)
      }))
      .filter((statement) => statement.arg != null)
      .map((statement) => new Statement(statement.condition, statement.arg));
    if (statements.length === 0) {
      return null;
    }
    return new SimpleFilter(variable, statements, formValue.match || StatementMatch.ALL);
  }

  protected generateValueInput(): FormInput {
    return new NumberInput({
      name: 'value',
      label: 'Value',
      required: true
    });
  }
}

export const numberHandler: TypeHandler = {
  matches: (type) => type instanceof NumberType || type instanceof IntegerType,
  getTypeLabel: (type) => (type instanceof IntegerType ? 'Integer' : 'Number'),
  encode: async (value: number) => value,
  decode: async (value: number) => value,
  encodeToScalar: async (value: number) => value,
  decodeFromScalar: async (value) => toNumericValue(value) || 0,
  generateField: ({ label, name }) => {
    return new NumberInput({
      name,
      label
    });
  },
  generateDisplay: ({ value }) => {
    return `${value}`;
  },
  setupFilter: async ({ variable, filter }) => {
    const form = new NumberFilterForm(NumberFilterForm.fromFilter(filter));
    const result = await ioc.get(DialogStore2).showDialog(
      new ClearableFilterFormDialogDirective({
        title: `Filter ${variable.label || variable.name}`,
        form,
        filter,
        handler: async () => {}
      })
    );
    if (!result) {
      return null;
    }
    return form.toFilter(variable);
  }
};
