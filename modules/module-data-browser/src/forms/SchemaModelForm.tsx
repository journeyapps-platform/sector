import { EntityInput, FormInput, FormModel, inject } from '@journeyapps/reactor-mod';
import { SchemaModelDefinition } from '../core/SchemaModelDefinition';
import { SchemaModelObject } from '../core/SchemaModelObject';
import * as _ from 'lodash';
import { DataBrowserEntities } from '../entities';
import { DirtyWrapperInput } from './inputs/DirtyWrapperInput';
import { TypeEngine, TypeHandler } from './TypeEngine';
import { autorun, IReactionDisposer } from 'mobx';
import { Variable } from '@journeyapps/db';
import { OrderedSchemaFieldType } from '../core/SchemaModelDefinition';

export interface SchemaModelFormOptions {
  definition: SchemaModelDefinition;
  object?: SchemaModelObject;
}

export interface BindingOption {
  input: FormInput;
  name: string;
  model: SchemaModelObject;
  resolve: () => Promise<any>;
}

export class Binding {
  @inject(TypeEngine)
  accessor typeEngine: TypeEngine;

  setting_value_via_autorun: boolean;

  private listener1: IReactionDisposer;
  private listener2: () => any;

  constructor(protected options: BindingOption) {
    const { input, model, name } = options;
    this.setting_value_via_autorun = false;
    this.listener2 = input.registerListener({
      valueChanged: async () => {
        if (this.setting_value_via_autorun) {
          return;
        }
        model.set(input.name, await this.encode(input.value));
      }
    });
    this.listener1 = autorun(async () => {
      let value = model.patch.get(name);
      if (!model.patch.has(name)) {
        value = await options.resolve();
      }
      this.setting_value_via_autorun = true;
      if (value == null) {
        input.setValue(null);
      } else {
        let decoded = await this.decode(value);
        input.setValue(decoded);
      }
      this.setting_value_via_autorun = false;
    });
  }

  async encode(value) {
    return value;
  }

  async decode(value) {
    return value;
  }

  get input() {
    return this.options.input;
  }

  dispose() {
    this.listener1();
    this.listener2();
  }
}

export class TypedBinding extends Binding {
  handler: TypeHandler;
  constructor(options: Omit<BindingOption & { variable: Variable }, 'resolve'>) {
    super({
      ...options,
      resolve: async () => {
        return options.model?.model?.[options.name];
      }
    });
    this.handler = this.typeEngine.getHandler(options.variable.type);
  }

  async encode(value) {
    return await this.handler.encode(value);
  }

  async decode(value) {
    return await this.handler.decode(value);
  }
}

export class SchemaModelForm extends FormModel {
  @inject(TypeEngine)
  accessor typeEngine: TypeEngine;

  bindings: Set<Binding>;

  constructor(protected options: SchemaModelFormOptions) {
    super();
    this.bindings = new Set<Binding>();
    options.definition
      .getOrderedFieldsAndRelationships()
      .map((entry) => {
        if (entry.type === OrderedSchemaFieldType.BELONGS_TO) {
          const relationship = entry.object;
          const definition = options.definition.connection.getSchemaModelDefinitionByName(
            relationship.foreignType.name
          );
          if (!definition) {
            return null;
          }

          const entity = new EntityInput({
            name: relationship.name,
            entityType: DataBrowserEntities.SCHEMA_MODEL_OBJECT,
            parent: definition,
            label: relationship.name,
            value: null
          });

          return new Binding({
            name: relationship.name,
            model: this.options.object,
            input: entity,
            resolve: () => {
              const objectId = options.object?.getBelongsToId(relationship.name);
              if (!objectId) {
                return null;
              }
              return definition.resolve(objectId);
            }
          });
        }

        const attribute = entry.object;
        let field = this.typeEngine.getHandler(attribute.type)?.generateField({
          name: attribute.name,
          label: attribute.label,
          type: attribute.type
        });
        if (!field) {
          return null;
        }

        return new TypedBinding({
          variable: attribute,
          model: this.options.object,
          input: field,
          name: attribute.name
        });
      })
      .filter((binding) => !!binding)
      .forEach((binding) => {
        this.bindings.add(binding);
        this.addInput(new DirtyWrapperInput(binding.input, options.object));
      });
  }

  dispose() {
    this.bindings.forEach((b) => {
      b.dispose();
    });
  }
}
