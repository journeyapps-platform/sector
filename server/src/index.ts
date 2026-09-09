import compression from 'compression';
import express from 'express';
import * as http from 'http';
import {
  createBaseIndexMiddleware,
  createModuleLoaderContentTransformer,
  loadModules,
  serveModules
} from '@journeyapps/reactor-lib-server';
import { join } from 'path';

const app = express();
const server = http.createServer(app);

let path = require.resolve('@journeyapps/reactor-lib-server');

const modules = loadModules({
  env: {
    MODULES: process.env.MODULES.split(','),
    REACTOR_LOG_LEVEL: process.env.REACTOR_LOG_LEVEL || 'INFO'
  }
});

const moduleEnv = modules.reduce((env, module) => ({ ...env, ...module.getEnvs() }), {});

app.use(compression());

const serveIndex = () => {
  return createBaseIndexMiddleware({
    title: 'Demo',
    getEnv: () => {
      return moduleEnv;
    },
    domTransform: ($) => {
      createModuleLoaderContentTransformer($, modules);
    },
    templateVars: {
      LOADER_BACKGROUND_COLOR: '#1d1d1d'
    },
    indexFile: join(path, '../../media/index.html')
  });
};

(async () => {
  const serveIndexMiddleware = await serveIndex();

  // !====================== Frontend routes for serving reactor ide webapp ================
  serveModules({
    modules: modules,
    app: app
  });
  app.get('/', serveIndexMiddleware as any);

  server.listen(parseInt(process.env.PORT), () => {
    console.info(`server listening on port ${process.env.PORT}`);
  });
})().catch((err) => {
  console.error('something went wrong booting system', err);
  process.exit(1);
});
