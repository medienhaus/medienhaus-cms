import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Auth'
import { useHistory } from 'react-router-dom'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Projects from './Projects'
import Invites from './Invites'
import Matrix from '../../Matrix'
import { Loading } from '../../components/loading'
import { Trans, useTranslation } from 'react-i18next'
import { sortBy } from 'lodash'
import deleteProject from './deleteProject'

const Overview = () => {
  const auth = useAuth()
  const { t } = useTranslation('projects')
  const profile = auth.user
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(false)
  const matrixClient = Matrix.getMatrixClient()
  const [projects, setProjects] = useState([])
  const [invites, setInvites] = useState()
  const history = useHistory()
  // @TODO: Check for existing invites on page load

  // Listen for room events to populate our "pending invites" state
  useEffect(() => {
    // when navigating away from /projects we need the following code to retreive our pending invites for memoryStore
    const allRooms = matrixClient.getRooms()
    allRooms.forEach(room => {
      // ignore rooms that aren't spaces (or are language spaces) and only return invites
      if (room.getType() !== 'm.space' || room.name === 'de' || room.name === 'en') return
      if (room.getMyMembership() !== 'invite') return
      setInvites(invites => Object.assign({}, invites, {
        [room.roomId]:
          {
            name: room.name,
            id: room.roomId,
            membership: room._selfMembership
          }
      }))
    })

    async function handleRoomEvent (room) {
      console.log('in function handleevents')
      // Ignore event if this is not about a space or if it is a language space
      if (room.getType() !== 'm.space' || room.name === 'de' || room.name === 'en') return

      const roomMembers = await room._loadMembersFromServer().catch(console.error)
      // room.getMyMembership() is only available after the current call stack has cleared (_.defer),
      // so we put it behind the "await"
      if (room.getMyMembership() !== 'invite' || roomMembers.length < 1) {
        return
      }

      setInvites(invites => Object.assign({}, invites, {
        [room.roomId]:
          {
            name: room.name,
            id: room.roomId,
            membership: room._selfMembership
          }
      }))
    }
    matrixClient.on('Room', handleRoomEvent)

    // When navigating away from /profile we want to stop listening for those room events again
    return () => {
      matrixClient.removeListener('Room', handleRoomEvent)
      console.log('stopped listening')
    }
  }, [matrixClient])

  const removeProject = (index) => {
    setProjects(projects.filter((name, i) => i !== index))
  }

  useEffect(() => {
    // we check if a collaborator has deleted a project since we last logged in
    joinedSpaces.length > 0 && joinedSpaces?.filter(space => space.meta?.deleted).forEach(async space => await deleteProject(space.room_id))
    const updatedSpaces = joinedSpaces.length > 0 && joinedSpaces?.filter(space => !space.meta?.deleted)
    setProjects(sortBy(updatedSpaces, 'name'))
  }, [joinedSpaces])

  const removeInviteByIndex = (room) => {
    // setInvites(invites => invites.filter((invite, i) => i !== index))
    setInvites(Object.fromEntries(
      Object.entries(invites).filter(([key]) => key !== room)))
    reload(true)
  }

  return (
    <div>
      <p>{t('Hello')} <strong>{profile.displayname}</strong>.</p>

      {!invites || fetchSpaces
        ? <Loading />
        : <>
          {Object.keys(invites).length > 0 && (
            <section className="invites">
              {/* TODO: needs i18n */}
              <h3>Invites</h3>
              <p>
                <Trans t={t} i18nKey="pendingInvites" count={Object.keys(invites).length}>
                  You have been invited to join the following project{Object.keys(invites).length > 1 ? 's' : ''}:
                </Trans>
              </p>
              <ul>
                {Object.values(invites).map((space, index) => (
                  <li key={index}>
                    <Invites space={space} callback={removeInviteByIndex} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <h3>Projects</h3>
          <div>
            <button onClick={() => history.push('/submit')}>{t('create new project')} →</button>
          </div>

          <section>
            {spacesErr
              ? console.error(spacesErr)
              : projects?.length === 0
                ? (
                  <p>{t('Welcome to the content management system for Rundgang 2021. Looks like you haven\'t uploaded any projects, yet.')}</p>
                  )
                : projects.map((space, index) => (
                  <React.Fragment key={index}>
                    <Projects space={space} visibility={space.published} index={index} removeProject={removeProject} />
                    <hr />
                  </React.Fragment>
                ))}
          </section>
          {/* eslint-disable-next-line react/jsx-indent */}
          </>}
    </div>
  )
}

export default Overview
