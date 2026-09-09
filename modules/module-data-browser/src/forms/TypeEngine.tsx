import { Type } from '@journeyapps/db';
import { AbstractMedia, inject, MediaEngine, WorkspaceStore } from '@journeyapps/reactor-mod';
import { displayArray } from './types/shared/ui';
import { TypeHandler } from './types/shared/type-handler';
import { dateHandler } from './types/date-handler';
import { imageHandler } from './types/image-handler';
import { attachmentHandler } from './types/attachment-handler';
import { booleanHandler } from './types/boolean-handler';
import { numberHandler } from './types/number-handler';
import { textHandler } from './types/text-handler';
import { locationHandler } from './types/location-handler';
import { singleChoiceIntegerHandler } from './types/single-choice-integer-handler';
import { singleChoiceHandler } from './types/single-choice-handler';
import { multipleChoiceHandler } from './types/multiple-choice-handler';
import { multipleChoiceIntegerHandler } from './types/multiple-choice-integer-handler';

export type { TypeHandler };

export class TypeEngine {
  handlers: Set<TypeHandler>;

  @inject(MediaEngine)
  accessor mediaEngine: MediaEngine;

  @inject(WorkspaceStore)
  accessor workspaceStore: WorkspaceStore;

  private _mediaCache: Map<string, AbstractMedia>;

  constructor() {
    this.handlers = new Set();
    this._mediaCache = new Map();
    const context = {
      mediaEngine: this.mediaEngine,
      workspaceStore: this.workspaceStore,
      mediaCache: this._mediaCache,
      displayArray
    };

    this.register(dateHandler);
    this.register(imageHandler(context));
    this.register(attachmentHandler);
    this.register(booleanHandler);
    this.register(numberHandler);
    this.register(textHandler(context));
    this.register(locationHandler);
    this.register(singleChoiceIntegerHandler);
    this.register(singleChoiceHandler);
    this.register(multipleChoiceHandler(context));
    this.register(multipleChoiceIntegerHandler(context));
  }

  getHandler(type: Type) {
    for (let handler of this.handlers) {
      if (handler.matches(type)) {
        return handler;
      }
    }
    return null;
  }

  register<T extends Type = Type, ENCODED = any, DECODED = any>(handler: TypeHandler<T, ENCODED, DECODED>) {
    this.handlers.add(handler);
  }
}
