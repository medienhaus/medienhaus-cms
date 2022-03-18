import React, { useCallback, useEffect, useState } from 'react'
import { Loading } from '../../../components/loading'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import config from '../../../config.json'

import LiElement from './LiElement'

const Ul = styled.ul`
  list-style: none;
  cursor: pointer;

  li:hover, li.selected {
    text-decoration: underline;
  }

`

const UlElement = ({ roomId, indent, removeContentElement }) => {
  const [active, setActive] = useState('')
  const [roomArray, setRoomArray] = useState([])
  const context = config.medienhaus?.context ? config.medienhaus?.context.concat('context') : ['context']
  const content = config.medienhaus?.content ? Object.keys(config.medienhaus?.content).concat('content') : ['content']
  const typesOfContent = context.concat(content)
  const matrixClient = Matrix.getMatrixClient()

  const fetchHiararchy = useCallback(async () => {
    const hierarchy = []

    async function getBatchOfRooms (pagination) {
      const getRooms = await matrixClient.getRoomHierarchy(roomId, 50, 1, false, pagination !== 'undefined' ? pagination : false)
      hierarchy.push(...getRooms.rooms.filter(rooms => rooms.room_id !== roomId))
      for (const room in hierarchy) {
        const metaEvent = await matrixClient.getStateEvent(hierarchy[room].room_id, 'dev.medienhaus.meta').catch(console.log)
        if (metaEvent) hierarchy[room].metaEvent = metaEvent
      }
      hierarchy.pagination && await getBatchOfRooms(pagination)
    }
    await getBatchOfRooms()

    setRoomArray(hierarchy)
  }, [matrixClient, roomId])

  useEffect(() => {
    fetchHiararchy()
  }, [fetchHiararchy])

  const callback = (activeRoom, type) => {
    setActive(activeRoom)
    if (content.includes(type)) {
      removeContentElement(activeRoom, roomId, () => setRoomArray())
    } else {
      removeContentElement('')
    }
  }

  if (!roomArray) return <Loading />
  return (
    <Ul>
      {roomArray.filter(room => typesOfContent.includes(room.metaEvent.type)).map((room) => {
        return (
          <LiElement
            key={room.room_id}
            roomId={room.room_id}
            parent={roomId}
            type={room.metaEvent?.type}
            name={room.name}
            callback={callback}
            active={active}
            indent={indent}
            content={content}
            onElementRemoved={fetchHiararchy}
          />
        )
      })}
    </Ul>
  )
}
export default UlElement
