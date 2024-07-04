import React from 'react'
import { useBlockProps, RichText } from '@wordpress/block-editor'
import { createBlock } from '@wordpress/blocks'

import i18n from 'i18next'

const t = i18n.getFixedT(null, 'gutenberg')

const heading = {
  apiVersion: 2,
  name: 'medienhaus/heading',
  title: 'Heading',
  category: 'text',
  description: 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.',
  keywords: ['title', 'subtitle'],
  textdomain: 'default',
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0H24V24H0z" /><path d="M13 20h-2v-7H4v7H2V4h2v7h7V4h2v16zm8-12v12h-2v-9.796l-2 .536V8.67L19.5 8H21z" fill="var(--color-fg)" /></svg>,
  attributes: {
    content: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { content },
      setAttributes,
      clientId,
      onRemove,
      onReplace
    } = props

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()

    const onChangeContent = (newContent) => {
      setAttributes({ content: newContent })
    }
    return (
      <RichText
        {...blockProps}
        tagName="h3"
        placeholder={t('Heading')}
        onChange={onChangeContent}
        onRemove={onRemove}
        onReplace={onReplace}
        onSplit={(value, isOriginal) => {
          let block

          if (isOriginal || value) {
            block = createBlock('medienhaus/heading', {
              ...props.attributes,
              content: value
            })
          } else {
            block = createBlock('core/paragraph')
          }

          if (isOriginal) {
            block.clientId = clientId
          }

          return block
        }}
        value={content}
        disableLineBreaks
      />
    )
  },
  preview: ({ content }) => {
    const blockProps = useBlockProps // Use .save() for the preview

    return (
      <RichText.Content
        {...blockProps}
        tagName="h3"
        value={content || t('Heading')}
      />
    )
  }
}

export default heading
