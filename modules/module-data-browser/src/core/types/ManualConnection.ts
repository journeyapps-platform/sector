import { ObjectId } from 'bson';
import { ApiCredentialOptions, Database } from '@journeyapps/db';
import { AbstractConnection } from '../AbstractConnection';
import { ManualConnectionFactory } from './ManualConnectionFactory';
import { EntityDescription } from '@journeyapps/reactor-mod';
import { createWebNetworkClient } from '@journeyapps/common-sdk';
import { V4BackendClient } from '@ja-platform/sdk-backend-v4';
import * as path from 'path';

export interface ManualConnectionDetails extends ApiCredentialOptions {
  name: string;
}

export class ManualConnection extends AbstractConnection {
  constructor(
    factory: ManualConnectionFactory,
    protected options?: ManualConnectionDetails
  ) {
    super(factory);
  }

  getConnection(): Promise<Database> {
    return Database.instance(this.options);
  }

  async init() {
    await this.ensureOnline();
  }

  _serialize(): ManualConnectionDetails {
    return this.options;
  }

  async _deSerialize(data: ManualConnectionDetails): Promise<any> {
    this.options = data;
  }

  get name(): EntityDescription {
    return {
      simpleName: this.options.name
    };
  }

  getBackendClient(): V4BackendClient {
    let url = new URL(this.options.baseUrl);
    return new V4BackendClient({
      account_id: new ObjectId(path.basename(url.pathname)),
      endpoint: `${url.origin}`,
      client: createWebNetworkClient({
        headers: {
          Authorization: `Bearer ${this.options.token}`
        }
      })
    });
  }
}
