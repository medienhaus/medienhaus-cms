import React, { useEffect, useState } from 'react'
import { useAuth } from '../../Auth'
import { Link } from 'react-router-dom'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Projects from './Projects'
import Invites from './Invites'
import Matrix from '../../Matrix'
import { Loading } from '../../components/loading'
import { Trans, useTranslation } from 'react-i18next'
import { sortBy } from 'lodash'

const Overview = () => {
  const auth = useAuth()
  const { t } = useTranslation('projects')
  const profile = auth.user
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(() => console.log(fetchSpaces || spacesErr))
  const matrixClient = Matrix.getMatrixClient()
  const [projects, setProjects] = useState([])
  const [invites, setInvites] = useState({})
  // @TODO: Check for existing invites on page load

  // Listen for room events to populate our "pending invites" state
  useEffect(() => {
    async function handleRoomEvent (room) {
      // Ignore event if this is not about a space
      if (room.getType() !== 'm.space') return

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
    }
  })

  const removeProject = (index) => {
    setProjects(projects.filter((name, i) => i !== index))
  }

  useEffect(() => {
    setProjects(sortBy(joinedSpaces, 'name'))
  }, [joinedSpaces])

  const removeInviteByIndex = (room) => {
    // setInvites(invites => invites.filter((invite, i) => i !== index))
    setInvites(Object.fromEntries(
      Object.entries(invites).filter(([key]) => key !== room)))
  }

  return (
    <div>
      <p>{t('Hello')} <strong>{profile.displayname}</strong>.</p>
      {projects?.length === 0 && (
        <p>{t('Welcome to the content management system for Rundgang 2021. Looks like you haven\'t uploaded any projects, yet.')}</p>
      )}
      {!invites
        ? <Loading />
        : Object.keys(invites).length > 0 && (
        <>
          <p>
            <Trans t={t} i18nKey="pendingInvites" count={Object.keys(invites).length}>
              You have been invited to join the following project{Object.keys(invites).length > 1 ? 's' : ''}:
            </Trans>
          </p>
          <ul>
            {Object.values(invites).map((room, index) => (
              <li key={index} style={{ listStyleType: 'none' }}>
                <Invites room={room} callback={removeInviteByIndex} />
              </li>
            ))}
          </ul>
        </>
        )
      }
      <div>
        <Link activeclassname="active" to="/submit/">{t('create new project')} -&gt;</Link>
      </div>
      {fetchSpaces
        ? <Loading />
        : (
          <section>
            {spacesErr
              ? console.error(spacesErr)
              : projects.map((space, index) => (
              <React.Fragment key={index}>
                <Projects space={space} visibility={space.published} index={index} reloadProjects={removeProject} />
                <hr />
              </React.Fragment>
              ))}
          </section>
          )
      }
    </div>
  )
}

export default Overview
