import { AbstractConnection } from '../../core/AbstractConnection';
import { observable } from 'mobx';
import { ReactorPanelFactory, ReactorPanelModel, TabWidget } from '@journeyapps/reactor-mod';
import { TabRendererEvent } from '@projectstorm/react-workspaces-model-tabs';
import React from 'react';

export interface SharedConnectionPanelModelOptions {
  connection?: AbstractConnection;
}

export class SharedConnectionPanelModel extends ReactorPanelModel {
  @observable
  accessor connection: AbstractConnection;

  constructor(type: string, options?: SharedConnectionPanelModelOptions) {
    super(type);
    this.connection = options?.connection || null;
  }

  encodeEntities() {
    return {
      ...super.encodeEntities(),
      connection: this.connection
    };
  }

  decodeEntities(entities: ReturnType<this['encodeEntities']>) {
    this.connection = entities.connection;
  }
}

export abstract class SharedConnectionPanelFactory<T extends ReactorPanelModel> extends ReactorPanelFactory<T> {
  protected abstract getConnection(model: T): AbstractConnection | null;

  protected generatePanelTabInternal(event: TabRendererEvent<T>) {
    const connection = this.getConnection(event.model);
    return (
      <TabWidget
        icon={this.getTabIcon(event)}
        factory={this}
        engine={event.engine}
        model={event.model}
        selected={event.selected}
        title={this.getSimpleName(event.model)}
        indicator={
          connection?.color
            ? {
                color: connection.color
              }
            : undefined
        }
      />
    );
  }
}
