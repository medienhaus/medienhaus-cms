import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const ProjectTitle = ({ title, projectSpace, callback }) => {
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
      return {
        preset: 'private_chat',
        name: name,
        room_version: '7',
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: history } //  world_readable
        },
        {
          type: 'dev.medienhaus.meta',
          content: {
            version: '0.3',
            rundgang: 21,
            type: type,
            published: 'draft'
          }
        },
        {
          type: 'm.room.guest_access',
          state_key: '',
          content: { guest_access: 'can_join' }
        }],
        visibility: 'private'
      }
    }
    try {
      // create the project space for the student project
      await matrixClient.createRoom(opts('content', title, 'world_readable'))
        .then(async (space) => {
          // by default we create two subpsaces for localisation and one for events
          const en = await matrixClient.createRoom(opts('lang', 'en', 'shared'))
          const de = await matrixClient.createRoom(opts('lang', 'de', 'shared'))
          // const events = await matrixClient.createRoom(opts('events', 'events', 'shared'))
          return [space.room_id, en.room_id, de.room_id]
        })
        .then(async (res) => {
          // and add those subspaces as children to the project space
          // en
          await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${res[0]}/state/m.space.child/${res[1]}`, {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
              via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')],
              suggested: false,
              auto_join: false
            })
          })
          // de
          await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${res[0]}/state/m.space.child/${res[2]}`, {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
              via: [process.env.REACT_APP_MATRIX_BASE_URL.replace('https://', '')],
              suggested: false,
              auto_join: false
            })
          })

          return res[0]
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
              disabled={!projectTitle || projectTitle.length > 100} onClick={(e) => {
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
