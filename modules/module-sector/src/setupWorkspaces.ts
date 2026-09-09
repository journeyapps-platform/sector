import { EmptyReactorPanelModel, ioc, System, WorkspaceModel, WorkspaceStore } from '@journeyapps/reactor-mod';
import { DataBrowserEntities } from '@ja-platform/reactor-mod-data-browser';

export const setupWorkspaces = () => {
  const workspaceStore = ioc.get(WorkspaceStore);
  const system = ioc.get(System);

  workspaceStore.registerWorkspaceGenerator({
    generateWorkspace: async () => {
      let model = workspaceStore.generateRootModel();

      model.addModel(
        system
          .getDefinition(DataBrowserEntities.CONNECTION)
          .getPanelComponents()[0]
          .generatePanelFactory()
          .generateModel()
      );

      model.addModel(workspaceStore.engine.generateReactorTabModel().addModel(new EmptyReactorPanelModel()));
      return new WorkspaceModel({
        name: 'Browse Data',
        priority: 1,
        model: model
      });
    }
  });
};
