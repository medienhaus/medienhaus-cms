import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Loading } from '../../components/loading'
import config from '../../config.json'
import Matrix from '../../Matrix'
import DisplayPreview from '../preview/components/DisplayPreview'

const Pages = () => {
  const [content, setContent] = useState()
  const params = useParams()
  const pageRoomId = config.medienhaus.pages[params.id].room_id
  const matrixClient = Matrix.getMatrixClient()
  const { i18n } = useTranslation()

  useEffect(() => {
    const fetchPageContent = async () => {
      setContent()
      const fetchHierarchy = await matrixClient.getRoomHierarchy(pageRoomId).catch(console.log)
      const selectedLanguageSpace = fetchHierarchy.rooms.filter(room => room.name === i18n.language)
      const fetchLanguageSpaceContent = await matrixClient.getRoomHierarchy(selectedLanguageSpace[0].room_id).catch(console.log)
      setContent(fetchLanguageSpaceContent.rooms
        .filter(room => room.room_id !== pageRoomId)
        .filter(room => !room.name.includes(i18n.language))
        .filter(room => room.name.charAt(0) !== 'x').sort((a, b) => {
          return a.name.substring(0, a.name.indexOf('_')) - b.name.substring(0, b.name.indexOf('_'))
        }))
    }
    fetchPageContent()
  }, [i18n.language, matrixClient, pageRoomId])

  if (!content) return <Loading />
  return (
    <div>
      {content.map(room => <DisplayPreview key={room.room_id} content={room} matrixClient={matrixClient} />)}
    </div>
  )
}
export default Pages
