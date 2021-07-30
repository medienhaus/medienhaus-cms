import React, { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import config from '../../config.json'

import Page from './Page'

const Pages = () => {
  const matrixClient = Matrix.getMatrixClient()
  const [pages, setPages] = useState()

  useEffect(() => {
    const getSummary = async () => {
      const summary = await matrixClient.getSpaceSummary(config.routeId)
        .then(async res => {
          const roomId = res.rooms.filter(room => room.name === 'content')[0].room_id
          const content = await matrixClient.getSpaceSummary(roomId)
          return content.rooms.filter(room => room.room_id !== roomId)
        }
        )
      setPages(summary)
    }

    getSummary()
  }, [matrixClient])

  return (
    <Page pages={pages} />
  )
}
export default Pages
