import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const ProjectTitle = ({ title, projectSpace, callback }) => {
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
    // eslint-disable-next-line
    }, [title]);

  const createProject = async (e, title) => {
    e.preventDefault()
    setLoading(true)

    const opts = (type, name) => {
      return {
        preset: 'private_chat',
        name: name,
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: 'world_readable' }
        },
        {
          type: 'm.medienhaus.meta',
          content: {
            rundgang: 21,
            type: type,
            version: '0.1'
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
      await matrixClient.createRoom(opts('studentproject', title))
        .then(async (space) => {
          const en = await matrixClient.createRoom(opts('lang', 'en'))
          const de = await matrixClient.createRoom(opts('lang', 'de'))
          return [space.room_id, en.room_id, de.room_id]
        })
        .then(async (res) => {
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
        .then((res) => history.push(`/submit/${res}`))
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  return (
        <>
            <div className="maxlength">
                <input id="title" maxLength="100" name="title" placeholder="project title" type="text" value={projectTitle} onClick={() => { setEdit(true); setOldTitle(title) }} onChange={(e) => setProjectTitle(e.target.value)} />
                <span>{projectTitle.length + '/100'}</span>
            </div>
            {/*
      <p>❗️ Please provide just the project title without any year or artist name.</p>
      */}{loading
      ? <Loading />
      : edit && (projectTitle !== oldTitle) &&
              <div className="savecancel">
                {!newProject && <input id="submit" name="submit" type="submit" value="❌ CANCEL" onClick={(e) => { e.preventDefault(); setEdit(false); setProjectTitle(oldTitle) }} />}
                  {!title && newProject &&
                      <input
                          id="submit" name="submit" type="submit" value={newProject && 'Create Project'} disabled={ !projectTitle || projectTitle.length > 100} onClick={(e) => {
                            console.log(newProject)
                            if (newProject && projectTitle.length < 101) {
                              createProject(e, projectTitle)
                              setOldTitle(projectTitle)
                              setNewProject(false)
                            } else {
                              e.preventDefault()
                              setNewProject(true)
                            }
                          }}
                      />
                  }

                  {title && edit && (projectTitle !== oldTitle) && <LoadingSpinnerButton disabled={projectTitle.length > 100} onClick={async () => {
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
                  }}>✅ SAVE</LoadingSpinnerButton>}
              </div>
          }
        </>
  )
}
export default ProjectTitle
