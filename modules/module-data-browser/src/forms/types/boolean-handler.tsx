import { BooleanType, Variable } from '@journeyapps/db';
import { BooleanInput, CheckboxWidget, DialogStore2, FormModel, ioc } from '@journeyapps/reactor-mod';
import * as React from 'react';
import { TypeHandler } from './shared/type-handler';
import { ClearableFilterFormDialogDirective } from './filters/ClearableFilterFormDialogDirective';
import { Condition, SimpleFilter, Statement } from '../../core/query/filters';

interface BooleanFilterFormValue {
  value: boolean;
}

class BooleanFilterForm extends FormModel<BooleanFilterFormValue> {
  constructor(value?: boolean) {
    super();

    this.addInput(
      new BooleanInput({
        name: 'value',
        label: 'Value',
        value: value === true
      })
    );
  }

  static fromFilter(filter?: SimpleFilter): boolean {
    return filter?.statements?.[0]?.arg === true;
  }

  toFilter(variable: Variable): SimpleFilter {
    return new SimpleFilter(variable, [new Statement(Condition.EQUALS, this.value().value === true)]);
  }
}

export const booleanHandler: TypeHandler = {
  matches: (type) => type instanceof BooleanType,
  getTypeLabel: () => 'Boolean',
  encode: async (value: boolean) => value,
  decode: async (value: boolean) => value,
  encodeToScalar: async (value: boolean) => value,
  decodeFromScalar: async (value) => value === true || value === 'true',
  generateField: ({ label, name }) => {
    return new BooleanInput({
      name,
      label
    });
  },
  generateDisplay: ({ value, name, model }) => {
    return (
      <CheckboxWidget
        checked={value}
        onChange={(checked) => {
          model.set(name, checked);
        }}
      />
    );
  },
  setupFilter: async ({ variable, filter }) => {
    const form = new BooleanFilterForm(BooleanFilterForm.fromFilter(filter));
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
