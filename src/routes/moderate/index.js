import React, { useEffect, useState } from 'react'
import Requests from './components/Requests'
import { Loading } from '../../components/loading'
import useJoinedSpaces from '../../components/matrix_joined_spaces'

import { MatrixEvent } from 'matrix-js-sdk'
import { useTranslation } from 'react-i18next'
import InviteUserToSpace from './components/InviteUserToSpace'
import RightsManagement from './components/RightsManagement'
import ManageContexts from './components/ManageContexts'
import RemoveContent from './components/RemoveContent'

import config from '../../config.json'
import TextNavigation from '../../components/medienhausUI/textNavigation'
import Invites from '../../components/Invites'
import Matrix from '../../Matrix'
import findValueDeep from 'deepdash/es/findValueDeep'
import * as _ from 'lodash'
import { fetchId } from '../../helpers/MedienhausApiHelper'

const Moderate = () => {
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
  const [userSearch, setUserSearch] = useState([])
  const [selection, setSelection] = useState('invite')
  const [fetching, setFetching] = useState(false)
  const [invites, setInvites] = useState({})
  const [loading, setLoading] = useState(false)
  const context = config.medienhaus?.context ? Object.keys(config.medienhaus?.context).concat('context') : ['context']
  const matrixClient = Matrix.getMatrixClient()

  const { t } = useTranslation('moderate')

  const createStructurObject = async () => {
    async function getSpaceStructure (matrixClient, motherSpaceRoomId, includeRooms) {
      const result = {}

      function createSpaceObject (id, name, metaEvent, topic) {
        return {
          id: id,
          name: name,
          type: metaEvent.content.type,
          topic: topic,
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
        let topic = _.find(stateEvents, { type: 'm.room.topic' })
        if (topic) topic = topic.content.topic
        // if (initial) {
        // result.push(createSpaceObject(spaceId, spaceName, metaEvent))
        _.set(result, [...path, spaceId], createSpaceObject(spaceId, spaceName, metaEvent, topic))
        // }

        // const spaceSummary = await matrixClient.getSpaceSummary(spaceId)
        console.log(`getting children for ${spaceId} / ${spaceName}`)
        for (const event of stateEvents) {
          if (event.type !== 'm.space.child' && !includeRooms) continue
          if (event.type === 'm.space.child' && _.size(event.content) === 0) continue // check to see if body of content is empty, therefore space has been removed
          if (event.room_id !== spaceId) continue

          await scanForAndAddSpaceChildren(event.state_key, [...path, spaceId, 'children'])
          // }
        }
      }

      await scanForAndAddSpaceChildren(motherSpaceRoomId, [])
      return result
    }

    console.log('---- started structure ----')
    const tree = await getSpaceStructure(matrixClient, process.env.REACT_APP_CONTEXT_ROOT_SPACE_ID, false)
    return tree
  }

  useEffect(() => {
    const controller = new AbortController()

    const handleModerationRooms = async () => {
      setLoading(true)
      let rooms = {}
      for (const space of joinedSpaces) {
        if (space.meta.type !== 'context') continue
        if (space.powerLevel < 50) continue
        if (config.medienhaus.api) {
          // we check to see if the space exists in our tree by checking if the api knows about it.
          const room = await fetchId(space.room_id, controller.signal).catch((e) => {
            console.debug(e)
            // @TODO add error handleing
          })
          if (room?.type !== 'context') continue
          space.parents = room.parents
          space.authors = room.origin.authors
        } else {
          // with no api we have to create the structure ourselves
          const tree = await createStructurObject()
          const contextObject = findValueDeep(
            tree,
            (value, key, parent) => {
              if (value.id === space.room_id) return true
            }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })

          if (!contextObject) {
            (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && console.debug('not found in tree: ' + space.room_id)
            continue
          }
        }
        rooms = Object.assign({}, rooms, {
          [space.room_id]:
          {
            name: space.name,
            id: space.room_id,
            room_id: space.room_id,
            template: space.meta.template,
            type: space.meta.type,
            membership: space.selfMembership,
            parents: space.parents,
            authors: space.authors
          }
        })
      }
      setModerationRooms(rooms)
      setLoading(false)
    }
    if (joinedSpaces) {
      // check to see if a user has joined a room with the specific content type and is moderator or admin (at least power level 50)
      handleModerationRooms()
    }
    return () => {
      controller && controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedSpaces])

  useEffect(() => {
    async function checkRoomForPossibleInvite (room) {
      // Ignore if this is not a space
      if (room.getType() !== 'm.space') return
      // Ignore if this is not a "context"
      const metaEvent = await matrixClient.getStateEvent(room.roomId, 'dev.medienhaus.meta').catch(() => { })
      if (!metaEvent || !metaEvent.template || !context.includes(metaEvent.template)) return
      // Ignore if this is not an invitation (getMyMembership() only works correctly after calling _loadMembersFromServer())
      await room.loadMembersFromServer().catch(console.error)
      if (room.getMyMembership() !== 'invite') return
      // At this point we're sure that this is an invitation we want to display, so we add it to the state:
      setInvites(invites => Object.assign({}, invites, {
        [room.roomId]:
          {
            name: room.name,
            id: room.roomId,
            membership: room.selfMembership
          }
      }))
    }

    // On page load: Get current set of invitations
    const allRooms = matrixClient.getRooms()
    allRooms.forEach(checkRoomForPossibleInvite)

    // While on the page: Listen for incoming room events to add possibly new invitations to the state
    matrixClient.on('Room', checkRoomForPossibleInvite)

    // When navigating away from /content we want to stop listening for those room events again
    return () => {
      matrixClient.removeListener('Room', checkRoomForPossibleInvite)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixClient])

  const removeInviteByIndex = (room) => {
    // setInvites(invites => invites.filter((invite, i) => i !== index))
    setInvites(Object.fromEntries(
      Object.entries(invites).filter(([key]) => key !== room)))
    reload(true)
  }

  const setPower = async (roomId, userId, level) => {
    console.log('changing power level for ' + userId)
    const stateEvent = await matrixClient.getStateEvent(roomId, 'm.room.power_levels', '')
    const powerEvent = new MatrixEvent({
      type: 'm.room.power_levels',
      content: stateEvent
    })
    return matrixClient.setPowerLevel(roomId, userId, level, powerEvent)
  }

  const fetchUsers = async (e, search) => {
    e.preventDefault()
    setFetching(true)
    try {
      const users = await matrixClient.searchUserDirectory({ term: search })
      // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
      users.results.length > 0 && setUserSearch(users.results)
    } catch (err) {
      console.error('Error whhile trying to fetch users: ' + err)
    } finally {
      setFetching(false)
    }
  }
  const GetRequestPerRoom = ({ request }) => {
    const room = matrixClient.getRoom(request.room_id)
    // console.log(Object.values(room.currentState.members))
    const knockingUsers = Object.values(room?.currentState.members).filter(user => user.membership === 'knock')
    // @TODO delete users from array after accepting/rejecting

    if (knockingUsers.length < 1) return null

    return knockingUsers.map((user, index) => {
      return (
        <React.Fragment key={request.name + index}>
          <h3>{request.name}</h3>
          <Requests roomId={request.room_id} roomName={request.name} userId={user.userId} userName={user.name} matrixClient={matrixClient} key={index} />
        </React.Fragment>
      )
    })
  }

  const addModerationRooms = (newContext, name, template) => {
    const subContextObject = {
      id: newContext,
      room_id: newContext,
      name: name,
      template: template,
      type: 'context'
    }

    // const parentObject = findValueDeep(
    //   inputItems,
    //   (value, key, parent) => {
    //     if (value.id === selectedContext) return true
    //   }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
    setModerationRooms(prevState => Object.assign(prevState, {
      [newContext]: subContextObject
    }))
  }

  const removeModerationRoom = (selectedContext) => {
    const _moderationRooms = { ...moderationRooms }
    delete _moderationRooms[selectedContext]
    setModerationRooms(_moderationRooms)
  }

  const renderSelection = () => {
    // eslint-disable-next-line default-case
    switch (selection) {
      case 'invite':
        return config.medienhaus?.sites?.moderate?.invite && <> <InviteUserToSpace matrixClient={matrixClient} moderationRooms={moderationRooms} setPower={setPower} fetchUsers={fetchUsers} fetching={fetching} userSearch={userSearch} /></>
      case 'rightsManagement':
        return config.medienhaus?.sites?.moderate?.rightsManagement && <> <RightsManagement matrixClient={matrixClient} moderationRooms={moderationRooms} setPower={setPower} fetchUsers={fetchUsers} fetching={fetching} userSearch={userSearch} /></>
      case 'manageContexts':
        return config.medienhaus?.sites?.moderate?.manageContexts && <><ManageContexts matrixClient={matrixClient} moderationRooms={moderationRooms} addModerationRooms={addModerationRooms} removeModerationRoom={removeModerationRoom} /></>
      case 'removeContent':
        return config.medienhaus?.sites?.moderate?.removeContent && <><RemoveContent matrixClient={matrixClient} moderationRooms={moderationRooms} loading={fetching} /></>
      case 'accept':
        return (
          config.medienhaus?.sites?.moderate?.accept &&
            <>
              <section className="accept">
                <h2>{t('Accept user requests')}</h2>
                {Object.keys(moderationRooms).length > 0
                  ? <>
                    <section className="requests">
                      {Object.keys(moderationRooms).map((request, index) => <React.Fragment key={request.name}>
                        <GetRequestPerRoom request={moderationRooms[request]} key={index} />
                      </React.Fragment>)}
                    </section>
                  </>
                  : (
                    <div>
                      {t('Looks like you are not moderating any spaces.')}
                    </div>)}
              </section>
            </>
        )
    }
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete() || loading) return <Loading />
  if (spacesErr) return <p>{spacesErr}</p>
  return (
    <>
      {moderationRooms && Object.keys(moderationRooms).length < 1 && <p>{t('You are not moderating any spaces.')}</p>}

      {Object.keys(invites).length > 0 && (
        <>
          <section className="invites">
            <h3>{t('Invites')}</h3>
            {/* }
            <p>
              <Trans t={t} i18nKey="pendingInvites" count={Object.keys(invites).length}>
                You have been invited to join the following project{Object.keys(invites).length > 1 ? 's' : ''}/context{Object.keys(invites).length > 1 ? 's' : ''}. When you accept an invitation for a project, it will be listed below with your others. You can edit collaborative projects, delete them, or change their visibility.
              </Trans>
            </p>
      */}
            <ul>
              {Object.values(invites).map((space, index) => {
                return (
                  <React.Fragment key={space.name + index}>
                    <li key={index}>
                      <Invites space={space} callback={removeInviteByIndex} />
                    </li>
                    {index < Object.values(invites).length - 1 && <hr />}
                  </React.Fragment>
                )
              })}

            </ul>
          </section>
          <hr />
        </>
      )}

      {moderationRooms && Object.keys(moderationRooms).length > 0 && <>
        <section className="request">
          {Object.keys(config?.medienhaus?.sites?.moderate).map((value, index) => {
            return <TextNavigation width="auto" disabled={value === selection} active={value === selection} value={value} key={value} onClick={(e) => setSelection(e.target.value)}>{value.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</TextNavigation>
          })}
        </section>

        {renderSelection()}
      </>}
    </>
  )
}

export default Moderate
