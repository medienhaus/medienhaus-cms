import React from 'react'
import { useBlockProps } from '@wordpress/block-editor'
import { Trans } from 'react-i18next'

import { useState } from '@wordpress/element'
import { View } from '@wordpress/primitives'
import i18n from 'i18next'
import config from '../../../config.json'

const t = i18n.getFixedT(null, 'gutenberg')

const video = {
  apiVersion: 2,
  name: 'medienhaus/video',
  title: 'Video',
  description: 'PeerTube Video',
  keywords: ['peertube', 'video'],
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
      // @TODO validation needs to be more  (check https etc.)
      if (!config.medienhaus.video) return true
      if (config.medienhaus.video?.youtube && url?.includes('youtu')) return true
      if (config.medienhaus.video?.vimeo && url?.includes('vimeo.com')) return true
      return url && url.startsWith && url.startsWith(config.medienhaus.video?.custom?.baseUrl)
    }

    if (isValidUrl(content)) {
      if (config.medienhaus.video) {
        return (
          <View {...blockProps}>
            <iframe
              src={`${config.medienhaus.video?.custom?.iframeUrl}${content.replace(config.medienhaus.video.custom.baseUrl, '')}`}
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

      if (config.medienhaus.video?.youtube && content?.includes('youtu')) {
        return (
          <View {...blockProps}>
            <iframe
              src={`https://www.youtube.com/embed/${content.replace(content.includes('/watch?v=') ? 'https://www.youtube.com/watch?v=' : 'https://youtu.be/', '')}`}
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
      if (config.medienhaus.video?.vimeo && content?.includes('vimeo.com/')) {
        return (
          <View {...blockProps}>
            <iframe
              src={`https://player.vimeo.com/video/${content.replace('https://vimeo.com/', '')}`}
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
    }

    // in case content is parsed but the platform not supported:
    if (content) {
      return (
        <View {...blockProps}>
          <p><em>{t('No preview available for')}:</em></p>
          <a href={content} target="_blank" rel="external nofollow noopener noreferrer">{content}</a>
        </View>
      )
    }
    return (
      <View {...blockProps}>
        <form onSubmit={onSubmit}>
          <input
            type="url"
            value={urlInput}
            placeholder={(config.medienhaus.video?.custom?.baseUrl || 'https://') + '…'}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button type="submit" disabled={!isValidUrl(urlInput)}>{t('Embed Video')}</button>
          <p>↳
            {config.medienhaus.video?.custom && <Trans t={t} i18nKey="linkToVideo">You can upload videos via <a href={config.medienhaus.video.custom.uploadUrl || config.medienhaus.video.custom.baseUrl} rel="external nofollow noopener noreferrer" target="_blank">{
              config.medienhaus.video.custom.label
            }</a>
            </Trans>}
          </p>
        </form>
      </View>
    )
  }
}

export default video
