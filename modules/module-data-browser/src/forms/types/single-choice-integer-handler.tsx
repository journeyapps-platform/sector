import { SingleChoiceIntegerType } from '@journeyapps/db';
import { ComboBoxStore, ioc, SelectInput } from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { TypeHandler } from './shared/type-handler';
import { Condition, SimpleFilter, Statement } from '../../core/query/filters';

export const singleChoiceIntegerHandler: TypeHandler = {
  matches: (type) => type instanceof SingleChoiceIntegerType,
  getTypeLabel: () => 'Single choice integer',
  encode: async (value: string) => parseInt(value),
  decode: async (value: number) => `${value}`,
  encodeToScalar: async (value: string) => value,
  decodeFromScalar: async (value) => (value == null ? '' : `${value}`),
  generateField: ({ label, name, type }) => {
    return new SelectInput({
      name,
      label,
      options: _.mapValues(type.options, (o) => `${o.value}`)
    });
  },
  generateDisplay: ({ value }) => {
    return `${value}`;
  },
  setupFilter: async ({ variable, filter, position }) => {
    if (!(variable.type instanceof SingleChoiceIntegerType)) {
      return null;
    }
    const results = await ioc.get(ComboBoxStore).showMultiSelectComboBox(
      _.map(variable.type.options, (option) => {
        return {
          title: `${option.value}`,
          key: `${option.value}`,
          checked: !!filter?.statements?.find((s) => s.arg === `${option.value}`)
        };
      }),
      position as any
    );
    if (results.length === 0) {
      return null;
    }
    return new SimpleFilter(
      variable,
      results.map((r) => {
        return new Statement(Condition.EQUALS, r.key);
      })
    );
  }
};
