import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Collaborators from './Collaborators'
import Category from './Category'
import DisplayContent from './DisplayContent'
import AddContent from './AddContent'
import ProjectImage from './ProjectImage'
import { Loading } from '../../components/loading'

const Submit = () => {
  const { joinedSpaces, spacesErr, fetchSpaces, reload } = useJoinedSpaces(() => console.log(fetchSpaces || spacesErr))
  const [title, setTitle] = useState('')
  const [projectImage, setProjectImage] = useState(false)
  const [visibility, setVisibility] = useState('draft')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [update, setUpdate] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const params = useParams()
  const history = useHistory()

  const projectSpace = params.spaceId

  const getSync = async () => {
    try {
      await matrixClient.startClient()
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getSync()
    // eslint-disable-next-line
  }, [])

  const reloadProjects = (msg) => {
    reload()
    setUpdate(true)
    console.log(msg)
  }

  useEffect(() => {
    const fetchSpace = async () => {
      const space = await matrixClient.getSpaceSummary(projectSpace)
      setTitle(space.rooms[0].name)
      space.rooms[0].avatar_url !== undefined && setProjectImage(space.rooms[0].avatar_url)
      console.log(space.rooms)
      const spaceRooms = space.rooms.filter(x => !('room_type' in x))
      setBlocks(spaceRooms.filter(x => x !== undefined).sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      }))
      setUpdate(false)
    }
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [update, projectSpace]);

  const listeningToCollaborators = async () => {
    console.log('Started spying on collaborators')
    await matrixClient.removeAllListeners()
    const myRooms = await matrixClient.getSpaceSummary(projectSpace)
    setTitle(myRooms?.rooms[0].name)
    console.log(myRooms)

    matrixClient.addListener('RoomState.events', function (event) {
      if (event.event.type === 'm.room.member' && myRooms.rooms?.filter(({ roomId }) => event.sender.roomId.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        setUpdate(true)
      } else if (event.event.type === 'm.room.name' && blocks?.filter(({ roomId }) => event.sender.roomId.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        setUpdate(true)
      } else if (event.event.state_key === projectSpace) {
        setUpdate(true)
      }
    })
    matrixClient.on('Room.timeline', function (event, room, toStartOfTimeline) {
      if (event.event.type === 'm.room.message' && blocks?.filter(({ roomId }) => event.event.room_id.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        setUpdate(true)
      }
    })
  }

  const changeProjectImage = (url) => {
    setLoading(true)
    setProjectImage(url)
    setLoading(false)
  }

  //= ====== COMPONENTS ======================================================================

  const SubmitButton = () => {
    const [response, setResponse] = useState()
    const [saving, setSaving] = useState(false)

    const onPublish = async (e) => {
      e.preventDefault()
      setSaving(true)
      const req = {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({ join_rule: visibility === 'public' ? 'public' : 'invite' })
      }
      try {
        // matrixClient.sendEvent(projectSpace, "m.room.join_rules", {"join_rule": visibility === "public" ? 'public' : 'invite'} ).then((res) => console.log(res))
        fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.join_rules/`, req)
          .then(response => {
            console.log(response)
            if (response.ok) {
              setResponse('Changed successfully!')
              setTimeout(() => {
                setResponse()
              }, 3000)
            } else {
              setResponse('Oh no, something went wrong.')
              setTimeout(() => {
                setResponse()
              }, 3000)
            }
          })
      } catch (err) {
        console.error(err)
      } finally {
        setSaving(false)
      }
    }

    return (
      <div>
        <div>
          <select id="visibility" name="visibility" value={visibility} onBlur={(e) => { setVisibility(e.target.value) }}>
            <option value="invite">Draft</option>
            <option value="public">Published</option>
          </select>
        </div>
        <div>
          <input id="submit" name="submit" type="submit" value="SAVE" disabled={saving} onClick={(e) => onPublish(e)} />
          {response && <p>{response}</p>}
        </div>
      </div>

    )
  }

  const ProjectTitle = () => {
    const [projectTitle, setProjectTitle] = useState('')
    const [edit, setEdit] = useState(false)
    const [changing, setChanging] = useState(false)
    const [newProject, setNewProject] = useState(false)
    const [oldTitle, setOldTitle] = useState('')
    const doublicate = joinedSpaces?.filter(({ name }) => projectTitle === name).length > 0

    useEffect(() => {
      setProjectTitle(title)
      title === '' && setNewProject(true)
      // eslint-disable-next-line
    }, [title]);

    const createProject = async (e, title) => {
      e.preventDefault()
      setLoading(true)
      const opts = {
        preset: visibility === 'public' ? 'public_chat' : 'private_chat',
        name: title,
        creation_content: { type: 'm.space' },
        initial_state: [{
          type: 'm.room.history_visibility',
          content: { history_visibility: visibility === 'public' ? 'world_readable' : 'invited' }
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
        power_level_content_override: { events_default: 100 },
        visibility: 'private'
      }
      try {
        await matrixClient.createRoom(opts)
          .then((response) => {
            history.push(`/submit/${response.room_id}`)
          })
      } catch (e) {
        console.log(e)
      } finally {
        setLoading(false)
      }
    }

    return (
      <>
        <div>
          <label htmlFor="title">Project Title</label>
          <input id="title" name="title" placeholder="project title" type="text" value={projectTitle} disabled={title && !edit} onChange={(e) => setProjectTitle(e.target.value)} />
        </div>
        <div>

          {title && <input
            id="submit" name="submit" type="submit" value={edit ? 'Save' : changing ? <Loading /> : 'Edit Title'} onClick={async (e) => {
              e.preventDefault()
              if (edit) {
                setChanging(true)
                try {
                  await matrixClient.setRoomName(projectSpace, projectTitle).then(() => setTitle(projectTitle))
                } catch (err) {
                  console.error(err)
                } finally {
                  setChanging(false)
                }
                setEdit(false)
              } else {
                setEdit(true)
                setOldTitle(title)
              }
            }}
          />}
          {edit && <input id="submit" name="submit" type="submit" value="Cancel" onClick={(e) => { e.preventDefault(); setEdit(false); setProjectTitle(oldTitle) }} />}
          {loading
            ? <Loading />
            : !title && <input
              id="submit" name="submit" type="submit" value={newProject ? 'Create Project' : 'New Project'} disabled={(newProject && doublicate) || !projectTitle} onClick={(e) => {
                console.log(newProject)
                if (newProject) {
                  createProject(e, projectTitle)
                  setNewProject(false)
                } else {
                  e.preventDefault()
                  setNewProject(true)
                  setTitle('')
                }
              }}
            />}
        </div>
      </>
    )
  }

  const startListeningToCollab = () => {
    listeningToCollaborators()
  }

  return (
    <div>

      <h3>Category / Context / Course</h3>
      <Category />
      <h3>Project Title / Collaborators / Credits</h3>
      <ProjectTitle />
      {projectSpace && (
        <>
          <Collaborators projectSpace={projectSpace} blocks={blocks} title={title} joinedSpaces={joinedSpaces} startListeningToCollab={startListeningToCollab} />
          <h3>Project Image</h3>
          {loading ? <Loading /> : <ProjectImage projectSpace={projectSpace} projectImage={projectImage} changeProjectImage={changeProjectImage} />}
          <h3>Content</h3>
          {blocks.length === 0
            ? <AddContent number={0} projectSpace={projectSpace} blocks={blocks} reloadProjects={reloadProjects} />
            : blocks.map((content, i) =>
              <DisplayContent block={content} index={i} blocks={blocks} projectSpace={projectSpace} reloadProjects={reloadProjects} key={content + i} />
            )}
          <h3>Visibility (Draft/Published)</h3>
          {loading ? <Loading /> : <SubmitButton />}
        </>
      )}
    </div>
  )
}

export default Submit
