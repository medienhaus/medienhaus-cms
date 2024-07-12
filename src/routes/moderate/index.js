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
import findValueDeep from 'deepdash/findValueDeep'
import { fetchId } from '../../helpers/MedienhausApiHelper'

import styled from 'styled-components'
import { createMatrixStructureObject } from '../../helpers/createMatrixStructureObject'

const TabSection = styled.section`
  display: grid;
  grid-gap: var(--margin);
  grid-template-columns: repeat(auto-fit, minmax(12ch, 1fr));

  & > * + * {
    margin-top: unset;
  }
`

const Moderate = () => {
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(false)
  const [moderationRooms, setModerationRooms] = useState()
  const [nestedRooms, setNestedRooms] = useState()
  const [userSearch, setUserSearch] = useState([])
  const [selection, setSelection] = useState('manageContexts')
  const [fetching, setFetching] = useState(false)
  const [invites, setInvites] = useState({})
  const [loading, setLoading] = useState(false)
  const context = config.medienhaus?.context ? Object.keys(config.medienhaus?.context).concat('context') : ['context']
  const matrixClient = Matrix.getMatrixClient()

  const { t } = useTranslation('moderate')

  useEffect(() => {
    const controller = new AbortController()

    const handleModerationRooms = async () => {
      setLoading(true)
      let rooms = {}
      let tree = {}

      // with no api we have to create the structure ourselves
      if (!config.medienhaus.api) tree = await createMatrixStructureObject(localStorage.getItem(process.env.REACT_APP_APP_NAME + '_root_context_space'))
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
          const contextObject = findValueDeep(
            tree[0],
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
            authors: space.authors,
            topic: space.topic
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
  }, [joinedSpaces, matrixClient])

  useEffect(() => {
    let cancelled = false

    if (!cancelled && moderationRooms) {
      const mod = { ...moderationRooms }
      function findFor (parentId) {
        try {
          // create a new object to store the result
          const nested = {}

          // for each item in a
          for (const room of Object.keys(moderationRooms)) {
            // find all children of parentId
            if (moderationRooms[room].parents?.includes(parentId)) {
              // recursively find children for each child of parentId
              const recursive = findFor(moderationRooms[room].room_id)
              // if it has no children, skip adding the children prop
              const object = Object.keys(recursive).length === 0 ? {} : { children: recursive }
              nested[moderationRooms[room].room_id] = Object.assign(object, moderationRooms[room])
            }
          }
          return nested
        } catch (error) {
          console.log('Error in findFor function:', error)
          if (error instanceof RangeError && error.message.includes('Maximum call stack size exceeded')) {
            console.log('Too much recursion:', error.stack)
            console.log('Params at error:', parentId)
          } else console.error('Error in findFor function:', error)
        }
      }
      for (const room of Object.keys(moderationRooms)) {
        // we iterate over all room ids
        const nested = findFor(room)
        if (Object.keys(nested).length !== 0) {
          // if we found parents fot the room we want to remove them from the first level
          for (const child of Object.keys(nested)) {
            mod[child] && delete mod[child]
          }
        }
        // in order not to create douplicates we continue if the parent is not in level 0 anymore
        if (!mod[room]) continue
        // then we add the nested object
        const children = { children: nested }
        mod[room] = Object.assign(children, moderationRooms[room])
      }
      setNestedRooms(mod)
    }

    return () => {
      cancelled = true
    }
  }, [moderationRooms])

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

  const addModerationRooms = (newContext, name, template, parent) => {
    const subContextObject = {
      id: newContext,
      room_id: newContext,
      name: name,
      template: template,
      type: 'context',
      parents: [parent]
    }

    // const parentObject = findValueDeep(
    //   inputItems,
    //   (value, key, parent) => {
    //     if (value.id === selectedContext) return true
    //   }, { childrenPath: 'children', includeRoot: false, rootIsChildren: true })
    setModerationRooms(prevState => Object.assign({ ...prevState }, {
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
        return config.medienhaus?.sites?.moderate?.invite && <> <InviteUserToSpace matrixClient={matrixClient} nestedRooms={nestedRooms} setPower={setPower} fetchUsers={fetchUsers} fetching={fetching} userSearch={userSearch} /></>
      case 'rightsManagement':
        return config.medienhaus?.sites?.moderate?.rightsManagement && <> <RightsManagement matrixClient={matrixClient} nestedRooms={nestedRooms} setPower={setPower} fetchUsers={fetchUsers} fetching={fetching} userSearch={userSearch} /></>
      case 'manageContexts':
        return config.medienhaus?.sites?.moderate?.manageContexts && <><ManageContexts matrixClient={matrixClient} moderationRooms={moderationRooms} nestedRooms={nestedRooms} addModerationRooms={addModerationRooms} removeModerationRoom={removeModerationRoom} /></>
      case 'removeContent':
        return config.medienhaus?.sites?.moderate?.removeContent && <><RemoveContent matrixClient={matrixClient} moderationRooms={moderationRooms} loading={fetching} /></>
      case 'accept':
        return (
          config.medienhaus?.sites?.moderate?.accept &&
            <>
              <section className="accept">
                <h2>{t('Manage requests')}</h2>
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
                      {t('Looks like you are not moderating any contexts.')}
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
      {moderationRooms && Object.keys(moderationRooms).length < 1 && <p>{t('You are not moderating any contexts.')}</p>}

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
        <TabSection>
          {Object.keys(config?.medienhaus?.sites?.moderate).map((value) => {
            return <TextNavigation width="auto" disabled={value === selection} active={value === selection} value={value} key={value} onClick={(e) => setSelection(e.target.value)}>{value.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</TextNavigation>
          })}
        </TabSection>

        {renderSelection()}
      </>}
    </>
  )
}

export default Moderate
