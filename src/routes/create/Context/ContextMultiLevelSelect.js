import React, { useCallback, useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'

const ContextMultiLevelSelectSingleLevel = ({ parentSpaceRoomId, selectedContextRoomId, onSelect, onFetchedChildren, templatePlaceholderMapping, sortAlphabetically, showTopics }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [parentSpaceMetaEvent, setParentSpaceMetaEvent] = useState()
  const [childContexts, setChildContexts] = useState()
  const { t } = useTranslation('ui')

  useEffect(() => {
    let isSubscribed = true

    // Fetch meta event of the parent space
    const fetchMetaEvent = async () => {
      const metaEvent = await Matrix.getMatrixClient().getStateEvent(parentSpaceRoomId, 'dev.medienhaus.meta').catch(() => {})
      isSubscribed && setParentSpaceMetaEvent(metaEvent)
    }

    // Fetch all child contexts
    const fetchChildContexts = async () => {
      let newChildContexts = []
      const roomHierarchy = await Matrix.getMatrixClient().getRoomHierarchy(parentSpaceRoomId, undefined, 1)
      // Remove the first entry, which is the context we retrieved the children for
      roomHierarchy.rooms.shift()
      // Ensure we're looking at contexts, and not spaces/rooms of other types
      for (const room of roomHierarchy.rooms) {
        const metaEvent = await Matrix.getMatrixClient().getStateEvent(room.room_id, 'dev.medienhaus.meta').catch(() => {})
        if (metaEvent && metaEvent.type === 'context') newChildContexts.push(room)
      }
      if (sortAlphabetically) {
        newChildContexts = _.sortBy(newChildContexts, 'name')
      }
      if (!isSubscribed) return
      onFetchedChildren(newChildContexts.length > 0)
      setChildContexts(newChildContexts)
    }

    const fetch = async () => {
      setIsLoading(true)
      if (templatePlaceholderMapping) await fetchMetaEvent()
      await fetchChildContexts()
      setIsLoading(false)
    }

    fetch()

    return () => {
      isSubscribed = false
    }
    // Do not list `onFetchedChildren` as a dependency because for some reason that will keep re-rendering this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentSpaceRoomId, sortAlphabetically, templatePlaceholderMapping])

  if (isLoading) {
    return <select key="loading" disabled><option>{t('loading...')}</option></select>
  }

  if (childContexts.length < 1) {
    return null
  }

  return (
    <select
      value={selectedContextRoomId}
      onChange={(e) => {
        onSelect(parentSpaceRoomId, e.target.value)
      }}
    >
      {
        (templatePlaceholderMapping && parentSpaceMetaEvent && templatePlaceholderMapping[parentSpaceMetaEvent.template]
          // If we have a template-specific placeholder, show that...
          ? <option disabled value="">{templatePlaceholderMapping[parentSpaceMetaEvent.template]}</option>
          // ... otherwise just show an empty placeholder
          : <option disabled value="" />
        )
      }
      {Object.entries(childContexts).map(([key, room]) => (
        <option key={key} value={room.room_id}>
          {room.name}
          {showTopics && room.topic && (` (${room.topic})`)}
        </option>
      ))}
    </select>
  )
}

/**
 * This component renders a multi-level <select> UI for an arbitrary set of contexts in the sense of Matrix spaces.
 * `activeContexts` is the array of room IDs for the currently set context spaces.
 *
 * @param [Array] activeContexts
 * @param [Func] onChange (newActiveContexts, isLeaf)
 * @param [Bool] showTopics - If the contents of m.room.topic should be displayed in parentheses next to the name
 * @param [Bool] sortAlphabetically - If entries should be ordered alphabetically
 * @param [Object] templatePlaceholderMapping - Optional object containing placeholders for each <select> based on the `dev.medienhaus.meta.template` of the parent context
 */
const ContextMultiLevelSelect = ({ activeContexts, onChange, showTopics, sortAlphabetically, templatePlaceholderMapping }) => {
  const onSelect = useCallback((parentContextRoomId, selectedChildContextRoomId) => {
    const newActiveContexts = [...activeContexts.splice(0, activeContexts.findIndex((contextRoomId) => contextRoomId === parentContextRoomId) + 1)]
    if (selectedChildContextRoomId) newActiveContexts.push(selectedChildContextRoomId)
    onChange(newActiveContexts, undefined)
  }, [activeContexts, onChange])

  const onFinishedFetchingChildren = useCallback((hasChildren) => {
    if (onChange.length > 1) {
      onChange(activeContexts, !hasChildren)
    }
  }, [activeContexts, onChange])

  return (
    <>
      {activeContexts && activeContexts.map((contextRoomId, i) => (
        <ContextMultiLevelSelectSingleLevel
          key={contextRoomId}
          onSelect={onSelect}
          onFetchedChildren={onFinishedFetchingChildren}
          parentSpaceRoomId={contextRoomId}
          selectedContextRoomId={activeContexts[i + 1] ?? ''}
          showTopics={showTopics}
          sortAlphabetically={sortAlphabetically}
          templatePlaceholderMapping={templatePlaceholderMapping}
        />
      ))}
    </>
  )
}

export default ContextMultiLevelSelect