import * as React from 'react';
import {
  BooleanSetting,
  ComboBoxItem,
  ComboBoxStore2,
  NotificationStore,
  NotificationType,
  PrefsStore,
  SimpleComboBoxDirective,
  SmartDateDisplayWidget,
  TableButtonWidget,
  themed,
  ioc
} from '@journeyapps/reactor-mod';
import { copyTextToClipboard } from '@journeyapps/reactor-lib-utils';
import { SchemaModelObject } from '../../SchemaModelObject';
import { TypeEngine } from '../../../forms/TypeEngine';
import { QueryControlPreferences } from '../../../preferences/QueryControlPreferences';
import { EmptyValueWidget } from '../../../widgets/EmptyValueWidget';

export interface PeekRelationshipButtonProps {
  object: SchemaModelObject;
  open: (object: SchemaModelObject) => any;
  filterBelongsTo?: (object: SchemaModelObject) => any;
}

export const PeekRelationshipButton: React.FC<PeekRelationshipButtonProps> = (props) => {
  const typeEngine = ioc.get(TypeEngine);
  const notifications = ioc.get(NotificationStore);

  const copyFieldValue = async (attribute: any, value: unknown) => {
    try {
      const handler = typeEngine.getHandler(attribute.type);
      let scalar: unknown = value;
      if (handler) {
        const decoded = await handler.decode(value);
        scalar = handler.encodeToScalar ? await handler.encodeToScalar(decoded) : decoded;
      }
      copyTextToClipboard(scalar == null ? 'null' : `${scalar}`);
      notifications.showNotification({
        title: 'Copied',
        description: `${attribute.label || attribute.name} copied to clipboard`,
        type: NotificationType.SUCCESS
      });
    } catch (error) {
      notifications.showNotification({
        title: 'Copy failed',
        description: `Failed to copy ${attribute.label || attribute.name}`,
        type: NotificationType.ERROR
      });
    }
  };

  const showPeek = async (event: React.MouseEvent<any>) => {
    const hideNullFields = ioc
      .get(PrefsStore)
      .getPreference<BooleanSetting>(QueryControlPreferences.FILTER_NULL_FIELDS_IN_RELATIONSHIP_PEEK).checked;

    const attributeItems: ComboBoxItem[] = Object.values(props.object.definition.definition.attributes)
      .map((attribute) => {
        const value = props.object.model?.[attribute.name];
        if (hideNullFields && value == null) {
          return null;
        }
        let display: React.ReactNode = null;
        if (value != null) {
          display = typeEngine.getHandler(attribute.type)?.generateDisplay({
            model: props.object,
            value,
            label: attribute.label || attribute.name,
            name: attribute.name,
            type: attribute.type
          });
        }
        return {
          key: `field-${attribute.name}`,
          title: attribute.label || attribute.name,
          right: <S.FieldValue>{display || (value == null ? <EmptyValueWidget /> : `${value}`)}</S.FieldValue>,
          group: 'Fields',
          action: async () => {
            await copyFieldValue(attribute, value);
          }
        } as ComboBoxItem;
      })
      .filter((item) => !!item);

    const items: ComboBoxItem[] = [
      {
        key: 'meta-id',
        title: 'ID',
        icon: 'copy',
        right: <S.FieldValue>{props.object.id}</S.FieldValue>,
        group: 'Object',
        action: async () => {
          copyTextToClipboard(props.object.id);
          notifications.showNotification({
            title: 'Copied',
            description: 'Relationship ID copied to clipboard',
            type: NotificationType.SUCCESS
          });
        }
      },
      {
        key: 'meta-updated',
        title: 'Updated at',
        icon: 'clock',
        right: props.object.updated_at ? (
          <SmartDateDisplayWidget date={props.object.updated_at} />
        ) : (
          <S.FieldValue>Unknown</S.FieldValue>
        ),
        disabled: true,
        group: 'Object'
      },
      ...attributeItems,
      {
        key: 'open',
        title: 'Open record',
        icon: 'arrow-right',
        group: 'Actions',
        action: async () => {
          props.open(props.object);
        }
      },
      ...(props.filterBelongsTo
        ? [
            {
              key: 'filter-belongs-to',
              title: 'Filter belongs to',
              icon: 'filter',
              group: 'Actions',
              action: async () => {
                await props.filterBelongsTo?.(props.object);
              }
            } as ComboBoxItem
          ]
        : [])
    ];
    const directive = await ioc.get(ComboBoxStore2).show(
      new SimpleComboBoxDirective({
        title: props.object.data.display || props.object.id,
        subtitle: props.object.definition.definition.label || props.object.definition.definition.name,
        event: event as any,
        items
      })
    );
    directive.getSelectedItem();
  };

  return (
    <TableButtonWidget
      icon="eye"
      tooltip="Peek relationship"
      action={(event) => {
        showPeek(event as any);
      }}
    />
  );
};

namespace S {
  export const FieldValue = themed.div`
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
}
