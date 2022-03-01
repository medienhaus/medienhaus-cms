import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

import config from '../../../config.json'

const ProjectTitle = ({ title, projectSpace, type, callback }) => {
  const { t } = useTranslation('content')
  const [projectTitle, setProjectTitle] = useState('')
  const [edit, setEdit] = useState(false)
  const [newProject, setNewProject] = useState(false)
  const [oldTitle, setOldTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const history = useHistory()

  useEffect(() => {
    setProjectTitle(title)
    title === '' ? setNewProject(true) : setNewProject(false)
  }, [title])

  const createProject = async (title) => {
    setLoading(true)

    const opts = (type, name, history) => {
      const users = {}
      for (const key in config.medienhaus.usersToInvite) {
        users[key] = 50
      }

      return {
        preset: 'private_chat',
        name: name,
        room_version: '9',
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: history }
        }, //  world_readable
        {
          type: 'dev.medienhaus.meta',
          content: {
            version: '0.3',
            container: 'content',
            type: type,
            published: 'draft'
          }
        },
        {
          type: 'm.room.guest_access',
          state_key: '',
          content: { guest_access: 'can_join' }
        }],
        power_level_content_override: {
          ban: 50,
          events: {
            'm.room.avatar': 50,
            'm.room.canonical_alias': 50,
            'm.room.encryption': 100,
            'm.room.history_visibility': 100,
            'm.room.name': 50,
            'm.room.power_levels': 100,
            'm.room.server_acl': 100,
            'm.room.tombstone': 100,
            'm.space.child': 50,
            'm.room.topic': 50,
            'm.room.pinned_events': 50,
            'm.reaction': 50,
            'im.vector.modular.widgets': 50
          },
          events_default: 50,
          historical: 100,
          invite: 50,
          kick: 50,
          redact: 50,
          state_default: 50,
          users_default: 50
        },
        visibility: 'private'
      }
    }
    try {
      // create the project space for the student project
      await matrixClient.createRoom(opts(type || 'content', title, 'world_readable'))
        .then(async (space) => {
          // by default we create subpsaces for localisation and one for events
          for await (const lang of config.medienhaus?.languages) {
            const languageRoom = await matrixClient.createRoom(opts('lang', lang, 'shared'))
            await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.room_id}/state/m.space.child/${languageRoom.room_id}`, {
              method: 'PUT',
              headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
              body: JSON.stringify({
                via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')],
                suggested: false,
                auto_join: false
              })
            })
          }
          // const events = await matrixClient.createRoom(opts('events', 'events', 'shared'))
          return space.room_id
        })
        .then((res) => history.push(`/create/${res}`))
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="maxlength">
        <input id="title" maxLength="100" name="title" type="text" value={projectTitle} onClick={() => { setEdit(true); setOldTitle(title) }} onChange={(e) => setProjectTitle(e.target.value)} />
        <span>{projectTitle.length + '/100'}</span>
      </div>
      {/*
      <p>❗️ Please provide just the project title without any year or artist name.</p>
      */}{loading
      ? <Loading />
      : edit && (projectTitle !== oldTitle) &&
        <div className={!newProject ? 'confirmation' : null}>
          {!newProject && <button className="cancel" onClick={(e) => { e.preventDefault(); setEdit(false); setProjectTitle(oldTitle) }}>CANCEL</button>}
          {!title && newProject &&
            <LoadingSpinnerButton
              disabled={!type || !projectTitle || projectTitle.length > 100} onClick={(e) => {
                console.log(newProject)
                if (newProject && projectTitle.length < 101) {
                  createProject(projectTitle)
                  setOldTitle(projectTitle)
                  setNewProject(false)
                } else {
                  e.preventDefault()
                  setNewProject(true)
                }
              }}
            >{newProject && t('Create project')}
            </LoadingSpinnerButton>}

          {title && edit && (projectTitle !== oldTitle) &&
            <LoadingSpinnerButton
              className="confirm" disabled={projectTitle.length > 100} onClick={async () => {
                if (projectTitle.length < 101) {
                  try {
                    await matrixClient.setRoomName(projectSpace, projectTitle).then(() => callback(projectTitle))
                  } catch (err) {
                    console.error(err)
                  }
                  setEdit(false)
                } else {
                  setEdit(true)
                  setOldTitle(title)
                }
              }}
            >{t('SAVE')}
            </LoadingSpinnerButton>}
        </div>}
    </>
  )
}
export default ProjectTitle
