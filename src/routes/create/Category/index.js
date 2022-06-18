import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import * as _ from 'lodash'
// import SimpleContextSelect from '../../../components/SimpleContextSelect'
import DeleteButton from '../components/DeleteButton'
import { useTranslation } from 'react-i18next'
import config from '../../../config.json'
import findValueDeep from 'deepdash/es/findValueDeep'

import styled from 'styled-components'
import ContextDropdown from '../../../components/ContextDropdown'

import { triggerApiUpdate, fetchContextTree, fetchId } from '../../../helpers/MedienhausApiHelper'

const RemovableLiElement = styled.li`
    display: flex;
    justify-content: space-between;
    list-style: none;
    height: 2em;
    margin-bottom: calc(var(--margin)/2);

    span {
      display: flex;
      align-self: self-end;
    }
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
          id: id,
          name: name,
          type: metaEvent.content.type,
          children: {}
        }
      }

      async function scanForAndAddSpaceChildren (spaceId, path) {
        if (spaceId === 'undefined') return
        const stateEvents = await matrixClient.roomState(spaceId).catch(console.log)

        // check if room exists in roomHierarchy
        // const existsInCurrentTree = _.find(hierarchy, {room_id: spaceId})
        // const metaEvent = await matrixClient.getStateEvent(spaceId, 'dev.medienhaus.meta')
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })
        if (!metaEvent) return
        // if (!typesOfSpaces.includes(metaEvent.content.type)) return

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
          // }
        }
      }

      await scanForAndAddSpaceChildren(motherSpaceRoomId, [])
      setLoading(false)
      return result
    }
    console.log('---- started structure ----')
    const tree = await getSpaceStructure(parent, false)
    setInputItems(tree)
  }

  const fetchTreeFromApi = async () => {
    const fetchTree = await fetchContextTree(process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID)
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
        setContexts(contexts => [...contexts, { name: fetchParent.name, room_id: fetchParent.id }])
      }
    }
  }

  useEffect(() => {
    if (config.medienhaus.api) {
      fetchTreeFromApi()
      fetchParentsFromApi()
    } else createStructurObject()
    // eslint-disable-next-line
  }, [])

  useEffect(() => onChange(!_.isEmpty(contexts)), [contexts, onChange])

  async function onContextChosen (contextSpace) {
    console.log(contextSpace)
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
        }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
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
            await triggerApiUpdate(projectSpace, contextSpace)
            setLoading(false)
          }
        } else {
          onChange(!_.isEmpty(contexts))
          setLoading(false)
          setError('An error occured. Make sure you have the rights to publish in the selected context')
          setTimeout(() => setError(''), 2500)
        }
      })
    if (addToContext?.event_id) {
      setContexts(contexts => [...contexts, { name: contextObject.name, room_id: contextSpace }])
      onChange(!_.isEmpty(contexts))
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
    removeSpacechild?.event_id && setContexts(contexts => contexts.filter(context => context.room_id !== parent))
  }

  return (
    <>
      <p>{t('In which context do you want to publish your project/event?')}</p>
      <p>{t('This information is necessary to show your project/event in the right place on the Rundgang 2022 website, and must therefore be specified when you change the visibility of the project/event to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
      <p>{t('You have the possibility to create multiple contexts if your event is i.e. interdisciplinary or a cooperation or similar.')}</p>

      {!inputItems || loading
        ? <Loading />
        : <>
          <ul style={{ position: 'relative' }}>
            {contexts?.map((context, index) => {
              return (
                <RemovableLiElement key={context.room_id}>
                  <span>{context.name} </span>
                  <DeleteButton width="2rem" onDelete={() => handleRemove(context.room_id)} />
                </RemovableLiElement>
              )
            })}
          </ul>

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
      {/* {subject !== '' && !member && <Knock room={room} callback={callback} />} */}
    </>
  )
}
export default Category
