import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Projects from './Projects'
import Invites from '../../components/Invites'
import Matrix from '../../Matrix'
import { Loading } from '../../components/loading'
import { Trans, useTranslation } from 'react-i18next'
import { sortBy } from 'lodash'
import deleteProject from './deleteProject'

import config from '../../config.json'
import * as _ from 'lodash'

const Overview = () => {
  const { t } = useTranslation('content')
  const matrixClient = Matrix.getMatrixClient()
  const [projects, setProjects] = useState({})
  const [invites, setInvites] = useState({})
  const item = config.medienhaus?.item ? Object.keys(config.medienhaus?.item).concat('item') : ['item']
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(false)

  useEffect(() => {
    async function checkRoomForPossibleInvite (room) {
      // Ignore if this is not a space
      if (room.getType() !== 'm.space') return
      // Ignore if this is not an "item"
      const metaEvent = await matrixClient.getStateEvent(room.roomId, 'dev.medienhaus.meta').catch(() => {})
      // if no meta event is found, we don't want to display the room
      if (!metaEvent) return

      // see if the previous membership state of the room was 'knock' and if so, we want to join the room
      const event = _.find(room.currentState.getMembers(), { userId: matrixClient.getUserId() }).events.member.event
      // get current membership
      const membership = event.content.membership
      if (membership === 'invite' && event.unsigned?.prev_content?.membership === 'knock') {
        await matrixClient.joinRoom(room.roomId).catch(error => {
          console.error(error)
          alert(t('The following error occurred: {{error}}', { error: error.data?.error }))
        })
        alert(t('You have been added to the following context: {{roomName}}', { roomName: room.name }))
      }

      if (!metaEvent.template || !item.includes(metaEvent.template)) return
      // Ignore if this is not an invitation
      if (membership !== 'invite') return
      // see if the previous membership state of the room was 'knock' and if so, we want to join the room
      // if we have legacy code with unjoined rooms, take care of those first.
      if (room.name.includes('_event')) {
        const eventSpace = await matrixClient.getRoomHierarchy(room.roomId).catch(console.log)
        eventSpace.rooms.forEach(async (space, index) => {
          console.log('joining ' + space.name)
          const subspaces = await matrixClient.getRoomHierarchy(space.room_id).catch(console.log)
          subspaces.rooms.forEach(async (space) => {
            await matrixClient.joinRoom(space.room_id).catch(console.log)
          })
          await matrixClient.joinRoom(space.room_id).catch(console.log)
        })
      }
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

  const removeProject = (index) => {
    setProjects(projects.filter((name, i) => i !== index))
  }

  useEffect(() => {
    let cancelled = false
    if (joinedSpaces && !cancelled) {
      // we check if a collaborator has deleted a project since we last logged in
      joinedSpaces?.filter(space => space.meta?.deleted).forEach(async space => await deleteProject(space.room_id))
      // then we update our array to not display the just deleted projects and only display joined rooms
      const updatedProjects = joinedSpaces?.filter(space => !space.meta?.deleted && item.includes(space.meta.type))
      setProjects(sortBy(updatedProjects, 'name'))
    }

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedSpaces])

  const removeInviteByIndex = (room) => {
    // setInvites(invites => invites.filter((invite, i) => i !== index))
    setInvites(Object.fromEntries(
      Object.entries(invites).filter(([key]) => key !== room)))
    reload(true)
  }

  if (fetchSpaces || !matrixClient.isInitialSyncComplete()) return <Loading />
  return (
    <div>
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
      <section className="projects">
        <h3>{t('Content')}</h3>
        {spacesErr
          ? console.error(spacesErr)
          : projects?.length === 0
            ? (
              <>
                <p>{t('Looks like you haven’t uploaded any content, yet.')}</p>
                <p>
                  <Trans t={t} i18nKey="hyperlinkToSlashCreate">
                    You can do so via the <NavLink to="/create">/create</NavLink> page.
                  </Trans>
                </p>
              </>
              )
            : projects.filter(space => space.meta.type !== 'context').map((space, index) => (
              <React.Fragment key={index}>
                <Projects space={space} metaEvent={space.meta} visibility={space.published} index={index} removeProject={removeProject} />
                {index < projects.length - 1 && <hr />}
              </React.Fragment>
            ))}
      </section>
    </div>
  )
}

export default Overview
