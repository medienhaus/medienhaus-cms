import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import DeleteButton from '../../create/components/DeleteButton'

const UlElement = styled.ul`
  background-color: ${props => props.active ? 'var(--color-fg)' : 'none'};
  color: ${props => props.active ? 'var(--color-bg)' : 'none'};
  display: grid;
  grid-gap: calc(var(--margin) * 0.5);
  align-items: center;
`

const ListElement = styled.li`
  display: grid;
  grid-template-columns: 1fr 2rem;
  grid-gap: var(--margin);
  align-items: center;
  justify-content: space-between;
`

export default function RemoveItemsInContext ({ parent, itemsInContext, onRemoveItemFromContext }) {
  const [items, setItems] = useState([])
  const [highlightedElement, setHighlightedElement] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('moderate')

  const getAllItemsinContext = useCallback(async () => {
    // we start with an empty array to remove any items from a different context on parent change
    setItems([])

    const fetchItemsFromMatrix = async () => {
      const fetchFromMatrix = await matrixClient.getRoomHierarchy(parent)
      fetchFromMatrix.rooms.filter(room => room.room_id !== parent).forEach(async room => {
        const meta = await matrixClient.getStateEvent(room.room_id, 'dev.medienhaus.meta')
        // we only want to list items and no language items
        if (meta.type !== 'item') return
        if (meta.template === 'lang') return
        room.type = meta.type
        room.template = meta.template
        setItems(prevState => [...prevState, room])
      })
    }
    if (itemsInContext) setItems(itemsInContext)
    else {
      await fetchItemsFromMatrix()
    }
  }, [matrixClient, parent, itemsInContext])

  const onDelete = (e, roomId) => {
    setItems(prevState => prevState.filter(room => room.room_id !== roomId))
    onRemoveItemFromContext(roomId)
  }

  useEffect(() => {
    getAllItemsinContext()
  }, [getAllItemsinContext, parent])

  if (!items) return

  return (
    <>
      {items.length < 1
        ? <p>{t('There are no items in this context at the moment.')}</p>
        : <UlElement> {items.map((item, index) => {
          return (
            <ListElement onClick={() => setHighlightedElement(prevState => prevState === item.room_id ? '' : item.room_id)} active={highlightedElement === item.room_id} key={item.room_id}>
              {item.name}
              <DeleteButton height="2rem" width="2rem" onDelete={(e) => onDelete(e, item.room_id)} />
              {/* <BinIcon fill={highlightedElement === item.room_id ? 'var(--color-bg)' : 'var(--color-fg)'} /> */}
            </ListElement>
          )
        }
        )}
        </UlElement>}
    </>
  )
};
