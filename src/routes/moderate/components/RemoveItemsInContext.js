import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import DeleteButton from '../../create/components/DeleteButton'

const Container = styled.ul`
    border:solid;
    max-height: 30vh;
    overflow-y: scroll;
    `

const ListElement = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${props => props.active ? 'var(--color-fg)' : 'none'};
    color: ${props => props.active ? 'var(--color-bg)' : 'none'};

    li{
        list-style-type: none;
        padding: calc(var(--margin)/2);
    }

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

    <div>

      {items.length < 1
        ? <p>{t('There are no items in this context at the moment.')}</p>
        : <Container> {items.map((item, index) => {
          return (
            <ListElement onClick={() => setHighlightedElement(prevState => prevState === item.room_id ? '' : item.room_id)} active={highlightedElement === item.room_id} key={item.room_id}>
              <li>{item.name}</li>
              <DeleteButton width="2rem" onDelete={(e) => onDelete(e, item.room_id)} />
              {/* <BinIcon fill={highlightedElement === item.room_id ? 'var(--color-bg)' : 'var(--color-fg)'} /> */}
            </ListElement>
          )
        }
        )}

        </Container>}
    </div>

  )
};
