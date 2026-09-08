import { inject, ReactorPanelModel } from '@journeyapps/reactor-mod';
import { ConnectionStore } from '../../stores/ConnectionStore';
import { observable } from 'mobx';
import { SchemaModelDefinition } from '../../core/SchemaModelDefinition';
import { SchemaModelObject } from '../../core/SchemaModelObject';
import { SharedConnectionPanelFactory } from './SharedConnectionPanelFactory';
import { AbstractConnection } from '../../core/AbstractConnection';

export interface SharedModelPanelModelOptions {
  definition: SchemaModelDefinition;
  model: SchemaModelObject;
}

export class SharedModelPanelModel extends ReactorPanelModel {
  @inject(ConnectionStore)
  accessor connStore: ConnectionStore;

  @observable
  accessor definition: SchemaModelDefinition;

  @observable
  accessor model: SchemaModelObject;

  constructor(type: string, options?: SharedModelPanelModelOptions) {
    super(type);
    this.setExpand(false, true);
    this.definition = options?.definition;
    this.model = options?.model;
  }

  encodeEntities() {
    return {
      definition: this.definition,
      model: this.model?.model ? this.model : null
    };
  }

  async decodeEntities(data: ReturnType<this['encodeEntities']>) {
    const definition = data.definition;
    const model = definition ? data.model || (await definition.generateNewModelObject()) : null;
    this.definition = definition;
    this.model = model;
  }
}

export abstract class SharedModelPanelFactory<T extends SharedModelPanelModel> extends SharedConnectionPanelFactory<T> {
  protected getConnection(model: T): AbstractConnection | null {
    return model.definition?.connection || null;
  }

  getSimpleName(model: T) {
    let _model = model.model;
    let _definition = model.definition;
    if (!_definition) {
      return super.getSimpleName(model);
    }
    if (_model) {
      return `${_definition.definition.label}: ${_model.data?.display || '(new object)'}`;
    }
    return `${_definition.definition.label}`;
  }
}
