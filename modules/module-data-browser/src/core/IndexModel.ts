import { SchemaModelDefinition } from './SchemaModelDefinition';
import { V4Index } from '@ja-platform/sdk-backend-v4';

export interface IndexModelOptions {
  definition: SchemaModelDefinition;
  index: V4Index;
}
export class IndexModel {
  constructor(protected options: IndexModelOptions) {}

  get index() {
    return this.options.index;
  }

  get definition() {
    return this.options.definition;
  }
}
