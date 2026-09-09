import { Variable } from '@journeyapps/db';
import { ArrayInput, DialogStore2, EntityInput, FormModel, ioc } from '@journeyapps/reactor-mod';
import { Relationship } from '@journeyapps/parser-schema';
import { SchemaModelDefinition } from '../../core/SchemaModelDefinition';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { Condition, SimpleFilter, Statement, StatementMatch } from '../../core/query/filters';
import { DataBrowserEntities } from '../../entities';
import { ClearableFilterFormDialogDirective } from './filters/ClearableFilterFormDialogDirective';

interface BelongsToFilterFormValue {
  values: (SchemaModelObject | null)[];
}

class BelongsToFilterForm extends FormModel<BelongsToFilterFormValue> {
  constructor(private foreignDefinition: SchemaModelDefinition) {
    super();

    this.addInput(
      new ArrayInput({
        name: 'values',
        label: 'Matches any of',
        value: [null],
        generate: () => {
          return new EntityInput({
            name: 'value',
            label: foreignDefinition.definition.label || foreignDefinition.definition.name,
            entityType: DataBrowserEntities.SCHEMA_MODEL_OBJECT,
            parent: foreignDefinition,
            value: null
          });
        }
      })
    );
  }

  async hydrateFromFilter(filter?: SimpleFilter) {
    const values = await Promise.all(
      (filter?.statements || [])
        .map((statement) => `${statement.arg || ''}`)
        .filter((id) => !!id)
        .map((id) => this.foreignDefinition.resolve(id))
    );
    this.setValues({
      values: values.filter((value) => !!value).length > 0 ? values.filter((value) => !!value) : [null]
    });
  }

  toFilter(variable: Variable): SimpleFilter | null {
    const values = (this.value()?.values || []).filter((value) => !!value?.id);
    if (values.length === 0) {
      return null;
    }
    return new SimpleFilter(
      variable,
      values.map((value) => new Statement(Condition.EQUALS, value.id)),
      StatementMatch.ANY
    );
  }
}

export const setupBelongsToFilter = async (options: {
  definition: SchemaModelDefinition;
  relationship: Relationship;
  variable: Variable;
  filter?: SimpleFilter;
}) => {
  const foreignDefinition = options.definition.connection.getSchemaModelDefinitionByName(
    options.relationship.foreignType.name
  );
  const form = new BelongsToFilterForm(foreignDefinition);
  await form.hydrateFromFilter(options.filter);
  const result = await ioc.get(DialogStore2).showDialog(
    new ClearableFilterFormDialogDirective({
      title: `Filter ${options.relationship.name}`,
      form,
      filter: options.filter,
      handler: async () => {}
    })
  );
  if (!result) {
    return null;
  }
  return form.toFilter(options.variable);
};
