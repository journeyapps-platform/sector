import * as React from 'react';
import {
  ComboBoxStore2,
  MetadataWidget,
  PanelButtonMode,
  PanelButtonWidget,
  SimpleComboBoxDirective,
  ioc,
  styled,
  useDraggableRaw,
  useDroppableRaw
} from '@journeyapps/reactor-mod';
import { getTransparentColor } from '@journeyapps/reactor-lib-utils';
import { SimpleQuerySort, SortDirection } from '../../../core/query/query-simple/SimpleQuery';

const SORT_DRAG_MIME = 'application/reactor-sort-field';

export interface SortChipWidgetProps {
  sort: SimpleQuerySort;
  label: string;
  onToggle: () => Promise<any> | any;
  onRemove: () => Promise<any> | any;
  onDropBefore: (field: string) => Promise<any> | any;
}

export const SortChipWidget: React.FC<SortChipWidgetProps> = (props) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState(false);

  useDraggableRaw({
    forwardRef: ref,
    encode: () => {
      return {
        data: {
          [SORT_DRAG_MIME]: props.sort.field
        },
        icon: null
      };
    }
  });

  useDroppableRaw<{ [key: string]: string }>(
    {
      forwardRef: ref,
      accepts: (mimes) => mimes.includes(SORT_DRAG_MIME),
      dragover: () => {
        setHover(true);
      },
      dragexit: () => {
        setHover(false);
      },
      dropped: async ({ entities }) => {
        setHover(false);
        const sourceField = entities[SORT_DRAG_MIME];
        if (!sourceField || sourceField === props.sort.field) {
          return;
        }
        await props.onDropBefore(sourceField);
      }
    },
    [props.sort.field]
  );

  return (
    <S.SortItem
      ref={ref}
      hover={hover}
      onContextMenu={async (event) => {
        event.preventDefault();
        const directive = await ioc.get(ComboBoxStore2).show(
          new SimpleComboBoxDirective({
            title: props.label,
            event: event as any,
            items: [
              {
                key: 'delete',
                title: 'Delete sort',
                icon: 'trash',
                action: async () => {
                  await props.onRemove();
                }
              }
            ]
          })
        );
        directive.getSelectedItem();
      }}
    >
      <MetadataWidget
        onClick={props.onToggle}
        label={props.label}
        value={props.sort.direction === SortDirection.ASC ? 'ASC' : 'DESC'}
      />
      <S.CloseButton
        mode={PanelButtonMode.LINK}
        icon="close"
        tooltip={`Remove ${props.label} sort`}
        action={async () => {
          await props.onRemove();
        }}
      />
    </S.SortItem>
  );
};

namespace S {
  export const CloseButton = styled(PanelButtonWidget)`
    padding: 2px;
  `;

  export const SortItem = styled.div<{ hover: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 4px;
    padding: 2px;
    background: ${(p) => (p.hover ? getTransparentColor(p.theme.dnd.hoverColor, 0.35) : 'transparent')};
  `;
}
