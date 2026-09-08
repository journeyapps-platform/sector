import * as React from 'react';
import {
  BooleanSetting,
  IconWidget,
  ioc,
  PanelButtonMode,
  PanelButtonWidget,
  PrefsStore,
  styled
} from '@journeyapps/reactor-mod';
import { AbstractQuery } from '../../core/query/AbstractQuery';
import { observer } from 'mobx-react';
import * as _ from 'lodash';
import { Page } from '../../core/query/Page';
import { SimpleQuery } from '../../core/query/query-simple/SimpleQuery';
import { SavedQueryStore } from '../../stores/SavedQueryStore';
import { PageControlsWidget } from './table-controls/PageControlsWidget';
import { QueryControlsWidget } from './table-controls/QueryControlsWidget';
import { SortControlsWidget } from './table-controls/SortControlsWidget';
import { ChangesControlsWidget } from './table-controls/ChangesControlsWidget';
import { FilterControlsWidget } from './table-controls/FilterControlsWidget';
import { QueryControlPreferences } from '../../preferences/QueryControlPreferences';
import { SelectionControlsWidget } from './table-controls/SelectionControlsWidget';
import { CreateModelAction } from '../../actions/schema-definitions/CreateModelAction';

export interface TableControlsWidgetProps {
  current_page: Page;
  goToPage?: (index: number) => any;
  className?: any;
  query: AbstractQuery;
  onLoadSavedQuery?: (id: string) => Promise<any> | any;
  loading?: boolean;
  selectedCount: number;
  onDeleteSelected: () => Promise<void>;
}

export const TableControlsWidget: React.FC<TableControlsWidgetProps> = observer((props) => {
  const prefsStore = ioc.get(PrefsStore);
  const simpleQuery = props.query instanceof SimpleQuery ? props.query : null;
  const savedQueries = simpleQuery ? ioc.get(SavedQueryStore).getSavedForQuery(simpleQuery) : [];
  const activeSavedQuery =
    simpleQuery &&
    (savedQueries.find((saved) => {
      return _.isEqual(saved.query, simpleQuery.serialize());
    }) ||
      null);
  const showSortControls = prefsStore.getPreference<BooleanSetting>(QueryControlPreferences.SHOW_SORT_CONTROLS).checked;
  const showFilterControls = prefsStore.getPreference<BooleanSetting>(
    QueryControlPreferences.SHOW_FILTER_CONTROLS
  ).checked;
  const createModelButton = simpleQuery?.options.definition
    ? CreateModelAction.get().renderAsButton(
        (btn) => {
          return <PanelButtonWidget {...btn} label="Create model" mode={PanelButtonMode.PRIMARY} />;
        },
        {
          targetEntity: simpleQuery.options.definition
        }
      )
    : null;

  return (
    <S.Container className={props.className}>
      {createModelButton}
      <PageControlsWidget query={props.query} currentPage={props.current_page} goToPage={props.goToPage} />
      <QueryControlsWidget
        query={props.query}
        simpleQuery={simpleQuery}
        activeSavedQueryName={activeSavedQuery?.name || null}
        onLoadSavedQuery={props.onLoadSavedQuery}
      />
      {simpleQuery && showFilterControls ? (
        <FilterControlsWidget simpleQuery={simpleQuery} goToPage={props.goToPage} />
      ) : null}
      {simpleQuery && showSortControls ? (
        <SortControlsWidget simpleQuery={simpleQuery} goToPage={props.goToPage} />
      ) : null}
      <SelectionControlsWidget selectedCount={props.selectedCount} onDeleteSelected={props.onDeleteSelected} />
      <ChangesControlsWidget query={props.query} currentPage={props.current_page} />
      {props.loading ? <S.Loading icon="spinner" spin={true} /> : null}
    </S.Container>
  );
});

namespace S {
  export const Container = styled.div`
    display: flex;
    flex-direction: row;
    column-gap: 20px;
    row-gap: 20px;
    padding: 5px 5px;
    align-items: flex-end;
    flex-wrap: wrap;
  `;

  export const Loading = styled(IconWidget)`
    color: ${(p) => p.theme.button.icon};
  `;
}
