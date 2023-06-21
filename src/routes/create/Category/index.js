import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import * as _ from 'lodash'
// import SimpleContextSelect from '../../../components/SimpleContextSelect'
import DeleteButton from '../components/DeleteButton'
import { useTranslation } from 'react-i18next'
import config from '../../../config.json'
import findValueDeep from 'deepdash/findValueDeep'

import styled from 'styled-components'
import ContextDropdown from '../../../components/ContextDropdown'

import { triggerApiUpdate, fetchContextTree, fetchId, removeFromParent } from '../../../helpers/MedienhausApiHelper'

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

const Category = ({ projectSpace, onChange, parent, setLocationFromLocationTree }) => {
  const [loading, setLoading] = useState(true)
  const [contexts, setContexts] = useState([])
  const [error, setError] = useState('')
  const [inputItems, setInputItems] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('content')

  const createStructurObject = async () => {
    setLoading(true)
    async function getSpaceStructure (motherSpaceRoomId, includeRooms) {
      const result = {}

      function createSpaceObject (id, name, metaEvent) {
        return {
          id,
          name,
          type: metaEvent.content.type,
          children: {}
        }
      }

      async function scanForAndAddSpaceChildren (spaceId, path) {
        if (spaceId === 'undefined') return
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        // make sure we only show contexts
        if (_.get(metaEvent, 'content.type') !== 'context') return
        // make sure we have a name for the context
        const nameEvent = _.find(stateEvents, { type: 'm.room.name' })
        if (!nameEvent) return
        const spaceName = nameEvent.content.name
        _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent))

        console.log(`getting children for ${spaceId} / ${spaceName}`)
        for (const event of stateEvents) {
          if (event.type !== 'm.space.child' && !includeRooms) continue
          if (event.type === 'm.space.child' && _.size(event.content) === 0) continue // check to see if body of content is empty, therefore space has been removed
          if (event.state_key === projectSpace) setContexts(contexts => [...contexts, { name: spaceName, room_id: event.room_id }]) // add context to the contexts array if the projectspace is a child of it
          if (event.room_id !== spaceId) continue

          await scanForAndAddSpaceChildren(event.state_key, [...path, spaceId, 'children'])
        }
      }

      await scanForAndAddSpaceChildren(motherSpaceRoomId, [])
      setLoading(false)
      return result
    }
    console.log('---- started structure ----')
    const tree = await getSpaceStructure(parent, false)
    setInputItems(tree[parent])
  }

  const fetchTreeFromApi = async () => {
    const fetchTree = await fetchContextTree(localStorage.getItem(process.env.REACT_APP_APP_NAME + '_root_context_space'))
    setInputItems(fetchTree)
    setLoading(false)
  }

  const fetchParentsFromApi = async () => {
    const fetchParents = await fetchId(projectSpace)
    if (fetchParents.parents) {
      for (const parent of fetchParents.parents) {
        const fetchParent = await fetchId(parent)
        if (fetchParent.template.includes('location')) {
          // if the parent is a location element we set it to our current location and continue with the next element
          setLocationFromLocationTree(fetchParent.id)
          continue
        }
        if (fetchParent.template.includes('format')) {
          // if the parent is a format element we continue with the next element
          continue
        }
        setContexts(contexts => [...contexts, { name: fetchParent.name, room_id: fetchParent.id }])
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!cancelled && config.medienhaus.api) {
      fetchTreeFromApi()
      fetchParentsFromApi()
    } else createStructurObject()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    let cancelled = false

    !cancelled && onChange(!_.isEmpty(contexts))

    return () => {
      cancelled = true
    }
  }, [contexts, onChange])

  async function onContextChosen (contextSpace) {
    setLoading(true)
    // this will be refactored with new logic once the api can return the updated /$id/path immediately after adding a space child.
    let contextObject
    if (config.medienhaus.api) {
      const fetchPath = await fetchId(contextSpace)
      contextObject = fetchPath
    } else {
      contextObject = findValueDeep(
        inputItems,
        (value, key, parent) => {
          if (value.id === contextSpace) return true
        }, { childrenPath: 'children', includeRoot: true, rootIsChildren: false })
    }
    const projectSpaceMetaEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta').catch(console.log)
    // remove legacy code:
    // if the medienhaus meta event still has a context key, we remove it from the object.
    if (projectSpaceMetaEvent.context) {
      delete projectSpaceMetaEvent.context
      await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', projectSpaceMetaEvent).catch(console.log)
    }

    // If this project was in a different context previously we should try to take it out of the old context

    // if (currentContext && currentContext !== contextSpace) await Matrix.removeSpaceChild(currentContext, projectSpace).catch(console.log)

    // Add this current project to the given context space
    const addToContext = await Matrix.addSpaceChild(contextSpace, projectSpace)
      .catch(async () => {
      // if we cant add the content to a context we try to join the context
        const joinRoom = await matrixClient.joinRoom(contextSpace).catch(console.log)
        if (joinRoom) {
          console.log('joined room')
          // then try to add the conent to the context again
          const addToContext = await Matrix.addSpaceChild(contextSpace, projectSpace).catch(console.log)
          if (addToContext?.event_id) {
            setContexts(contexts => [...contexts, { name: contextObject.name, room_id: contextSpace }])
            onChange(!_.isEmpty(contexts))
            await triggerApiUpdate(contextSpace)
            await triggerApiUpdate(projectSpace, contextSpace)
            setLoading(false)
          }
        } else {
          onChange(!_.isEmpty(contexts))
          setLoading(false)
          setError('An error occurred. Make sure you have the rights to publish in the selected context')
          setTimeout(() => setError(''), 2500)
        }
      })
    if (addToContext?.event_id) {
      setContexts(contexts => [...contexts, { name: contextObject.name, room_id: contextSpace }])
      onChange(!_.isEmpty(contexts))
      await triggerApiUpdate(contextSpace)
      await triggerApiUpdate(projectSpace, contextSpace)
      setLoading(false)
    }
  }

  const handleRemove = async (parent, recursion) => {
    const removeSpacechild = await Matrix.removeSpaceChild(parent, projectSpace).catch(async (e) => {
      // if we cant add the content to a context we try to join the context
      if (!recursion) {
        const joinRoom = await matrixClient.joinRoom(parent).catch(console.log)
        // if we were able to join the room we try again
        if (joinRoom) handleRemove(parent, true)
      }
      setError(e?.message)
      setTimeout(() => setError(''), 2500)
    })
    if (removeSpacechild?.event_id && config.medienhaus.api) {
      await removeFromParent(projectSpace, [parent]).catch((e) => {
        console.debug(e)
        setError(e)
        setTimeout(() => setError(''), 2500)
      })
    }
    removeSpacechild?.event_id && setContexts(contexts => contexts.filter(context => context.room_id !== parent))
  }

  return (
    <>
      <p>{t('In which context do you want to publish your project?')}</p>

      {!inputItems || loading
        ? <Loading />
        : <>
          {contexts?.length > 0 && <UlElement style={{ position: 'relative' }}>
            {contexts?.map((context, index) => {
              return (
                <ListElement key={context.room_id}>
                  {context.name}
                  <DeleteButton height="2rem" width="2rem" onDelete={async () => { await handleRemove(context.room_id) }} />
                </ListElement>
              )
            })}
          </UlElement>}

          {/* <SimpleContextSelect
              selectedContext=""
              onItemChosen={onContextChosen}
              contexts={contexts}
              struktur={inputItems}
            /> */}
          <ContextDropdown
            selectedContext=""
            onItemChosen={onContextChosen}
            contexts={contexts}
            struktur={inputItems}
          />
        </>}
      {error && <p>{error}</p>}

      <p>{t('Context means: a class, a course, a seminar, a free project …')}</p>
      <p>{t('In case of collaborations or interdisciplinary projects, several contexts can be selected.')}</p>

      {/* {subject !== '' && !member && <Knock room={room} callback={callback} />} */}
    </>
  )
}
export default Category
