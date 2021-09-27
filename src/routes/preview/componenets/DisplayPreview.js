import React from 'react'
import { Loading } from '../../../components/loading'
import FetchCms from '../../../components/matrix_fetch_cms'
import { useTranslation } from 'react-i18next'

const DisplayPreview = ({ content, matrixClient, contentLoaded }) => {
  const { t } = useTranslation('projects')
  console.log(contentLoaded)

  let { cms, error, fetching } = contentLoaded ? { cms: contentLoaded, error: false, fetching: false } : FetchCms(content?.room_id)

  if (!contentLoaded) cms = cms[0]

  if (fetching) {
    return (
      <Loading />
    )
  }

  if (error) {
    return (
      <p>{t('There was an error while fetching your data:')}</p>
    )
  }

  console.log(cms)

  if (content.name.includes('heading')) {
    return (
      <div className="headline">
        <h2>{cms.body}</h2>
      </div>
    )
  }

  if (content.name.includes('ul')) {
    return (
      <div className="unordered-list" dangerouslySetInnerHTML={{ __html: cms.formatted_body }} />
    )
  }

  if (content.name.includes('ol')) {
    return (
      <div className="ordered-list" dangerouslySetInnerHTML={{ __html: cms.formatted_body }} />
    )
  }

  if (content.name.includes('quote')) {
    return (
      <div className="quote">
        <blockquote>
          {cms.body}
        </blockquote>
      </div>
    )
  }

  if (content.name.includes('code')) {
    return (
      <div className="code">
        <pre>
          {cms.body}
        </pre>
      </div>
    )
  }

  if (content.name.includes('image')) {
    return (
      <div className="image">
        <img src={matrixClient.mxcUrlToHttp(cms.url)} alt={cms?.info?.alt} />
      </div>
    )
  }

  if (content.name.includes('audio')) {
    return (
      <div className="audio">
        <audio crossOrigin preload="none" controls>
          <source src={matrixClient.mxcUrlToHttp(cms.url)} type="audio/mpeg" />
        </audio>
      </div>
    )
  }

  if (content.name.includes('playlist' || 'video-playlists' || 'videos')) {
    return (
      <div className={content.name.includes === 'playlist' ? 'video-playlists' : 'videos'}>
        <iframe
          src={`https://stream.udk-berlin.de/${(content.name.includes === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
          frameBorder="0"
          title={cms?.body}
          sandbox="allow-same-origin allow-scripts"
          allowFullScreen="allowfullscreen"
          width="560"
          height="315"
          style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
        />
      </div>
    )
  }

  if (content.name.includes('bbb')) {
    return (
      <div className="bbb">
        <a className="bbbLink" href={cms?.body}>{t('Link to BBB Session')}</a>
      </div>
    )
  }

  return (
    <div className="text" dangerouslySetInnerHTML={{ __html: cms.formatted_body }} />
  )
}

export default DisplayPreview
