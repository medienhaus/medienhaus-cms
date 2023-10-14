import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'

import i18n from 'i18next'

const t = i18n.getFixedT(null, 'gutenberg')

const link = {
  apiVersion: 2,
  name: 'medienhaus/link',
  title: 'Link',
  category: 'link',
  description: 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.',
  keywords: ['link'],
  textdomain: 'default',
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0H24V24H0z" /><path d="M13 20h-2v-7H4v7H2V4h2v7h7V4h2v16zm8-12v12h-2v-9.796l-2 .536V8.67L19.5 8H21z" fill="var(--color-fg)" /></svg>,
  attributes: {
    content: {
      type: 'string'
    },
    text: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { content, text },
      setAttributes
    } = props

    const onSubmit = (event) => {
      if (event) event.preventDefault()

      setAttributes({ content: urlInput, text: textInput })
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [textInput, setTextInput] = useState(content || '')

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [urlInput, setUrlInput] = useState(content || '')

    // Validation if this is a real http link
    const isValidUrl = (url) => {
      return url && url.startsWith('https://')
    }

    if (isValidUrl(content)) {
      return (
        <View {...blockProps}>
          <a href={content} target="_blank" rel="noreferrer">{text}</a>
        </View>
      )
    }

    return (
      <View {...blockProps}>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            value={textInput}
            placeholder="linktext"
            onChange={(e) => setTextInput(e.target.value)}
          />
          <input
            type="url"
            value={urlInput}
            placeholder="https://…"
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="submit" disabled={!isValidUrl(urlInput)}>{t('Add Link')}</button>
        </form>
      </View>
    )
  }
}

export default link
