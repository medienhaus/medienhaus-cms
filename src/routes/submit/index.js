import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Collaborators from './Collaborators'
import Category from './Category'
import DisplayContent from './DisplayContent'
import AddContent from './AddContent'
import ProjectImage from './ProjectImage'
import ProjectTitle from './ProjectTitle'
import PublishProject from './ProjectTitle/PublishProject'
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
    joinedSpaces && setVisibility(joinedSpaces.filter(x => x.room_id === projectSpace)[0].published)
    // eslint-disable-next-line
  }, [joinedSpaces]);

  useEffect(() => {
    projectSpace || setTitle('') // shoukd fix the error when already editing a project and wanting to create a new one
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

  const startListeningToCollab = () => {
    listeningToCollaborators()
  }

  const changeTitle = (newTitle) => {
    setTitle(newTitle)
  }

  return (
    <div>

      <h3>Project Title / Collaborators / Credits</h3>
      <ProjectTitle joinedSpaces={joinedSpaces} title={title} projectSpace={projectSpace} callback={changeTitle} />
      {projectSpace && (
        <>
          <h3>Category / Context / Course</h3>
          <Category title={title} projectSpace={projectSpace} />
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
          <PublishProject projectSpace={projectSpace} published={visibility} />
        </>
      )}
    </div>
  )
}

export default Submit
