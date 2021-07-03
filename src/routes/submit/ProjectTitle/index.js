
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import createBlock from '../matrix_create_room'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'

const ProjectTitle = ({ joinedSpaces, title, projectSpace, callback }) => {
  const [projectTitle, setProjectTitle] = useState('')
  const [edit, setEdit] = useState(false)
  const [newProject, setNewProject] = useState(false)
  const [oldTitle, setOldTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const doublicate = joinedSpaces?.filter(({ name }) => projectTitle === name).length > 0
  const history = useHistory()

  useEffect(() => {
    setProjectTitle(title)
    title === '' && setNewProject(true)
    // eslint-disable-next-line
    }, [title]);
  console.log('title = ' + title)
  console.log('oldTitle = ' + oldTitle)
  const createProject = async (e, title) => {
    e.preventDefault()
    setLoading(true)

    const opts = {
      preset: 'private_chat',
      name: title,
      creation_content: { type: 'm.space' },
      initial_state: [{
        type: 'm.room.history_visibility',
        content: { history_visibility: 'world_readable' }
      },
      {
        type: 'm.room.topic',
        content: { topic: JSON.stringify({ rundgang: 21, type: 'studentproject' }) }
      },
      {
        type: 'm.room.guest_access',
        state_key: '',
        content: { guest_access: 'can_join' }
      }],
      power_level_content_override: {
        ban: 50,
        events: {
          'm.room.name': 50,
          'm.room.power_levels': 50
        },
        events_default: 0,
        invite: 50,
        kick: 50,
        notifications: {
          room: 20
        },
        redact: 50,
        state_default: 50,
        users_default: 0

      },
      visibility: 'private'
    }
    try {
      await matrixClient.createRoom(opts)
        .then(async (response) => {
          await createBlock(undefined, 'introduction', 0, response.room_id)
          return response.room_id
        }).then((res) => history.push(`/submit/${res}`))
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  return (
        <>
            <div>
                <p>Please provide just the project title without any year or artist name.</p>
                <label htmlFor="title">Project Title</label>
                <input id="title" name="title" placeholder="project title" type="text" value={projectTitle} onClick={() => { setEdit(true); setOldTitle(title) }} onChange={(e) => setProjectTitle(e.target.value)} />
                <span>{projectTitle.length + '/100'}</span>
            </div>
            <div>
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
                }}>Save</LoadingSpinnerButton>}

                {edit && (projectTitle !== oldTitle) && <input id="submit" name="submit" type="submit" value="Cancel" onClick={(e) => { e.preventDefault(); setEdit(false); setProjectTitle(oldTitle) }} />}
                {loading
                  ? <Loading />
                  : !title && <input
                        id="submit" name="submit" type="submit" value={newProject ? 'Create Project' : 'New Project'} disabled={(newProject && doublicate) || !projectTitle || projectTitle.length > 100} onClick={(e) => {
                          console.log(newProject)
                          if (newProject && projectTitle.length < 101) {
                            createProject(e, projectTitle)
                            setNewProject(false)
                          } else {
                            e.preventDefault()
                            setNewProject(true)
                          }
                        }}
                    />}
            </div>
        </>
  )
}
export default ProjectTitle
