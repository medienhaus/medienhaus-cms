import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const ProjectTitle = ({ title, projectSpace, callback }) => {
  const { t } = useTranslation('projects')
  const [projectTitle, setProjectTitle] = useState('')
  const [edit, setEdit] = useState(false)
  const [newProject, setNewProject] = useState(false)
  const [oldTitle, setOldTitle] = useState('')
  const [type, setType] = useState('content')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const history = useHistory()

  useEffect(() => {
    setProjectTitle(title)
    title === '' ? setNewProject(true) : setNewProject(false)
    // eslint-disable-next-line
    }, [title]);

  const createProject = async (title) => {
    setLoading(true)

    const opts = (type, name) => {
      return {
        preset: 'private_chat',
        name: name,
        room_version: '7',
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: 'world_readable' }
        },
        {
          type: 'dev.medienhaus.meta',
          content: {
            version: '0.1',
            rundgang: 21,
            type: type,
            present: 'analog'
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
      await matrixClient.createRoom(opts(type, title))
        .then(async (space) => {
          // by default we create two subpsaces for localisation
          const en = await matrixClient.createRoom(opts('lang', 'en'))
          const de = await matrixClient.createRoom(opts('lang', 'de'))
          return [space.room_id, en.room_id, de.room_id]
        })
        .then(async (res) => {
          // and add those subspaces as children to the project space
          await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${res[0]}/state/m.space.child/${res[1]}`, {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
              via:
                [process.env.REACT_APP_MATRIX_BASE_URL],
              suggested: false,
              auto_join: true
            })
          })
          await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${res[0]}/state/m.space.child/${res[2]}`, {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
              via:
                [process.env.REACT_APP_MATRIX_BASE_URL],
              suggested: false,
              auto_join: true
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
      {!title &&
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="studenproject">{t('Content')}</option>
          <option value="page">{t('Page')}</option>
        </select>}
      <div className="maxlength">
        <input id="title" maxLength="100" name="title" type="text" value={projectTitle} onClick={() => { setEdit(true); setOldTitle(title) }} onChange={(e) => setProjectTitle(e.target.value)} />
        <span>{projectTitle.length + '/100'}</span>
      </div>
      {/*
      <p>❗️ Please provide just the project title without any year or artist name.</p>
      */}{loading
      ? <Loading />
      : edit && (projectTitle !== oldTitle) &&
        <div className="confirmation">
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
            >{newProject && t('Create')}
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
