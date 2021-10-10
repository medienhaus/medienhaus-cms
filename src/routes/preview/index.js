import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../components/loading'
import DisplayPreview from './components/DisplayPreview'
import './preview.css?v=1.0'

const Preview = () => {
  const { t } = useTranslation('preview')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [blocks, setBlocks] = useState([])
  const [contentLang, setContentLang] = useState('en')
  const [roomMembers, setRoomMembers] = useState([])
  const [projectImage, setProjectImage] = useState([])
  const [description, setDescription] = useState('')
  const params = useParams()
  const projectSpace = params.spaceId
  const matrixClient = Matrix.getMatrixClient()

  const fetchSpace = useCallback(async () => {
    setLoading(true)
    if (matrixClient.isInitialSyncComplete()) {
      // here we collect all necessary information about the project
      const space = await matrixClient.getSpaceSummary(projectSpace)
      const spaceDetails = await matrixClient.getRoom(projectSpace)
      // setting title to project space name
      setTitle(space.rooms[0].name)
      // get names of artists
      setRoomMembers(spaceDetails.currentState.members)
      // set the topic depending on selected language
      setDescription(contentLang === 'de' ? (space.rooms.filter(room => room.name === 'de')[0].topic || '') : (space.rooms.filter(room => room.name === 'en')[0].topic || ''))
      // fetch project image if available
      const avatar = await matrixClient.getStateEvent(projectSpace, 'm.room.avatar').catch(() => {})
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

  if (loading) return <Loading />

  return (
    <section className="preview singleproject">
      <p>❗️ {t('Please note: Some parts of your project can’t be previewed, yet. We’re still working on displaying all attributes and content blocks in the preview, and if you miss some attributes like date, time or venue, please check back in some days.')}</p>
      <select
        id="subject" name="subject" value={contentLang} onChange={(e) => {
          setContentLang(e.target.value)
        }}
      >
        <option value="de">DE — Deutsch</option>
        <option value="en">EN — English</option>
      </select>
      <div className="projectmain">
        <div className="headline">
          <h2 className="projecttitle">{title}</h2>
        </div>
        <div className="students tagbubble">
          {Object.values(roomMembers).map((member) => {
            return <span key={member.rawDisplayName}>{member.rawDisplayName}</span>
          })}
        </div>
        {projectImage &&
          <div className="featureimage image">
            <img src={matrixClient.mxcUrlToHttp(projectImage.url)} alt={projectImage.alt} />
          </div>}
        <div className="description">
          <p>{description}</p>
        </div>
        {blocks?.map((content) => <DisplayPreview content={content} matrixClient={matrixClient} key={content.name} />)}
      </div>

      {/* <div className="info"> */}
      {/*  <div className="label">{t('Fakultät')}</div> */}
      {/*  <div className="tagbubble"> */}
      {/*    {Object.values(roomMembers).map((member) => { */}
      {/*      return <span key={member.rawDisplayName}>{member.rawDisplayName}</span> */}
      {/*    })} */}
      {/*  </div> */}

      {/*  <div className="label">Fakultät</div> */}
      {/*  <div className="tagbubble"><span>Visuelle Kommunikation</span><span>Raumklasse, Prof. Gabi Schillig</span></div> */}

      {/*  <div className="label">Ort</div> */}
      {/*  <div className="tagbubble"><span>Grunewaldstraße 4–5</span><span>Raum 105/106</span></div> */}
      {/* </div> */}
    </section>
  )
}

export default Preview
