import { MultipleChoiceIntegerType } from '@journeyapps/db';
import { MultiSelectInput } from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { TypeHandler, TypeHandlerContext } from './shared/type-handler';

export const multipleChoiceIntegerHandler = (context: TypeHandlerContext): TypeHandler => {
  return {
    matches: (type) => type instanceof MultipleChoiceIntegerType,
    getTypeLabel: () => 'Multiple choice integer',
    encode: async (value: string[]) => value.map((v) => parseInt(v)),
    decode: async (value: number[]) => value.map((v) => `${v}`),
    encodeToScalar: async (value: string[]) => JSON.stringify(value || []),
    decodeFromScalar: async (value) => {
      if (typeof value !== 'string') {
        return [];
      }
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((v) => `${v}`) : [];
      } catch (error) {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v !== '');
      }
    },
    generateField: ({ label, name, type }) => {
      return new MultiSelectInput({
        name,
        label,
        options: _.mapValues(type.options, (o) => `${o.value}`)
      });
    },
    generateDisplay: ({ value }) => {
      return context.displayArray(value);
    }
  };
};
