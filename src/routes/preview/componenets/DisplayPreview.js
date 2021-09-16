import React from 'react'
import { Loading } from '../../../components/loading'
import FetchCms from '../../../components/matrix_fetch_cms'
import { useTranslation } from 'react-i18next'

const DisplayPreview = ({ content, matrixClient }) => {
  const { t } = useTranslation('projects')
  let { cms, error, fetching } = FetchCms(content.room_id)
  cms = cms[0]

  if (fetching) return <Loading />
  if (error) return <p>{t('There was an error while fetching your data:')}</p>
  console.log(cms)
  if (content.name.includes('heading')) return <h2>{cms.body}</h2>
  if (content.name.includes('ul')) return <div dangerouslySetInnerHTML={{ __html: cms.formatted_body }} />
  if (content.name.includes('ol')) return <div dangerouslySetInnerHTML={{ __html: cms.formatted_body }} />
  if (content.name.includes('quote')) return <blockquote>{cms.body}</blockquote>
  if (content.name.includes('image')) return <div className="image"><img src={matrixClient.mxcUrlToHttp(cms.url)} alt={cms?.info?.alt} /></div>
  if (content.name.includes('audio')) return <audio className="center" controls><source src={matrixClient.mxcUrlToHttp(cms.url)} /></audio>
  if (content.name.includes('playlist' || 'video-playlists' || 'videos')) {
    return (
      <iframe
        src={`https://stream.udk-berlin.de/${(content.name.includes === 'playlist' ? 'video-playlists' : 'videos')}/embed/${cms?.body}`}
        frameBorder="0"
        title={cms?.body}
        sandbox="allow-same-origin allow-scripts"
        allowFullScreen="allowfullscreen"
        style={{ width: '100%', aspectRatio: '16 / 9', border: 'calc(var(--margin) * 0.2) solid var(--color-fg)' }}
      />
    )
  }
  if (content.name.includes('bbb')) return <a href={cms?.body}>{t('Link to BBB Session')}</a>
  else return <p>{content.body}</p>
}
export default DisplayPreview
