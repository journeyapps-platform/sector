import { CrudError } from '@journeyapps/db';
import {
  DialogStore,
  ioc,
  NotificationStore,
  NotificationType,
  ReactorPanelModel,
  WorkspaceStore
} from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { SchemaModelObject } from './SchemaModelObject';
import { QueryPanelModel } from '../panels/query/QueryPanelFactory';
import { ModelPanelModel } from '../panels/model/ModelPanelFactory';

export interface DeleteSchemaModelsOptions {
  models: SchemaModelObject[];
  sourcePanel?: ReactorPanelModel;
}

const normalizeModels = (models: SchemaModelObject[]) => {
  return _.uniqBy(
    models.filter((model) => model?.model?.persisted),
    (model) => model.id
  );
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof CrudError) {
    return error.firstError()?.detail || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred while deleting the selected models.';
};

const buildDeleteMarkdown = (models: SchemaModelObject[]) => {
  if (models.length === 1) {
    const model = models[0];
    const display = model.data?.display || model.id;
    return `Delete **${display}**?\n\nThis action cannot be undone.`;
  }

  return `Delete **${models.length}** models?\n\nThis action cannot be undone.`;
};

export const runDeleteSchemaModels = async (options: DeleteSchemaModelsOptions): Promise<boolean> => {
  const models = normalizeModels(options.models);

  if (models.length === 0) {
    return false;
  }

  const definition = models[0].definition;
  const mismatchedModel = models.find((model) => model.definition.connection !== definition.connection);
  if (mismatchedModel) {
    ioc.get(NotificationStore).showNotification({
      title: 'Cannot delete models',
      description: 'Selected models must come from the same connection.',
      type: NotificationType.ERROR
    });
    return false;
  }

  try {
    await definition.connection.batchDelete(models);
    const sourcePanelID = options.sourcePanel?.id;
    if (options.sourcePanel instanceof ModelPanelModel) {
      options.sourcePanel.delete();
    }
    await Promise.all(
      ioc
        .get(WorkspaceStore)
        .flatten(ioc.get(WorkspaceStore).getRoot())
        .map(async (panel) => {
          if (panel.id === sourcePanelID) {
            return;
          }
          if (panel instanceof QueryPanelModel) {
            await panel.reloadQuery();
            return;
          }
          if (panel instanceof ModelPanelModel && models.some((model) => model.id === panel.model?.id)) {
            panel.delete();
          }
        })
    );
    ioc.get(NotificationStore).showNotification({
      title: models.length === 1 ? 'Model deleted' : 'Models deleted',
      description:
        models.length === 1
          ? 'The selected model has been deleted.'
          : `${models.length} selected models have been deleted.`,
      type: NotificationType.SUCCESS
    });
    return true;
  } catch (error) {
    ioc.get(NotificationStore).showNotification({
      title: 'Delete failed',
      description: getErrorMessage(error),
      type: NotificationType.ERROR
    });
    return false;
  }
};

export const deleteSchemaModels = async (options: DeleteSchemaModelsOptions): Promise<boolean> => {
  const models = normalizeModels(options.models);

  if (models.length <= 1) {
    return false;
  }

  const confirmed = await ioc.get(DialogStore).showConfirmDialog({
    title: 'Delete selected models',
    markdown: buildDeleteMarkdown(models),
    yesBtn: {
      label: `Delete ${models.length} models`,
      icon: 'trash'
    }
  });

  if (!confirmed) {
    return false;
  }

  return runDeleteSchemaModels({
    ...options,
    models
  });
};
