import React, { useCallback, useEffect, useState } from 'react'
import config from '../../../config.json'
import Matrix from '../../../Matrix'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
// import { ReactComponent as BinIcon } from '../../../assets/icons/remix/trash.svg'
import DeleteButton from '../../create/components/DeleteButton'

const Container = styled.div`
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
export default function RemoveItemsInContext ({ parent, handleSpaceChild }) {
  const [items, setItems] = useState([])
  const [highlightedElement, setHighlightedElement] = useState()
  const { t } = useTranslation()
  const matrixClient = Matrix.getMatrixClient()

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

    if (config.medienhaus.api) {
      const fetchFromApi = await fetch(config.medienhaus.api + parent + '/list')
      console.log(fetchFromApi)
      if (fetchFromApi.ok) {
        const allItems = await fetchFromApi.json()
        console.log(allItems)
        setItems(allItems.filter(room => room.type === 'item'))
      } else {
        await fetchItemsFromMatrix()
      }
    } else {
      await fetchItemsFromMatrix()
    }
  }, [matrixClient, parent])

  const onDelete = (e, roomId) => {
    setItems(prevState => prevState.filter(room => room.room_id !== roomId))
    handleSpaceChild(e, roomId, false)
  }

  useEffect(() => {
    getAllItemsinContext()
  }, [getAllItemsinContext, parent])

  if (!items) return
  return (
    <section>
      <h2>{t('Remove Items')}</h2>
      <Container>
        <ul>
          {items.map((item, index) => {
            return (
              <ListElement onClick={() => setHighlightedElement(prevState => prevState === item.room_id ? '' : item.room_id)} active={highlightedElement === item.room_id} key={item.room_id}>
                <li>{item.name}</li>
                <DeleteButton width="2rem" onDelete={(e) => onDelete(e, item.room_id)} />
                {/* <BinIcon fill={highlightedElement === item.room_id ? 'var(--color-bg)' : 'var(--color-fg)'} /> */}
              </ListElement>
            )
          })}
        </ul>
      </Container>
    </section>
  )
};
