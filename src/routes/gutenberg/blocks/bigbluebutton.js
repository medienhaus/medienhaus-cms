import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import i18n from 'i18next'

const t = i18n.getFixedT(null, 'gutenberg')

const bigbluebutton = {
  apiVersion: 2,
  name: 'medienhaus/bigbluebutton',
  title: 'BigBlueButton',
  description: 'BigBlueButton-Session',
  keywords: ['peertube', 'bigbluebutton'],
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z" /><path d="M21 3a1 1 0 0 1 1 1v7h-2V5H4v14h6v2H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zm0 10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h8zm-1 2h-6v4h6v-4z" /></svg>,
  attributes: {
    content: {
      type: 'string'
    }
  },
  edit: (props) => {
    const {
      attributes: { content },
      setAttributes
    } = props
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const blockProps = useBlockProps()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [urlInput, setUrlInput] = useState(content || '')

    const onSubmit = (event) => {
      if (event) event.preventDefault()

      setAttributes({ content: urlInput })
    }

    // Validation if this is a real BigBlueButton link
    // Example: https://meetings.udk-berlin.de/b/and-rkf-d0i-8xk
    const isValidUrl = (url) => {
      return url && url.startsWith('https://meetings.udk-berlin.de/') && url.substr(33, 100).match(/^([a-zA-Z0-9]{3}-){3}([a-zA-Z0-9]{3}){1}$/gi)
    }

    if (isValidUrl(content)) {
      return (
        <View {...blockProps}>
          <pre>{content}</pre>
        </View>
      )
    }

    return (
      <View {...blockProps}>
        <form onSubmit={onSubmit}>
          <input
            type="url"
            value={urlInput}
            placeholder="https://meetings.udk-berlin.de/b/bbb-foo-bar-baz"
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="submit" disabled={!isValidUrl(urlInput)}>{t('Add BigBlueButton-Session')}</button>
        </form>
      </View>
    )
  }
}

export default bigbluebutton
