import React, { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import FetchCms from '../../components/matrix_fetch_cms'
import Collaborators from '../../components/Collaborators'
import showdown from 'showdown'
import Editor from "rich-markdown-editor";
import debounce from "lodash/debounce";
import { Loading } from '../../components/loading'

const Submit = () => {
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState("draft")
  const [loading, setLoading] = useState(false)
  const [projectSpace, setProjectSpace] = useState('')
  const [counter, setCounter] = useState(0)
  const [blocks, setBlocks] = useState([])
  const {joinedSpaces, spacesErr, fetchSpaces} = useJoinedSpaces()
  const [contentSelect, setContentSelect] = useState('');
  const [update, setUpdate] = useState(false);

  const converter = new showdown.Converter()
  const matrixClient = Matrix.getMatrixClient()

  const createBlock = async (content, e) => {
    e.preventDefault()
    const opts = {
      name: (blocks.length) + '_' + content, // blocks[0] is the project space itself, therefore -1
      preset: 'public_chat',
      topic: JSON.stringify({ type: content }),
      creation_content: { 'm.federate': false },
      initial_state: [{
        type: 'm.space.parent',
        content: {
          via: [localStorage.getItem('mx_home_server')],
          canonical: true
        },
        state_key: projectSpace
      }, {
        type: 'm.room.history_visibility',
        content: { history_visibility: 'world_readable' }
      }]
    }

    const req = {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        via: [localStorage.getItem('mx_home_server')],
        suggested: false,
        auto_join: true
      })
    }

    try {
      const room = await matrixClient.createRoom(opts)
        .then(async (res) => {
          const room_id = res.room_id
          const response = await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.space.child/${room_id}`, req)
          return [room_id, response]
        })
        .then(async (res) => {
          const data =  await res[1].json()
          if (!res[1].ok) {
            const error = (data?.message) || res[1].status
            return Promise.reject(error)
          }
          return res[0]
        })
      return room 
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const getSync = async () => {
    try {
      await matrixClient.startClient()
    } catch (e) {
      console.log(e)
    }

    matrixClient.on("RoomState.events", function (event, state, prevEvent) {
      if (event.event.type === "m.space.parent" && event.event.state_key === projectSpace) {
        setUpdate(true)
        setUpdate(false)
        console.log(event);
      } else if (event.event.type === "m.room.member" && blocks?.filter(({ room_id }) => event.sender.roomId.includes(room_id)))
      setUpdate(true)
      setUpdate(false)
      console.log(event);
      //console.log(event);
      //console.log(state);
    });
  }

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
      setCounter(space.rooms.length)
      console.log(blocks);
    }
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [update, projectSpace]);

  //======= COMPONENTS ======================================================================

  const AddFiles = (props) => {
    const [selectedFile, setSelectedFile] = useState();
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const size = props.fileType === 'image' ? 5000000 : 25000000
    const changeHandler = (event) => {
      setSelectedFile(event.target.files[0])
      console.log(selectedFile)
      setFileName(event.target.files[0].name)
      // setIsFilePicked(true);
    }

    const handleSubmission = async (e) => {
      e.preventDefault()
      setLoading(true)
      try {
        //await createBlock(props.fileType, e).then(async (res) => {
          
        await matrixClient.uploadContent(selectedFile, { name: fileName })
          .then(async(url) => {
            const room = await createBlock(props.fileType, e)
            return [url, room]
            }).then((res) =>
            props.fileType === "image" ?
              matrixClient.sendImageMessage(res[1], res[0], {
              mimetype: selectedFile.type,
              size: selectedFile.size
              }) : matrixClient.sendMessage(res[1], {
                "body": selectedFile.name,
                "info": {
                  "size": selectedFile.size,
                  "mimetype": selectedFile.type
                }, "msgtype": "m.audio",
                "url": res[0]
              })
              )
              .then(console.log) 
          setFileName()
          setSelectedFile('')
          //setCounter(0)
         //})
       
      } catch (e) {
        console.log('error while trying to save image: ' + e)
      } finally {
        setLoading(false)
      }
    }

    selectedFile && console.log(selectedFile);
    return (
      <>
        <input type="file" name="filename" onChange={changeHandler} disabled={contentSelect === "" || false} />
        {selectedFile
          && (
            <div>
            <p>Filename: <input type="text" value={fileName} onChange={e => {
              e.preventDefault()
              setFileName(e.target.value)
            }} />
            </p>
            <button onClick={(e) => handleSubmission(e)} disabled={!selectedFile.type.includes(props.fileType) || selectedFile.size > size || loading}>{loading ? <Loading /> : "Upload"}</button>
            {selectedFile.type.includes(props.fileType) || <section>Please select an {props.fileType} file.</section>}
            {selectedFile.size > size && <section style={{ color: "red" }}> File size needs to be less than {size / 1000000}MB</section> //@Andi pls add to css
            }
            </div>
        )
         }
      </>)
  }
  
  const AddContent = ({block, index}) => {
    const [clicked, setClicked] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { cms, error, fetching } = FetchCms(block.room_id)
    const json = JSON.parse(block.topic)
    
    const onSave = async (roomId) => {
      setReadOnly(true);
      try {
       const save =  await matrixClient.sendMessage(roomId, {
          body: localStorage.getItem(roomId),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: converter.makeHtml(localStorage.getItem(roomId))
        })
        if ("event_id" in save) {
          setSaved("Saved!")
          setTimeout(() => {
            setSaved()
          },1000)
        }
        // await matrixClient.redactEvent(roomId.room_id, entry.event, null, { 'reason': 'I have my reasons!' })
      } catch (e) {
        console.error('error while trying to save: ' + e)
        setSaved("Couldn't save!")
          setTimeout(() => {
            setSaved()
          },1000)
      } finally {
        setReadOnly(false)
      }
    }

    const onDelete = async (e, roomId, index) => {
      e.preventDefault()
      setDeleting(true)
      setReadOnly(true)

      const reorder = (name, room_id) => {
            const title = name.split('_')
            const num = parseInt(title[0]) - 1
            matrixClient.setRoomName(room_id, num  + '_' + title[1] )
          }
      try {
        const count = await matrixClient.getJoinedRoomMembers(roomId)
        Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
          localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
        })
        matrixClient.leave(roomId)
        blocks.forEach((block, i) => {
          if (i > index) {
            reorder(block.name, block.room_id)
          }
        })
        //setCounter(0)
      } catch (err) {
        console.error(err)
        setDeleting(`couldn't delete ${json.type}, please try again or try reloading the page`)
        setTimeout(() => {
          setDeleting()
        },2000)
      }
      finally {
        setDeleting()
      }
      //matrixClient.kick(roomId, userId)
      //matrixClient.leave(roomId)
    }

    const changeOrder = async (e,roomId, name, direction) => {
      e.preventDefault()
      setReadOnly(true)
      //blocks.splice((pos) + direction, 0, blocks.splice(pos, 1).pop())
      const active = name.split('_')
      const order = parseInt(active[0])
      const newOrder = order + direction
      const passive = blocks[newOrder].name.split('_')
      const passiveRoom = blocks[newOrder].room_id
      try {
        await matrixClient.setRoomName(roomId, newOrder + '_' + active[1]).then(
          await matrixClient.setRoomName(passiveRoom, order + '_' + passive[1])
        )//.then(setCounter(0))
      } catch (err) {
        console.error(err);
      } finally {
        setReadOnly(false)
      }
    }
      
  const string2hash = (string) => {
    console.log(typeof string);
    var hash = 0;
                if (string.length === 0) return hash;
                for (let i = 0; i < string.length; i++) {
                    const char = string.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash;
  }

        return (
          fetching
            ? <div style={{ height: "120px"}}><Loading /></div> // @Andi sort of... hack to keep interface from violently redrawing. We need to see how we deal with this. Too many waterfalls, let's stick to the rivers and the lakes that we're used to.
            : error
              ? console.error(error)
              : (
                <>
                  {cms?.msgtype === 'm.image' ?
                    //@Andi <image /> not being displayed, so made this workaround with an editor in readonly mode. Althogh this offers a few advantages (same design as other content blocks and ability to directly download image for contributors)
                     <Editor
                     dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                     defaultValue={cms && `![we probably should parse alt text in room topic](${matrixClient.mxcUrlToHttp(cms.url)})`}
                      readOnly={true}
                      key={index}
                    />
                    : cms?.msgtype === 'm.audio' ?
                      <>
                    <audio controls>
                    <source src={matrixClient.mxcUrlToHttp(cms.url)} />
                    </audio>
                    <section id="audio-title">{cms.body}</section>
                    </>  :
                    <>
                  <Editor
                    dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                    defaultValue={cms?.body}
                    placeholder={json.type}
                        readOnly={readOnly}
                        onSave={({ done }) => { if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        } else if(localStorage.getItem(block.room_id) !== null && cms === undefined){
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        } }}
                    onChange={debounce((value) => {
                      const text = value();
                      localStorage.setItem(block.room_id, text);
                     }, 250)}
                    handleDOMEvents={{
                      focus: () => console.log("FOCUS on " + block.room_id),
                      blur: (e) => {
                        if (localStorage.getItem(block.room_id) !== null && cms !== undefined && string2hash(cms.body) !== string2hash(localStorage.getItem(block.room_id))) {
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        } else if(localStorage.getItem(block.room_id) !== null && cms === undefined){
                          onSave(block.room_id)
                          localStorage.removeItem(block.room_id)
                        }
                      }
                    }
                    }
                    key={block.room_id} />
                      <p key={block.room_id + "_p" }style={{ fontSize: "calc(var(--margin) * 0.7" }}>{saved}</p>
                  </>
                  }
                  {//@Andi maybe a check mark or something next to the editor/content block? some visual feedback for users to show their edit has been saved
                  }
                   <p>{deleting}</p>
                  <div className="grid">
                  {index !== 0 && <button key={'up_' + block.room_id} onClick={(e) => changeOrder(e, block.room_id,  block.name, -1)}>↑</button>
                  }
                  {index < blocks.length - 1 && <button key={'down_' + block.room_id} onClick={(e) => changeOrder(e,block.room_id, block.name, 1)}>↓</button>
                  }
                    {<button key={'delete' + index} onClick={(e) => {
                      if (clicked) {
                        onDelete(e, block.room_id, index)
                        setClicked(false)
                      } else {
                        e.preventDefault()
                        setClicked(true)
                      }                      
                    }} >{clicked ? 'SURE?' : deleting ? <Loading /> : 'x'}</button>}
                  </div>
                 
            </>
                )
        )
      
    
  }

  const Drafts = () => {
    return (
      <>
      <h2>Drafts:</h2>
      <ul>
          {spacesErr ? console.error(spacesErr) : joinedSpaces ? joinedSpaces.map((space, index) => {
            return <li key={index} ><button onClick={() => { setProjectSpace(space.room_id); setTitle(space.name); setVisibility(space.published) }}>{space.name}</button></li>
      }) : null 
        }
      </ul>
      </>
    )
  }

  const SubmitButton = () => {
    const [response, setResponse] = useState();

    const onPublish = async (e) => {
      e.preventDefault()
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
       
      }
    }
  
    return (
      <div>
        <input id="submit" name="submit" type="submit" value="SUBMIT" onClick={(e) => onPublish(e)} />
        {response && <p>{response}</p>}
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

    const deleteProject = async (e, callback) => {
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
            console.log(leave);
            setTitle("")
            setProjectSpace('')
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
            console.log(response)
            setProjectSpace(response.room_id)
            setTitle(projectTitle)
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
              setProjectSpace('')
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
        await createBlock(contentSelect, e).then(() => {
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
      
      <form>
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
            <h3>Collaborators / Credits</h3>
            <Collaborators projectSpace = {projectSpace} blocks = { blocks} title = {title} />
             
            <h3>Content</h3>
            { blocks.map((content, i) => 
              <AddContent block={ content } index={ i }/>
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
             <AddFiles fileType = {contentSelect} /> : <AddBlock />}
                {/*
            // fetch("https://stream.udk-berlin.de/api/userId/myVideos")
            */}
          
            </div>
            <h3>Visibility (Draft/Published)</h3>
            <div>
              <select id="visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="invite">Draft</option>
                <option value="public">Published</option>
              </select>
            </div>
            <div>
              {loading ? <Loading /> : <SubmitButton />}
            </div>
          </>
        )
        }
        </form>
    </div>
  )
}

export default Submit
