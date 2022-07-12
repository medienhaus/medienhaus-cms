import ContextMultiLevelSelect from './ContextMultiLevelSelect'
import config from '../../../config.json'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Matrix from '../../../Matrix'
import * as _ from 'lodash'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { fetchId, fetchPathList, triggerApiUpdate } from '../../../helpers/MedienhausApiHelper'
import DeleteButton from '../components/DeleteButton'
import { Loading } from '../../../components/loading'

/**
 * @TODO This component does not work without the API.
 */
const UdKLocationContext = ({ itemSpaceRoomId }) => {
  const [currentLocationContext, setCurrentLocationContext] = useState()
  const [activeContexts, setActiveContexts] = useState([config.medienhaus?.locationId])
  const [isLeaf, setIsLeaf] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [fetching, setFetching] = useState(true)
  const { t } = useTranslation('locations')

  const templatePlaceholderMapping = useMemo(() => ({
    'location-university': t('-- select location --'),
    'location-building': t('-- select level --'),
    'location-level': t('-- select room --')
  }), [t])

  const fetchCurrentLocation = useCallback(async () => {
    const item = await fetchId(itemSpaceRoomId)
    // If the API does not know this item, or says that it does not have any parents, we don't do anything
    if (!item || !item.parents) {
      setFetching(false)
      return
    }
    // ... otherwise we check all parents until we find the one that says "location"
    for (const parent of item.parents) {
      const parentInfo = await fetchId(parent)
      if (parentInfo.template.includes('location')) {
        // This parent is our current location
        const pathList = await fetchPathList(parent)
        const indexOfLocationRoot = _.findIndex(pathList, { id: config.medienhaus?.locationId })
        setCurrentLocationContext({
          id: parent,
          pathList: pathList.slice(indexOfLocationRoot + 1)
        })
        break
      }
    }
    setFetching(false)
  }, [itemSpaceRoomId])

  useEffect(() => {
    fetchCurrentLocation()
  }, [fetchCurrentLocation, itemSpaceRoomId])

  const reset = () => {
    setActiveContexts([config.medienhaus?.locationId])
    setIsLeaf(false)
    setIsChanging(false)
  }

  const onSelectContext = useCallback((contexts, isLeaf) => {
    setActiveContexts(contexts)
    setIsLeaf(isLeaf)
  }, [])

  const onSave = useCallback(async () => {
    if (!isLeaf) return

    const selectedContextRoomId = _.last(activeContexts)

    // Remove item from possibly previously selected context
    if (currentLocationContext && currentLocationContext.id) {
      await Matrix.removeSpaceChild(currentLocationContext.id, itemSpaceRoomId)
      await triggerApiUpdate(currentLocationContext.id)
    }

    // Add this current item to the given context space
    await Matrix.addSpaceChild(selectedContextRoomId, itemSpaceRoomId)
      .catch(async () => {
        // If we can't add the item to a context we try to join the context first ...
        const joinRoom = await Matrix.getMatrixClient().joinRoom(selectedContextRoomId)
        if (joinRoom) {
          console.log('joined room')
          // ... and then try to add the item to the context again
          await Matrix.addSpaceChild(selectedContextRoomId, itemSpaceRoomId)
        }
      })

    await triggerApiUpdate(selectedContextRoomId)
    await triggerApiUpdate(itemSpaceRoomId, selectedContextRoomId)
    await fetchCurrentLocation()
    reset()
  }, [activeContexts, currentLocationContext, fetchCurrentLocation, isLeaf, itemSpaceRoomId])

  const onRemoveFromLocation = async () => {
    if (!currentLocationContext || !currentLocationContext.id) return

    await Matrix.removeSpaceChild(currentLocationContext.id, itemSpaceRoomId)
    await triggerApiUpdate(currentLocationContext.id)

    // @TODO Add API call to the not-yet-existing DELETE route
    // Otherwise the following line will have no point after refreshing the page
    setCurrentLocationContext(null)
  }

  if (fetching) return <Loading />

  if (currentLocationContext && !isChanging) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{_.map(currentLocationContext.pathList, 'name').join(', ')}</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ width: 'auto' }} onClick={() => { setIsChanging(true) }}>{t('CHANGE')}</button>
            {/* eslint-disable-next-line promise/param-names */}
            <DeleteButton
              width="calc(var(--margin) * 2.5)"
              height="calc(var(--margin) * 2.5)"
              onDelete={onRemoveFromLocation}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ContextMultiLevelSelect
        onChange={onSelectContext}
        activeContexts={activeContexts}
        sortAlphabetically
        showTopics
        templatePlaceholderMapping={templatePlaceholderMapping}
        templatePrefixFilter="location-"
      />
      {((activeContexts.length > 1 || isChanging) && (
        <div className="confirmation">
          <button className="cancel" onClick={reset}>{t('CANCEL')}</button>
          <LoadingSpinnerButton disabled={!isLeaf} onClick={onSave}>{t('SAVE')}</LoadingSpinnerButton>
        </div>
      ))}
    </>
  )
}

export default UdKLocationContext
