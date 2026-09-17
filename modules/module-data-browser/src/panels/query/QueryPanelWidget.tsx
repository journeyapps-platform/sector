import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { QueryPanelModel } from './QueryPanelFactory';
import { observer } from 'mobx-react';
import styled from '@emotion/styled';
import { BorderLayoutWidget, LoadingPanelWidget, PANEL_CONTENT_PADDING } from '@journeyapps/reactor-mod';
import { Page } from '../../core/query/Page';
import { PageResultsWidget } from './PageResultsWidget';
import { TableControlsWidget } from './TableControlsWidget';
import { autorun } from 'mobx';
import { TableControlsPositionPreference, TableControlsPositionValue } from '../../preferences/QueryControlPreferences';
import { deleteSchemaModels } from '../../core/delete-schema-models';

export interface QueryPanelWidgetProps {
  model: QueryPanelModel;
}

namespace S {
  export const Container = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
  `;
}

export const QueryPanelWidget: React.FC<QueryPanelWidgetProps> = observer((props) => {
  const [loading, setLoading] = useState(false);
  const pendingDisposerRef = useRef<() => void>(null);

  const setVisiblePage = (page: Page) => {
    props.model.current_page_data = page;
  };

  useEffect(() => {
    return autorun(() => {
      const query = props.model.query;
      if (!query) {
        return;
      }
      if (props.model.current_page_data) {
        return;
      }
      if (query.totalPages !== 0) {
        return;
      }
      void query.load();
    });
  }, [props.model]);

  useEffect(() => {
    return autorun(() => {
      if (props.model.query) {
        const nextPage = props.model.query.getPage(props.model.current_page);
        const currentPage = props.model.current_page_data;

        if (!currentPage) {
          setVisiblePage(nextPage);
          setLoading(!!nextPage?.loading);
          return;
        }

        if (nextPage === currentPage) {
          setLoading(!!nextPage.loading);
          return;
        }

        if (!nextPage.loading) {
          pendingDisposerRef.current?.();
          pendingDisposerRef.current = null;
          setVisiblePage(nextPage);
          setLoading(false);
          return;
        }

        setLoading(true);
        pendingDisposerRef.current?.();
        pendingDisposerRef.current = autorun(() => {
          if (!nextPage.loading) {
            pendingDisposerRef.current?.();
            pendingDisposerRef.current = null;
            setVisiblePage(nextPage);
            setLoading(false);
          }
        });
      }
    });
  }, [props.model]);

  useEffect(() => {
    return () => {
      pendingDisposerRef.current?.();
      pendingDisposerRef.current = null;
    };
  }, []);

  const activePage =
    props.model.current_page_data || (props.model.query ? props.model.query.getPage(props.model.current_page) : null);
  const controlsPosition = TableControlsPositionPreference.getValue();

  const controls = (
    <TableControlsWidget
      query={props.model.query}
      current_page={activePage}
      loading={loading}
      selectedCount={props.model.selected_models.length}
      onDeleteSelected={async () => {
        await deleteSchemaModels({
          models: props.model.selected_models
        });
      }}
      onLoadSavedQuery={async (id) => {
        await props.model.loadSavedQuery(id);
      }}
      goToPage={(index) => {
        props.model.current_page = index;
      }}
    />
  );

  return (
    <LoadingPanelWidget loading={!props.model.query || !activePage}>
      {() => {
        return (
          <S.Container>
            <BorderLayoutWidget
              top={
                controlsPosition === TableControlsPositionValue.TOP ||
                controlsPosition === TableControlsPositionValue.BOTH
                  ? controls
                  : null
              }
              bottom={
                controlsPosition === TableControlsPositionValue.BOTTOM ||
                controlsPosition === TableControlsPositionValue.BOTH
                  ? controls
                  : null
              }
            >
              <S.PageResults
                query={props.model.query}
                page={activePage}
                selectedModels={props.model.selected_models}
                onSelectionChange={(event) => {
                  props.model.mergeSelectionForPage({
                    page: activePage,
                    models: event.rows.map((row) => row.model)
                  });
                }}
                scrollTop={props.model.table_scroll_top}
                scrollLeft={props.model.table_scroll_left}
                onScroll={({ top, left }) => {
                  props.model.table_scroll_top = top;
                  props.model.table_scroll_left = left;
                }}
              />
            </BorderLayoutWidget>
          </S.Container>
        );
      }}
    </LoadingPanelWidget>
  );
});

namespace S {
  export const PageResults = styled(PageResultsWidget)`
    padding: ${PANEL_CONTENT_PADDING}px;
  `;
}
