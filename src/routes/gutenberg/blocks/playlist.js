import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { Trans } from 'react-i18next'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import i18n from 'i18next'

const t = i18n.getFixedT(null, 'gutenberg')

const playlist = {
  apiVersion: 2,
  name: 'medienhaus/playlist',
  title: 'Playlist',
  description: 'PeerTube Playlist',
  keywords: ['peertube', 'playlist'],
  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0H24V24H0z" /><path d="M22 18v2H2v-2h20zM2 3.5l8 5-8 5v-10zM22 11v2H12v-2h10zM4 7.108v2.784L6.226 8.5 4 7.108zM22 4v2H12V4h10z" /></svg>,
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
            src={`https://stream.udk-berlin.de/video-playlists/embed/${content.replace('https://stream.udk-berlin.de/w/', '')}`}
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
          <button type="submit" disabled={!isValidUrl(urlInput)}>{t('Embed Playlist')}</button>
          <p>↳ <Trans t={t} i18nKey="linkToPlaylist">You can create playlists via <a href="https://stream.udk-berlin.de/videos/upload" rel="external nofollow noopener noreferrer" target="_blank">udk/stream</a></Trans></p>
        </form>
      </View>
    )
  }
}

export default playlist
