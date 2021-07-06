import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Matrix from '../../Matrix'
import { MatrixEvent } from 'matrix-js-sdk'

// components
import Collaborators from './Collaborators'
import Category from './Category'
import DisplayContent from './DisplayContent'
import AddContent from './AddContent'
import ProjectImage from './ProjectImage'
import ProjectTitle from './ProjectTitle'
import PublishProject from '../../components/PublishProject'
import ProjectDescription from './ProjectDescription'
import { Loading } from '../../components/loading'

const Submit = () => {
  const [title, setTitle] = useState('')
  const [projectImage, setProjectImage] = useState(false)
  const [visibility, setVisibility] = useState('')
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [isCollab, setIsCollab] = useState(false)
  const [contentLang, setContentLang] = useState('en')
  const [spaceObject, setSpaceObject] = useState()
  const [roomMembers, setRoomMembers] = useState()
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
    const allCollaborators = Object.keys(roomMembers.joined).filter(userId => userId !== localStorage.getItem('mx_user_id'))
    // const allCollaborators = joinedSpaces?.map((space, i) => space.name === title && Object.keys(space.collab).filter(userId => userId !== localStorage.getItem('mx_user_id') && userId !== process.env.REACT_APP_PROJECT_BOT_ACCOUNT)).filter(space => space !== false)[0]
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
          // something here is going wrong for collab > 2
          await matrixClient.setPowerLevel(roomId, userId, 100, powerEvent)
        } catch (err) {
          console.error(err)
        }
      })
    }
    // invite users to newly created content room
    const invites = allCollaborators?.map(userId => matrixClient.invite(roomId, userId, () => console.log('invited ' + userId)).catch(err => console.log(err)))
    await Promise.all(invites)
    console.log('inviting done, now changing power')
    // then promote them to admin
    const power = allCollaborators.map(userId => setPower(userId))
    await Promise.all(power)
    console.log('all done')
  }

  const fetchSpace = useCallback(async () => {
    // here we collect all necessary information about the project space
    const space = await matrixClient.getSpaceSummary(projectSpace)
    setTitle(space.rooms[0].name)
    setSpaceObject(space)
    const getRoomMembers = await matrixClient.getJoinedRoomMembers(space?.rooms[0].room_id)
    setRoomMembers(getRoomMembers.joined)
    space.rooms[0].avatar_url !== undefined && setProjectImage(space.rooms[0].avatar_url)
    const joinRule = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${space.rooms[0].room_id}/state/m.room.join_rules/`, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') }
    })
    const published = await joinRule.json()
    setVisibility(published.join_rule)
    const spaceRooms = space.rooms.filter(x => !('room_type' in x))
    setBlocks(spaceRooms.filter(x => x !== undefined).filter(room => room.name.charAt(0) !== 'x').sort((a, b) => {
      return a.name.substring(0, a.name.indexOf('_')) - b.name.substring(0, b.name.indexOf('_'))
    }))
  }, [projectSpace, matrixClient])

  useEffect(() => {
    projectSpace || setTitle('')
    projectSpace && fetchSpace()
  }, [projectSpace, fetchSpace])

  useEffect(() => {
    if (!projectSpace || !spaceObject) {
      // We do not listen for any room-specific events if we are not currently editing a project
      return
    }

    async function handleRoomTimelineEvent (event) {
      if (event.event.type === 'm.room.message' && blocks?.filter(({ roomId }) => event.event.room_id.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        // If a given content block room received a new message, we set the "lastUpdate" property of the appropriate
        // block in "blocks" which will force the given content block to re-render.
        setBlocks((blocks) => {
          const newBlocks = [...blocks]

          return newBlocks.map((block) => {
            if (block.room_id === event.event.room_id) {
              block.lastUpdate = event.event.origin_server_ts
            }

            return block
          })
        })
      }
    }

    async function handleRoomStateEvent (event) {
      /*
      Not sure if still needed, might only update collaborator list and causes trouble
      if (event.event.type === 'm.room.member' && spaceObject.rooms?.filter(({ roomId }) => event.sender?.roomId.includes(roomId)) && event.event.sender !== localStorage.getItem('mx_user_id')) {
        fetchSpace()
      } else
      */
      if (event.event.type === 'm.room.name' && blocks?.filter(({ roomId }) => event.sender?.roomId.includes(roomId))) {
        // listen to room order changes or deletions (room names being changed)
        fetchSpace()
      } else if (event.event.type === 'm.space.child' && event.event.room_id === projectSpace && event.event.sender !== localStorage.getItem('mx_user_id')) {
        // new content room being added
        fetchSpace()
        matrixClient.joinRoom(event.event.state_key)
      }/* else if (event.event.state_key === projectSpace) {
        fetchSpace()
      }
      */
    }

    console.log('subscribe to all room events')
    matrixClient.addListener('Room.timeline', handleRoomTimelineEvent)
    matrixClient.addListener('RoomState.events', handleRoomStateEvent)

    return () => {
      console.log('unsubscribed from all room events')
      matrixClient.removeListener('Room.timeline', handleRoomTimelineEvent)
      matrixClient.removeListener('RoomState.events', handleRoomStateEvent)
    }
  }, [projectSpace, spaceObject, blocks, fetchSpace, matrixClient])

  const listeningToCollaborators = async () => {
    setIsCollab(true)
    try {
      // joining contentRooms which might have been created since we last opened the project
      await matrixClient.getSpaceSummary(projectSpace).then(res => {
        res.rooms.map(async contentRooms => contentRooms.room_id !== projectSpace && await matrixClient.joinRoom(contentRooms.room_id))
      })
    } catch (err) {
      console.error(err)
    }
  }

  const changeProjectImage = (url) => {
    setLoading(true)
    setProjectImage(url)
    setLoading(false)
  }

  const startListeningToCollab = () => {
    setIsCollab(true)
    console.log('Started spying on collaborators')
    listeningToCollaborators()
  }

  const changeTitle = (newTitle) => {
    setTitle(newTitle)
  }

  return (
    <>
      <section className="welcome">
        <p><strong>Welcome to your project!</strong></p>
        <p>This is the project page. Please add in which context the project happend, projectname and descriptive text and images.
          If you want to continue at a later point in time, you can save the project as a draft and find it in your collection under “drafts”.</p>
      </section>
      <section className="project-title">
        <h3>Project Title</h3>
        <ProjectTitle title={title} projectSpace={projectSpace} callback={changeTitle} />
      </section>
      {projectSpace && (
        <>
          <section className="context">
            <h3>Context</h3>
            <Category title={title} projectSpace={projectSpace} />
          </section>
          <section className="contributors">
            <Collaborators projectSpace={projectSpace} blocks={blocks} title={title} members={roomMembers} startListeningToCollab={() => startListeningToCollab()} />
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
            {spaceObject ? <ProjectDescription space={spaceObject?.rooms[0]} /> : <Loading />}
            {blocks.length === 0
              ? <AddContent number={0} projectSpace={projectSpace} blocks={blocks} reloadSpace={reloadSpace} />
              : blocks.map((content, i) =>
                <DisplayContent block={content} index={i} blocks={blocks} projectSpace={projectSpace} reloadSpace={reloadSpace} key={content + i + content?.lastUpdate} />
              )}
          </section>
          <section className="visibility">
            <h3>Visibility (Draft/Published)</h3>
            <p>Select if you want to save the information provided by you as a draft or if you are happy with it select to publish the project. You can change this at any time.</p>
            {spaceObject ? <PublishProject space={spaceObject.rooms[0]} published={visibility} /> : <Loading /> }
          </section>
        </>
      )}
    </>
  )
}

export default Submit
