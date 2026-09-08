import { Attachment, PhotoType, SignatureType } from '@journeyapps/db';
import { ImageInput, ImageMedia, styled } from '@journeyapps/reactor-mod';
import { TypeHandler, TypeHandlerContext } from './shared/type-handler';
import { TypeUI } from './shared/ui';
import * as React from 'react';

export const imageHandler = (context: TypeHandlerContext): TypeHandler => {
  const toRawBase64 = (value: string): string => {
    const marker = 'base64,';
    const index = value.indexOf(marker);
    if (index === -1) {
      return value;
    }
    return value.substring(index + marker.length);
  };

  const decode = async (value: Attachment) => {
    if (context.mediaCache.has(value.id)) {
      return context.mediaCache.get(value.id);
    }
    const media = context.mediaEngine.getMediaTypeForPath('.jpg').generateMedia({
      content: await value.toArrayBuffer(),
      name: value.id,
      uid: value.id
    });

    context.mediaCache.set(value.id, media);
    return media;
  };

  return {
    matches: (type) => type instanceof SignatureType || type instanceof PhotoType,
    getTypeLabel: (type) => (type instanceof SignatureType ? 'Signature' : 'Photo'),
    encode: async (value: ImageMedia) => {
      return Attachment.create({
        data: await value.toArrayBuffer()
      });
    },
    decode,
    encodeToScalar: async (value: ImageMedia) => {
      if (!value) {
        return null;
      }
      const base64 = await value.toBase64();
      return toRawBase64(base64);
    },
    decodeFromScalar: async (value) => {
      if (typeof value !== 'string' || value.trim() === '') {
        return null;
      }
      return context.mediaEngine.getMediaTypeForPath('.jpg').generateMedia({
        content: toRawBase64(value),
        name: 'imported-image',
        uid: 'imported-image'
      });
    },
    generateField: ({ label, name }) => {
      return new ImageInput({
        name,
        label
      });
    },
    generateDisplay: ({ value, type }) => {
      if (value.uploaded()) {
        return (
          <S.Preview
            onClick={() => {
              decode(value).then((media: ImageMedia) => {
                if (media instanceof ImageMedia) {
                  media.open();
                } else {
                  window.open(value.url(), '_blank');
                }
              });
            }}
            src={value.urls['thumbnail']}
          />
        );
      }
      return <TypeUI.Empty>Not uploaded</TypeUI.Empty>;
    }
  };
};

namespace S {
  export const Preview = styled.img`
    max-height: 40px;
    max-width: 40px;
    cursor: pointer;
  `;
}
