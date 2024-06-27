import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import * as _ from 'lodash'
// import SimpleContextSelect from '../../../components/SimpleContextSelect'
import DeleteButton from '../components/DeleteButton'
import config from '../../../config.json'
import findValueDeep from 'deepdash/findValueDeep'

import styled from 'styled-components'
import ContextDropdown from '../../../components/ContextDropdown'

import { fetchContextTree, fetchId, removeFromParent, triggerApiUpdate } from '../../../helpers/MedienhausApiHelper'
import { createMatrixStructureObject } from '../../../helpers/createMatrixStructureObject'

const RemovableLiElement = styled.li`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: space-between;
  list-style: none;
  height: 2rem;
  margin-bottom: calc(var(--margin) / 2);
`

const Category = ({ projectSpace, onChange, parent }) => {
  const [loading, setLoading] = useState(true)
  const [contexts, setContexts] = useState(undefined)
  const [error, setError] = useState('')
  const [inputItems, setInputItems] = useState()
  const matrixClient = Matrix.getMatrixClient()

  const createObject = async () => {
    setLoading(true)
    const matrixObject = await createMatrixStructureObject(parent, projectSpace, setContexts)
    setInputItems(matrixObject[0][parent])
    setLoading(false)
  }

  const fetchTreeFromApi = async () => {
    const fetchTree = await fetchContextTree(localStorage.getItem(process.env.REACT_APP_APP_NAME + '_root_context_space'))
    setInputItems(fetchTree)
  }

  const fetchParentsFromApi = async () => {
    // @TODO make sure api returns join rules
    const fetchParents = await fetchId(projectSpace)
    if (fetchParents.parents) {
      if (_.isEmpty(fetchParents.parents)) {
        setContexts([]) // if parents is empty we set contexts to an empty array for the PublishProjects component.
      } else {
        fetchParents.parents.forEach(async parent => {
          const fetchParent = await fetchId(parent)
          setContexts(contexts => {
            if (contexts) return [...contexts, { name: fetchParent.name, room_id: fetchParent.id }]
            else return [{ name: fetchParent.name, room_id: fetchParent.id }]
          })
        })
      }
    } else if (fetchParents.statusCode === 404) {
      setContexts([]) // if the api doesn't know about the project we can safely assume it does not have a parent yet. Therefor we set contexts to an empty array for the PublishProjects component.
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!cancelled && config.medienhaus.api) {
      setLoading(true)
      fetchTreeFromApi()
      fetchParentsFromApi()
      setLoading(false)
    } else {
      createObject()
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    let cancelled = false

    !cancelled && contexts !== undefined && onChange(!_.isEmpty(contexts))

    return () => {
      cancelled = true
    }
  }, [contexts, onChange])

  async function onContextChosen (contextSpace) {
    setLoading(true)
    // this will be refactored with new logic once the api can return the updated /$id/path immediately after adding a space child.
    let contextObject
    if (config.medienhaus.api) {
      contextObject = await fetchId(contextSpace)
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
    if (!contextObject.membership) {
      // if there is no membership (most likely because the contextObject came from the api) we need to check if the user is already a member of the context
      // first we check if the user is already a member of the context
      contextObject.membership = matrixClient.getRoom(contextSpace)?.getMyMembership()
      if (!contextObject.membership) {
        // if the above check fails we check the m.room.member event of the user in the context
        const memberEvent = await matrixClient.getStateEvent(contextSpace, 'm.room.member', matrixClient.getUserId())
          .catch(console.log)
        if (memberEvent?.membership) contextObject.membership = memberEvent.membership
      }
      // we check to see if the join rule of the context is 'knock' or 'knock_restricted'
      const joinRuleEvent = await Matrix.getMatrixClient().getStateEvent(contextSpace, 'm.room.join_rules')
      if (joinRuleEvent?.join_rule !== 'knock' && joinRuleEvent.join_rule !== 'knock_restricted') return
      contextObject.joinRule = joinRuleEvent.join_rule
    }
    // If this project was in a different context previously we should try to take it out of the old context

    // if (currentContext && currentContext !== contextSpace) await Matrix.removeSpaceChild(currentContext, projectSpace).catch(console.log)

    // Add this current project to the given context space

    // if the join rule of the context is knock, we need to ask to join first.
    // @TODO if the membership is invite, we should first join the room and then add the content to the context.
    // atm we try to add the content to the context and if that fails we try to join the context. therefore creating an extra api call.

    if (contextObject.membership !== 'join' && contextObject.membership !== 'invite') {
      if (contextObject.joinRule === 'knock' || contextObject.joinRule === 'knock_restricted') {
        if (contextObject.membership === 'knock') {
          alert('You have already requested to join this context. You will be notified once you are accepted.')
          setLoading(false)
          return
        }
        const knockOnRoom = window.confirm('You need to ask to join this context first. Do you want to ask to join the context?')
        if (knockOnRoom) {
          const knock = await Matrix.knockOnMatrixRoom(contextObject.id).catch((error) => alert('The following error occurred: ' + error.data?.error))
          if (knock.room_id) {
            alert('You have asked to join the context. You will be notified once you are accepted.')
            contextObject.membership = 'knock'
          }
        }

        setLoading(false)

        return
      }
    }
    const addToContext = await Matrix.addSpaceChild(contextSpace, projectSpace)
      .catch(async () => {
        // if we can't add the content to a context we check the join_rules of the context

        // if we cant add the content to a context we try to join the context
        const joinRoom = await matrixClient.joinRoom(contextSpace).catch(console.log)
        if (joinRoom) {
          console.log('joined room')
          // then try to add the content to the context again
          const addToContext = await Matrix.addSpaceChild(contextSpace, projectSpace).catch(console.log)
          if (addToContext?.event_id) {
            setContexts(contexts => {
              if (contexts) return [...contexts, { name: contextObject.name, room_id: contextSpace }]
              else return [{ name: contextObject.name, room_id: contextSpace }]
            })

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
      setContexts(contexts => {
        if (contexts) return [...contexts, { name: contextObject.name, room_id: contextSpace }]
        else return [{ name: contextObject.name, room_id: contextSpace }]
      })
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
      {/* }
      <p>{t('In which context do you want to publish your project?')}</p>
      <p>{t('This information is necessary to show your project in the right place on the Rundgang 2021 website, and must therefore be specified when you change the visibility of the project to public.')}</p>
      <p>{t('The context can be a class, a course, a seminar or a free project. If you are unsure, ask the professor of your class or the seminar leader.')}</p>
      <p>{t('You can scroll through the list, or filter/search the list by typing one or more keywords.')}</p>
  */}
      {!inputItems || loading
        ? <Loading />
        : <>
          {contexts?.length > 0 && <ul style={{ position: 'relative' }}>
            {contexts?.map((context) => {
              return (
                <RemovableLiElement key={context.room_id}>
                  <span>{context.name} </span>
                  <DeleteButton height="2rem" width="2rem" onDelete={async () => { await handleRemove(context.room_id) }} />
                </RemovableLiElement>
              )
            })}
          </ul>}

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
