import { DatetimeType, DateType, Day, Variable } from '@journeyapps/db';
import {
  DateInput,
  DateTimePickerType,
  DialogStore2,
  FormInput,
  SmartDateDisplayWidget,
  ioc
} from '@journeyapps/reactor-mod';
import * as React from 'react';
import { TypeHandler } from './shared/type-handler';
import { Condition, SimpleFilter, Statement, StatementMatch } from '../../core/query/filters';
import {
  ConditionalFilterForm,
  ConditionalFilterFormOptions,
  ConditionalFilterFormValue,
  ConditionalStatementValue
} from './filters/ConditionalFilterForm';
import { ClearableFilterFormDialogDirective } from './filters/ClearableFilterFormDialogDirective';

interface DateFilterFormValue extends ConditionalFilterFormValue<Date> {
  statements: ConditionalStatementValue<Date>[];
}

interface DateFilterFormOptions extends ConditionalFilterFormOptions<Date> {
  pickerType: DateTimePickerType;
  statements?: ConditionalStatementValue<Date>[];
}

class DateFilterForm extends ConditionalFilterForm<Date> {
  constructor(protected options2: DateFilterFormOptions) {
    super(options2);
  }

  static fromFilter(filter: SimpleFilter | undefined, pickerType: DateTimePickerType): DateFilterFormOptions {
    return {
      pickerType,
      match: filter?.match || StatementMatch.ALL,
      statements: (filter?.statements || [])
        .map((statement) => ({
          condition: statement.condition || Condition.EQUALS,
          value: toDateValue(statement.arg)
        }))
        .filter((statement) => !!statement.value)
    };
  }

  toFilter(variable: Variable): SimpleFilter | null {
    const formValue = this.value() as DateFilterFormValue;
    const statements = (formValue.statements || [])
      .map((statement) => ({
        condition: statement?.condition || Condition.EQUALS,
        arg: toDateValue(statement?.value)
      }))
      .filter((statement) => !!statement.arg)
      .map((statement) => new Statement(statement.condition, new Day(statement.arg)));
    if (statements.length === 0) {
      return null;
    }
    return new SimpleFilter(variable, statements, formValue.match || StatementMatch.ALL);
  }

  protected generateValueInput(): FormInput {
    return new DateInput({
      name: 'value',
      label: 'Value',
      required: true,
      type: this.options2.pickerType
    });
  }
}

const toDateValue = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Day) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(`${value}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const dateHandler: TypeHandler = {
  matches: (type) => type instanceof DatetimeType || type instanceof DateType,
  getTypeLabel: (type) => (type instanceof DatetimeType ? 'Datetime' : 'Date'),
  encode: async (value: Date) => new Day(value),
  decode: async (value: Day | Date) => toDateValue(value),
  encodeToScalar: async (value: Date) => value?.toISOString() || null,
  decodeFromScalar: async (value) => toDateValue(value),
  generateField: ({ label, name, type }) => {
    return new DateInput({
      name,
      label,
      type: type instanceof DatetimeType ? DateTimePickerType.DATETIME : DateTimePickerType.DATE
    });
  },
  generateDisplay: ({ value }) => {
    if (value instanceof Day) {
      return <SmartDateDisplayWidget date={value.toDate()} />;
    }
    return <SmartDateDisplayWidget date={value} />;
  },
  setupFilter: async ({ variable, filter }) => {
    if (!(variable.type instanceof DatetimeType || variable.type instanceof DateType)) {
      return null;
    }
    const pickerType = variable.type instanceof DatetimeType ? DateTimePickerType.DATETIME : DateTimePickerType.DATE;
    const form = new DateFilterForm(DateFilterForm.fromFilter(filter, pickerType));
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
