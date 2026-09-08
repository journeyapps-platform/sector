import { TextType, Variable } from '@journeyapps/db';
import {
  DialogStore2,
  FormInput,
  FormInputRenderOptions,
  TableButtonWidget,
  TextArea,
  TextAreaInput,
  TextInput,
  TextInputType,
  ioc,
  styled
} from '@journeyapps/reactor-mod';
import * as React from 'react';
import { ModelJsonPanelModel } from '../../panels/model-json/ModelJsonPanelFactory';
import { TypeHandler, TypeHandlerContext } from './shared/type-handler';
import { TypeUI } from './shared/ui';
import { Condition, SimpleFilter, Statement, StatementMatch } from '../../core/query/filters';
import {
  ConditionalFilterForm,
  ConditionalFilterFormOptions,
  ConditionalFilterFormValue,
  ConditionalStatementValue
} from './filters/ConditionalFilterForm';
import { ClearableFilterFormDialogDirective } from './filters/ClearableFilterFormDialogDirective';

interface TextFilterFormValue extends ConditionalFilterFormValue<string> {
  statements: ConditionalStatementValue<string>[];
}

interface TextFilterFormOptions extends ConditionalFilterFormOptions<string> {
  type: TextType;
  statements?: ConditionalStatementValue<string>[];
}

const getRowsFromValue = (value?: string | null): number => {
  const lines = `${value || ''}`.split(/\r?\n/).length || 1;
  return Math.max(2, Math.min(12, lines));
};

class AutoRowsTextAreaInput extends TextAreaInput {
  renderControl(options: FormInputRenderOptions): React.JSX.Element {
    return (
      <TextArea
        data-1p-ignore="true"
        autoComplete="off"
        name={this.name}
        rows={getRowsFromValue(this.value)}
        value={this.value || ''}
        onChange={(event) => {
          this.setValue(event.target.value);
        }}
      />
    );
  }
}

const generateTextField = ({
  label,
  name,
  type,
  value
}: {
  label: string;
  name: string;
  type: TextType;
  value?: string;
}): FormInput => {
  if (type.subType == 'paragraph') {
    return new AutoRowsTextAreaInput({
      name,
      label,
      value
    });
  }

  if (type.subType == 'password') {
    return new TextInput({
      name,
      label,
      inputType: TextInputType.PASSWORD
    });
  }

  return new TextInput({
    name,
    label
  });
};

class TextFilterForm extends ConditionalFilterForm<string> {
  constructor(protected options2: TextFilterFormOptions) {
    super(options2);
  }

  static fromFilter(filter: SimpleFilter | undefined, type: TextType): TextFilterFormOptions {
    return {
      type,
      match: filter?.match || StatementMatch.ALL,
      statements: (filter?.statements || [])
        .map((statement) => ({
          condition: statement.condition || Condition.EQUALS,
          value: statement.arg == null ? '' : `${statement.arg}`
        }))
        .filter((statement) => statement.value.trim() !== '')
    };
  }

  toFilter(variable: Variable): SimpleFilter | null {
    const formValue = this.value() as TextFilterFormValue;
    const statements = (formValue.statements || [])
      .map((statement) => ({
        condition: statement?.condition || Condition.EQUALS,
        arg: statement?.value == null ? '' : `${statement.value}`.trim()
      }))
      .filter((statement) => statement.arg !== '')
      .map((statement) => new Statement(statement.condition, statement.arg));
    if (statements.length === 0) {
      return null;
    }
    return new SimpleFilter(variable, statements, formValue.match || StatementMatch.ALL);
  }

  protected generateValueInput(): FormInput {
    return generateTextField({
      name: 'value',
      label: 'Value',
      type: this.options2.type,
      value: this.getDefaultValue()
    });
  }

  protected getConditionOptions(): Record<string, string> {
    return {
      [Condition.EQUALS]: '=',
      [Condition.STARTS_WITH]: 'Starts with',
      [Condition.CONTAINS]: 'Contains'
    };
  }

  protected getDefaultCondition(): Condition {
    return Condition.CONTAINS;
  }

  protected getDefaultValue(): string {
    return '';
  }
}

export const textHandler = (context: TypeHandlerContext): TypeHandler<TextType, string, string> => {
  return {
    matches: (type) => type instanceof TextType,
    getTypeLabel: () => 'Text',
    encode: async (value: string) => value,
    decode: async (value: string) => value,
    encodeToScalar: async (value: string) => value,
    decodeFromScalar: async (value) => (value == null ? '' : `${value}`),
    generateField: ({ label, name, type }) => {
      return generateTextField({ label, name, type });
    },
    generateDisplay: ({ value, type, name, model }) => {
      if (value.trim() === '') {
        return <TypeUI.Empty>empty</TypeUI.Empty>;
      }

      if (type.subType == 'password') {
        return '****';
      }

      if (type.subType == 'paragraph') {
        if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
          try {
            JSON.parse(value);
            return (
              <TableButtonWidget
                icon="code"
                label="JSON"
                action={() => {
                  context.workspaceStore.addModel(
                    new ModelJsonPanelModel({
                      definition: model.definition,
                      model: model,
                      field: name
                    })
                  );
                }}
              />
            );
          } catch (ex) {}
        }
      }

      if (type.subType == 'url') {
        return (
          <S.Container>
            {value}
            <TableButtonWidget
              icon="arrow-right"
              action={() => {
                window.open(value, '_blank');
              }}
            />
          </S.Container>
        );
      }

      return <S.Max>{value}</S.Max>;
    },
    setupFilter: async ({ variable, filter }) => {
      if (!(variable.type instanceof TextType)) {
        return null;
      }

      const form = new TextFilterForm(TextFilterForm.fromFilter(filter, variable.type));
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
};

namespace S {
  export const Max = styled.div`
    max-width: 500px;
    white-space: pre;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
  `;

  export const Container = styled.div`
    display: flex;
    flex-direction: row;
    column-gap: 5px;
    align-items: center;
    justify-content: space-between;
    flex-grow: 1;
  `;
}
