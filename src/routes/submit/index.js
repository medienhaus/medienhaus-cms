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
import PublishProject from '../../components/PublishProject'
import { Loading } from '../../components/loading'
import { MatrixEvent } from 'matrix-js-sdk'

const Submit = () => {
  const { joinedSpaces, spacesErr, fetchSpaces } = useJoinedSpaces(() => console.log(fetchSpaces || spacesErr))
  const [title, setTitle] = useState('')
  const [projectImage, setProjectImage] = useState(false)
  const [visibility, setVisibility] = useState('')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [isCollab, setIsCollab] = useState(false)
  const [contentLang, setContentLang] = useState('en')
  const [spaceObject, setSpaceObject] = useState()
  const matrixClient = Matrix.getMatrixClient()
  const params = useParams()

  const projectSpace = params.spaceId

  const reloadSpace = async (roomId) => {
    // roomId is needed in order to invite collaborators to newly created rooms.
    console.log('roomId = ' + roomId)
    // checking to see if the project is a collaboration, if so invite all collaborators and make them admin
    isCollab && roomId && inviteCollaborators(roomId)
    await fetchSpace()
  }

  const inviteCollaborators = async (roomId) => {
    const allCollaborators = joinedSpaces?.map((space, i) => space.name === title && Object.keys(space.collab).filter(userId => userId !== localStorage.getItem('mx_user_id') && userId !== process.env.REACT_APP_PROJECT_BOT_ACCOUNT)).filter(space => space !== false)[0]
    // I would be surprised if there isn't an easier way to get joined members...
    const setPower = async (userId) => {
      console.log('changing power level for ' + userId)
      matrixClient.getStateEvent(roomId, 'm.room.power_levels', '').then(async (res) => {
        const powerEvent = new MatrixEvent({
          type: 'm.room.power_levels',
          content: res
        }
        )
        try {
          // something here is going wrong
          await matrixClient.setPowerLevel(roomId, userId, 100, powerEvent)
        } catch (err) {
          console.error(err)
        }
      })
    }
    // invite users to newly created content room
    const invites = allCollaborators.map(userId => matrixClient.invite(roomId, userId, () => console.log('invited ' + userId)).catch(err => console.log(err)))
    await Promise.all(invites)
    console.log('inviting done, now changing power')
    // then promote them to moderator
    const power = allCollaborators.map(userId => setPower(userId))
    await Promise.all(power)
    console.log('all done')
  }

  const fetchSpace = async () => {
    const space = await matrixClient.getSpaceSummary(projectSpace)
    setTitle(space.rooms[0].name)
    setSpaceObject(space.rooms[0])
    space.rooms[0].avatar_url !== undefined && setProjectImage(space.rooms[0].avatar_url)
    const spaceRooms = space.rooms.filter(x => !('room_type' in x))
    setBlocks(spaceRooms.filter(x => x !== undefined).sort((a, b) => {
      return a.name.charAt(0) - b.name.charAt(0)
    }))
    console.log(blocks)
  }

  useEffect(() => {
    setVisibility(joinedSpaces?.filter(x => x.room_id === projectSpace)[0]?.published)
    // eslint-disable-next-line
  }, [joinedSpaces]);

  useEffect(() => {
    projectSpace || setTitle('') // shoukd fix the error when already editing a project and wanting to create a new one
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [projectSpace])

  const listeningToCollaborators = async () => {
    console.log('Started spying on collaborators')
    setIsCollab(true)
    try {
      // joining contentRooms which might have been created since we last opened the project
      await matrixClient.getSpaceSummary(projectSpace).then(res => {
        res.rooms.map(async contentRooms => contentRooms.room_id !== projectSpace && await matrixClient.joinRoom(contentRooms.room_id))
      })
    } catch (err) {
      console.error(err)
    }

    await matrixClient.removeAllListeners().setMaxListeners(999)
    const myRooms = await matrixClient.getSpaceSummary(projectSpace)
    setTitle(myRooms?.rooms[0].name)
    matrixClient.addListener('RoomState.events', function (event) {
      if (event.event.type === 'm.room.member' && myRooms.rooms?.filter(({ roomId }) => event.sender.roomId.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        fetchSpace()
      } else if (event.event.type === 'm.room.name' && blocks?.filter(({ roomId }) => event.sender.roomId.includes(roomId))) {
        fetchSpace()
      } else if (event.event.type === 'm.space.child' && event.event.room_id === projectSpace && event.event.sender !== localStorage.getItem('mx_user_id')) {
        console.log(event.event)
        fetchSpace()
        matrixClient.joinRoom(event.event.state_key)
      } else if (event.event.state_key === projectSpace) {
        fetchSpace()
      }
    })
    matrixClient.on('Room.timeline', function (event, room, toStartOfTimeline) {
      if (event.event.type === 'm.room.message' && blocks?.filter(({ roomId }) => event.event.room_id.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        console.log(event)
        fetchSpace()
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
    <>
      <section className="welcome">
        <p><strong>Welcome to your project!</strong></p>
        <p>This is the project page. Please add in which context the project happend, projectname and descriptive text and images. If you want to continue at a later point in time, you can save the project as a draft and find it in your collection under “drafts”.</p>
      </section>
      <section className="project-title">
        <h3>Project Title</h3>
        <ProjectTitle joinedSpaces={joinedSpaces} title={title} projectSpace={projectSpace} callback={changeTitle} />
      </section>
      {projectSpace && (
      <>
        <section className="context">
          <h3>Context</h3>
          <Category title={title} projectSpace={projectSpace} />
        </section>
        <section className="contributors">
          <Collaborators projectSpace={projectSpace} blocks={blocks} title={title} joinedSpaces={joinedSpaces} startListeningToCollab={startListeningToCollab} />
        </section>
        <section className="project-image">
          <h3>Project Image</h3>
          {loading ? <Loading /> : <ProjectImage projectSpace={projectSpace} projectImage={projectImage} changeProjectImage={changeProjectImage} />}
        </section>
        <section className="content">
          <h3>Content</h3>
          <p>You can add elements like text, video and pictures to the main body of your project by using the “+” on the right side.
            One block of text is mandatory to describe your project.
            When using the text block you can format text by highlighting it.
            You can use the arrows on the left to rearrange exsisting blocks.
            You can provide information in multiple languages by choosing in the dropdown below.</p>
          <select id="subject" name="subject" defaultValue={''} value={contentLang} onChange={(e) => setContentLang(e.target.value)}>
            <option value="de">DE - German</option>
            <option value="en" >EN -English</option>
          </select>
          {blocks.length === 0
            ? <AddContent number={0} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} />
            : blocks.map((content, i) =>
              <DisplayContent block={content} index={i} blocks={blocks} projectSpace={projectSpace} reloadSpace={reloadSpace} key={content + i} />
            )}
          </section>
          <section className="visibility">
            <h3>Visibility (Draft/Published)</h3>
            <p>Select if you want to save the information provided by you as a draft or if you are happy with it select to publish the project. You can change this at any time.</p>
            <PublishProject space={spaceObject} published={visibility} />
          </section>
        </>
      )}
    </>
  )
}

export default Submit
