import { MultipleChoiceType } from '@journeyapps/db';
import { MultiSelectInput } from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { TypeHandler, TypeHandlerContext } from './shared/type-handler';

export const multipleChoiceHandler = (context: TypeHandlerContext): TypeHandler => {
  return {
    matches: (type) => type instanceof MultipleChoiceType,
    getTypeLabel: () => 'Multiple choice',
    encode: async (value: string[]) => value,
    decode: async (value: string[]) => value,
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
