import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    const fetchPageContent = async () => {
      const hierarchy = await matrixClient.getRoomHierarchy(pageRoomId)
      setContent(hierarchy.rooms
        .filter(room => room.room_id !== pageRoomId)
        .filter(room => !room.name.includes(config.medienhaus.languages))
        .filter(room => room.name.charAt(0) !== 'x').sort((a, b) => {
          return a.name.substring(0, a.name.indexOf('_')) - b.name.substring(0, b.name.indexOf('_'))
        }))
    }
    fetchPageContent()
  }, [matrixClient, pageRoomId])

  if (!content) return <Loading />
  return (
    <div>
      <h2>{config.medienhaus.pages[params.id].label}</h2>
      {content.map(room => <DisplayPreview key={room.room_id} content={room} matrixClient={matrixClient} />)}
    </div>
  )
}
export default Pages
