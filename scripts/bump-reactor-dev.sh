#!/bin/bash
set -euo pipefail

pnpm update -r \
  @journeyapps/reactor-mod@dev \
  @journeyapps/reactor-mod-editor@dev \
  @journeyapps/reactor-lib-builder@dev \
  @journeyapps/reactor-lib-data-layer@dev \
  @journeyapps/reactor-lib-search@dev \
  @journeyapps/reactor-lib-utils@dev \
  @journeyapps/reactor-lib-server@dev

pnpm install
