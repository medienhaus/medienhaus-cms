import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { Trans } from 'react-i18next'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import i18n from 'i18next'

const t = i18n.getFixedT(null, 'gutenberg')

const livestream = {
  apiVersion: 2,
  name: 'medienhaus/livestream',
  title: 'Livestream',
  description: 'PeerTube Livestream',
  keywords: ['peertube', 'livestream'],
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z" /><path d="M17 9.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4.2zm0 3.159l4 2.8V8.84l-4 2.8v.718zM3 6v12h12V6H3zm2 2h2v2H5V8z" fill="var(--color-fg)" /></svg>,
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

    const isValidUrl = (url) => {
      return url && url.startsWith && url.startsWith('https://stream.udk-berlin.de/')
    }

    if (isValidUrl(content)) {
      return (
        <View {...blockProps}>
          <iframe
            src={`https://stream.udk-berlin.de/livestreams/embed/${content.replace('https://stream.udk-berlin.de/w/', '')}`}
            frameBorder="0"
            title={content}
            sandbox="allow-same-origin allow-scripts"
            allowFullScreen="allowfullscreen"
            width="560"
            height="315"
            style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
          />
        </View>
      )
    }

    return (
      <View {...blockProps}>
        <form onSubmit={onSubmit}>
          <input
            type="url"
            value={urlInput}
            placeholder="https://stream.udk-berlin.de/…"
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="submit" disabled={!isValidUrl(urlInput)}>{t('Embed Livestream')}</button>
          <p>↳ <Trans t={t} i18nKey="linkToLivestream">You can create livestreams via <a href="https://stream.udk-berlin.de/livestreams/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>
        </form>
      </View>
    )
  }
}

export default livestream
