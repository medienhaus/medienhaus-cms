import React, { useEffect, useState } from 'react'
import {useHistory, useParams} from "react-router-dom";
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import Collaborators from './Collaborators'
import FileUpload from './FileUpload'
import AddContent from './AddContent'
import { Loading } from '../../components/loading'
import createBlock from './matrix_create_room'

const Submit = () => {
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState("draft")
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const {joinedSpaces, spacesErr, fetchSpaces} = useJoinedSpaces()
  const [contentSelect, setContentSelect] = useState('');
  const [update, setUpdate] = useState(false);
  const matrixClient = Matrix.getMatrixClient()
  const params = useParams();
  const history = useHistory();

  const projectSpace = params.spaceId;

  const getSync = async () => {
    try {
      await matrixClient.startClient()
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    const listening = async () => {
      await matrixClient.removeAllListeners()
      const myRooms = await matrixClient.getSpaceSummary(projectSpace)
      console.log(myRooms);

      matrixClient.addListener("RoomState.events", function (event) {
        if (event.event.type === "m.room.member" && myRooms.rooms?.filter(({ room_id }) => event.sender.roomId.includes(room_id))) {
          setUpdate(true)
          //console.log(event);
        } else if (event.event.type === "m.room.name" && blocks?.filter(({ room_id }) => event.sender.roomId.includes(room_id))) {
          setUpdate(true)
        } else if (event.event.state_key === projectSpace) {
          setUpdate(true)
          // console.log(event);
        }
      })
      matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
        if (event.getType() !== "m.room.message"  && blocks?.filter(({ room_id }) => event.event.room_id.includes(room_id))) {
          return; // only use messages
        }
        console.log(event.event);
        setUpdate(true)
      });
    }
  
    projectSpace && listening()
  }, [projectSpace]);

  useEffect(() => {
    getSync()
  }, []);

  useEffect(() => {
    const fetchSpace = async () => {
      const space = await matrixClient.getSpaceSummary(projectSpace)
      const spaceRooms = space.rooms.map(room => {
        if (!('room_type' in room)) {
          return room
        }
      })
      setBlocks(spaceRooms.filter(x => x !== undefined).sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      }))
      console.log(blocks);
      setUpdate(false)

    }
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [update, projectSpace]);

  //======= COMPONENTS ======================================================================

  const Drafts = () => {
    return (
      <>
      <h2>Drafts:</h2>
      <ul>
          {spacesErr ? console.error(spacesErr) : joinedSpaces ? joinedSpaces.map((space, index) => {
            return <li key={index} ><button onClick={() => {
              history.push(`/submit/${space.room_id}`);
              setTitle(space.name);
              setVisibility(space.published);
            }}>{space.name}</button></li>
      }) : null 
        }
      </ul>
      </>
    )
  }

  const SubmitButton = () => {
    const [response, setResponse] = useState();
    const [saving, setSaving] = useState(false);

    const onPublish = async (e) => {
      e.preventDefault()
      setSaving(true)
      const req = {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
        body: JSON.stringify({"join_rule": visibility === "public" ? 'public' : 'invite'})
      }
      try {
        //matrixClient.sendEvent(projectSpace, "m.room.join_rules", {"join_rule": visibility === "public" ? 'public' : 'invite'} ).then((res) => console.log(res))
      fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.room.join_rules/`, req)
          .then (response => {
            console.log(response);
            if (response.ok) {
              setResponse("Changed successfully!")
              setTimeout(() => {
                setResponse()
              }, 3000);
            } else {
              setResponse("Oh no, something went wrong.")
              setTimeout(() => {
                setResponse()
              }, 3000);
            }
      })
        
      } catch (err){
        console.error(err);
       
      } finally {
        setSaving(false)
      }
    }

    return (
      <div>
        <div>
          <select id="visibility" name="visibility" value={visibility} onChange={(e) => { setVisibility(e.target.value)}}>
                  <option value="invite">Draft</option>
                  <option value="public">Published</option>
                </select>
              </div>
        <div>
          <input id="submit" name="submit" type="submit" value="SAVE" disabled={ saving }onClick={(e) => onPublish(e)} />
          {response && <p>{response}</p>}
        </div>
      </div>
      
    )
  }

  const ProjectTitle = () => {

    const [projectTitle, setProjectTitle] = useState('');
    const [edit, setEdit] = useState(false);
    const [changing, setChanging] = useState(false);
    const [newProject, setNewProject] = useState(false);
    const [warning, setWarning] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const doublicate = joinedSpaces?.filter(({ name }) => projectTitle === name).length > 0

     
    useEffect(() => {
      setProjectTitle(title)
      title === '' && setNewProject(true)
      // eslint-disable-next-line
    }, [title]);

    const deleteProject = async (e) => {
      e.preventDefault()
      const space = await matrixClient.getSpaceSummary(projectSpace)
      console.log(space);
      space.rooms.reverse().map(async (space, index) => {
        //we reverse here to leave the actual project space last in case something goes wrong in the process.
        setLeaving(true)
        console.log("Leaving " + space.name);
        try {
          const count = await matrixClient.getJoinedRoomMembers(space.room_id)
          Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
            localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(space.room_id, name)
          })
          try {
            const leave = await matrixClient.leave(space.room_id)
            history.push('/submit');
          } catch (err) {
            console.error(err);
          }
   
        } catch (err) {
          console.error(err);
        } finally {
          //setCounter(0)
          setLeaving(false)
        }
        
      })
    }

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

  
    const DeleteProjectButton = () => {
      //dom not redrawing drafts after deletion is complete, needs to be fixed
    
      return (
          <>
          {warning && <p>Are you sure you want to delete the project <strong>{title}</strong>? This cannot be undone and will delete the project for you and any collaborator that might be part of it.</p>}
            <input style={{ backgroundColor: "red" }} //@Andi please add to css
              id="delete"
              name="delete"
              type="submit"
              value={warning ? "Yes, delete project" : "Delete project"}
              disabled={!title || leaving}
              onClick={(e) => {
                if (warning) {
                  deleteProject(e)
                  setWarning(false)
                } else {
                  e.preventDefault()
                  setWarning(true)
                }
                }
              } />
          {leaving && <Loading />}
         
           {warning &&  <input
            id="delete"
            name="delete"
            type="submit"
            value={'CANCEL'}
            onClick={() => {setWarning(false) }}
           />}
              </>
              )
    }
    
    return (
      <>
      <div>
            <label htmlFor="title">Project Title</label>
          <input id="title" name="title" placeholder="project title" type="text" value={projectTitle} disabled={title && !edit} onChange={(e) => setProjectTitle(e.target.value)} />
        </div>
        <div>
          
          {loading ? <Loading /> : title && !edit && <DeleteProjectButton />}
          {title && !warning && <input id="submit" name="submit" type="submit" value={edit ? "Save" : changing ? <Loading /> : "Edit Title"} onClick={async (e) => {
            e.preventDefault();
            if (edit) {
              setChanging(true)
              try {
                await matrixClient.setRoomName(projectSpace, projectTitle).then(() => setTitle(projectTitle))
              } catch (err) {
                console.error(err);
              } finally {
                setChanging(false)
              }
              setEdit(false)
            } else {
              setEdit(true)
            }
          }} />}
          {edit && <input id="submit" name="submit" type="submit" value="Cancel" onClick={(e) => { e.preventDefault(); setEdit(false) }} />}
          {loading ? <Loading /> : !warning && !edit && <input id="submit" name="submit" type="submit" value={newProject ? "Create Project": "New Project"} disabled={(newProject && doublicate ) || !projectTitle } onClick={(e) => {
            console.log(newProject);
            if(newProject){
              createProject(e, projectTitle)
              setNewProject(false)
            } else {
              e.preventDefault()
              setNewProject(true)
              setTitle('')
            }
          }} /> 
          }
        </div>
        </>
    )
  }

  const AddBlock = () => {
    const [loading, setLoading] = useState(false);

    return (
      <button type="submit" id="" name="" disabled={contentSelect === "" || false} value="Add Audio" onClick={async (e) =>
      {
        setLoading(true)
        await createBlock( e, contentSelect, blocks.length , projectSpace).then(() => {
          //setCounter(0)
          setLoading(false)
        })
      }
      }>{loading ? <Loading /> : "Add Content"}</button>
    )
  }

  return (
    <div>
     {fetchSpaces ? <Loading /> : <Drafts />}
      
      <h3>Category / Context / Course</h3>
        <div>
            <label htmlFor="subject">Studiengang</label>
             <select id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="vk">VK</option>
              <option value="act">Schauspiel</option>
              <option value="clown">Clown</option>
              <option value="kunst">Kunst</option>
            </select>
            {
            // sollte es hier die möglichkeit geben mehrere auszuwählen? also studiengang übergreifende projekte
            }
        </div>
        <h3>Project Title / Collaborators / Credits</h3>
        <ProjectTitle />
        {projectSpace && (
          <>
           
            <Collaborators projectSpace = {projectSpace} blocks = { blocks} title = {title} />
             
            <h3>Content</h3>
            { blocks.map((content, i) => 
              <AddContent block={content} index={i} blocks={blocks}/>
            )}
              <div>
              <select name="content-select"  defaultValue={''} id="content-select" onChange={(e) => setContentSelect(e.target.value)}>
              <option value='' disabled={true} >Select Content</option>
                  <option value="none" disabled={true} >--Text------------</option>
                  <option value="heading">Heading</option>
                  <option value="text">Text</option>
                  <option value="" disabled={true} >--Media------------</option>
                  <option value="image">Image</option>
                <option value="audio">Audio</option>
              </select>
              {contentSelect === "image" || contentSelect === "audio"  ?
             <FileUpload fileType = {contentSelect} number={ blocks.length} space = {projectSpace} /> : <AddBlock />}
                {/*
            // fetch("https://stream.udk-berlin.de/api/userId/myVideos")
            */}
          
            </div>
            <h3>Visibility (Draft/Published)</h3>
              {loading ? <Loading /> : <SubmitButton />}
          </>
        )
        }
    </div>
  )
}

export default Submit
