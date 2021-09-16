import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../components/loading'
import './preview.css?v=1.0'
import FetchCms from '../../components/matrix_fetch_cms'

const Preview = () => {
  const { t } = useTranslation('projects')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  const [contentLang, setContentLang] = useState('en')
  // const [spaceObject, setSpaceObject] = useState()
  // const [medienhausMeta, setMedienhausMeta] = useState([])
  const [roomMembers, setRoomMembers] = useState([])
  const [projectImage, setProjectImage] = useState([])

  const [description, setDescription] = useState()

  const params = useParams()
  const projectSpace = params.spaceId
  const matrixClient = Matrix.getMatrixClient()

  const fetchSpace = useCallback(async () => {
    setLoading(true)
    if (matrixClient.isInitialSyncComplete()) {
      // here we collect all necessary information about the project
      const space = await matrixClient.getSpaceSummary(projectSpace)
      // setSpaceObject(space)
      const spaceDetails = await matrixClient.getRoom(projectSpace)
      // setting title to project space name
      setTitle(space.rooms[0].name)
      // get names of artists
      setRoomMembers(spaceDetails.currentState.members)
      console.log(spaceDetails.currentState.members)
      // set the topic depending on selected language
      setDescription({ en: space.rooms.filter(room => room.name === 'en')[0].topic || '', de: space.rooms.filter(room => room.name === 'de')[0].topic || '' })
      // fetch custom medienhaus event
      const meta = spaceDetails.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content
      // setMedienhausMeta(meta)
      console.log(meta)
      // fetch project image if available
      const avatar = await matrixClient.getStateEvent(projectSpace, 'm.room.avatar')
        .catch(res => {
          res.data.error === 'Event not found.' && console.log('No Avatar set, yet')
        })
      avatar && setProjectImage(avatar)
      // we fetch the selected language content
      const spaceRooms = space.rooms.filter(room => room.name === contentLang)
      const getContent = await matrixClient.getSpaceSummary(spaceRooms[0].room_id)
      setBlocks(getContent.rooms.filter(room => room.name !== contentLang).filter(room => room.name.charAt(0) !== 'x').sort((a, b) => {
        return a.name.substring(0, a.name.indexOf('_')) - b.name.substring(0, b.name.indexOf('_'))
      }))
      setLoading(false)
    } else {
      console.log('sync not done, trying again')
      setTimeout(() => fetchSpace(), 250)
    }
  }, [matrixClient, projectSpace, contentLang])

  useEffect(() => {
    projectSpace || setTitle('')
    projectSpace && fetchSpace()
  }, [projectSpace, fetchSpace, title])

  const DisplayPreview = ({ content }) => {
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
    } else return <p>{content.body}</p>
  }

  if (loading) return <Loading />

  return (
    <div className="preview singleproject">
      <select
        id="subject" name="subject" defaultValue="" value={contentLang} onChange={(e) => {
          setContentLang(e.target.value)
          setDescription()
        }}
      >
        <option value="de">DE — Deutsch</option>
        <option value="en">EN — English</option>
      </select>
      <main>
        <div className="projectmain">
          <h1 className="projecttitle">{title}</h1>
          <div className="students tagbubble">
            {Object.values(roomMembers).map((member) => {
              return <span key={member.rawDisplayName}>{member.rawDisplayName}</span>
            })}
          </div>
          {projectImage &&
            <div className="featureimage image">
              <img src={matrixClient.mxcUrlToHttp(projectImage.url)} alt={projectImage.alt} />
            </div>}

          {// <h2>{t('Description')}</h2>
                  }
          <p>{description?.en}</p>
          {blocks?.map((content) => {
            console.log(content)
            return <DisplayPreview content={content} key={content.name} />
          }
            // <DisplayContent block={content} index={i} blocks={blocks} projectSpace={spaceObject?.rooms.filter(room => room.name === contentLang)[0].room_id} reloadSpace={reloadSpace} time={getCurrentTime} present={medienhausMeta?.present} key={content + i + content?.lastUpdate} />
          )}

        </div>

        <div className="info">
          <div className="label">Fakultät</div>
          <div className="tagbubble">
            {Object.values(roomMembers).map((member) => {
              return <span key={member.rawDisplayName}>{member.rawDisplayName}</span>
            })}
          </div>

          <div className="label">Fakultät</div>
          <div className="tagbubble"><span>Visuelle Kommunikation</span><span>Raumklasse, Prof. Gabi Schillig</span></div>

          <div className="label">Ort</div>
          <div className="tagbubble"><span>Grunewaldstraße 4–5</span><span>Raum 105/106</span></div>
        </div>

      </main>
    </div>
  )
}
export default Preview
