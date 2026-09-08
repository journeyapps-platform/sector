import { FormModel, SelectInput, TextInput, TextInputType } from '@journeyapps/reactor-mod';
import { ManualConnection } from '../core/types/ManualConnection';
import { ManualConnectionFactory } from '../core/types/ManualConnectionFactory';
import { DEFAULT_CONNECTION_COLOR, getConnectionColorSetOptions } from '../core/connection-colors';

export interface APIConnectionFormValue {
  name: string;
  base_url: string;
  api_token: string;
  color: string;
}

export class APIConnectionForm extends FormModel<APIConnectionFormValue> {
  constructor(value?: APIConnectionFormValue) {
    super();

    this.addInput(
      new TextInput({
        name: 'name',
        label: 'Connection name',
        value: value?.name || 'Default'
      })
    );

    this.addInput(
      new TextInput({
        name: 'base_url',
        label: 'Base URL',
        value: value?.base_url
      })
    );

    this.addInput(
      new TextInput({
        name: 'api_token',
        label: 'API Token',
        inputType: TextInputType.PASSWORD,
        value: value?.api_token
      })
    );

    this.addInput(
      new SelectInput({
        name: 'color',
        label: 'Color',
        value: value?.color || DEFAULT_CONNECTION_COLOR,
        options: getConnectionColorSetOptions()
      })
    );
  }

  generateConnection(factory: ManualConnectionFactory) {
    const connection = new ManualConnection(factory, {
      baseUrl: this.value().base_url,
      token: this.value().api_token,
      name: this.value().name
    });
    connection.color = this.value().color;
    return connection;
  }
}
