import * as React from 'react';
import { styled } from '@journeyapps/reactor-mod';
import * as _ from 'lodash';
import { EmptyValueWidget } from '../../../widgets/EmptyValueWidget';

export const MAX_NUMBER_OF_ARR_ITEMS_TO_DISPLAY = 3;

namespace S {
  export const Empty = styled(EmptyValueWidget)``;

  export const Pills = styled.div`
    display: flex;
    column-gap: 2px;
    row-gap: 2px;
  `;

  export const Pill = styled.div`
    padding: 2px 4px;
    background: ${(p) => p.theme.table.pills};
    border-radius: 3px;
    font-size: 12px;
  `;
}

export const TypeUI = S;

export function displayArray(value: any[]) {
  if (value.length === 0) {
    return <S.Empty>empty array</S.Empty>;
  }
  const items = _.slice(value, 0, MAX_NUMBER_OF_ARR_ITEMS_TO_DISPLAY);
  return (
    <S.Pills>
      {items.map((c) => {
        return <S.Pill key={c}>{c}</S.Pill>;
      })}
      {items.length !== value.length ? '...' : null}
    </S.Pills>
  );
}
