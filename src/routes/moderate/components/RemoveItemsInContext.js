import React, { useCallback, useEffect, useState } from 'react'
import config from '../../../config.json'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
// import { ReactComponent as BinIcon } from '../../../assets/icons/remix/trash.svg'
import DeleteButton from '../../create/components/DeleteButton'
import { fetchList } from '../../../helpers/MedienhausApiHelper'

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

export default function RemoveItemsInContext ({ parent, onRemoveItemFromContext }) {
  const [items, setItems] = useState([])
  const [highlightedElement, setHighlightedElement] = useState()
  const [error, setError] = useState('')
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

    if (config.medienhaus.api) {
      const listFromApi = await fetchList(parent).catch(() => setError('❗️' + t('An error occured trying to fetch the items in the context. Please try reloading the page.')))
      if (listFromApi) {
        setItems(listFromApi.filter(room => room.type === 'item'))
      } else {
        await fetchItemsFromMatrix()
      }
    } else {
      await fetchItemsFromMatrix()
    }
  }, [matrixClient, parent, t])

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
      {error || (items.length < 1
        ? <p>{t('There are no items in this context at the moment.')}</p>
        : <UlElement> {items.map((item, index) => {
          return (
            <ListElement onClick={() => setHighlightedElement(prevState => prevState === item.room_id ? '' : item.room_id)} active={highlightedElement === item.room_id} key={item.room_id}>
              {item.name}
              <DeleteButton width="2rem" onDelete={(e) => onDelete(e, item.room_id)} />
              {/* <BinIcon fill={highlightedElement === item.room_id ? 'var(--color-bg)' : 'var(--color-fg)'} /> */}
            </ListElement>
          )
        }
        )}
        </UlElement>)}
    </>
  )
};
