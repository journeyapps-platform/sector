import { Attachment, AttachmentType } from '@journeyapps/db';
import { FileInput, TableButtonWidget } from '@journeyapps/reactor-mod';
import * as React from 'react';
import { TypeHandler } from './shared/type-handler';

export const attachmentHandler: TypeHandler = {
  matches: (type) => type instanceof AttachmentType,
  getTypeLabel: () => 'Attachment',
  encode: async (value: File) => {
    return Attachment.create({
      data: await value.arrayBuffer(),
      filename: value.name
    });
  },
  decode: async (value: Attachment) => {
    return new File([await value.toArrayBuffer()], value.id);
  },
  encodeToScalar: async (value: File) => value?.name || '',
  decodeFromScalar: async (value) => new File([], value == null ? '' : `${value}`),
  generateField: ({ label, name }) => {
    return new FileInput({
      name,
      label
    });
  },
  generateDisplay: ({ value }) => {
    return (
      <TableButtonWidget
        icon="download"
        action={() => {
          window.open(value.url(), '_blank');
        }}
      />
    );
  }
};
