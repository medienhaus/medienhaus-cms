import React, { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import FetchCms from '../../components/matrix_fetch_cms'
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
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState([]);
  const [contentSelect, setContentSelect] = useState('');
  const [collab, setCollab] = useState('');

  const converter = new showdown.Converter()
  const matrixClient = Matrix.getMatrixClient()

  const createProject = async () => {
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
        })
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const createBlock = async (content, e) => {
    e.preventDefault()
    const opts = {
      name: counter + '_' + content,
      visibility: 'public',
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
      await matrixClient.createRoom(opts)
        .then((res) => fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.space.child/${res.room_id}`, req))
        .then(async response => {
          const data = await response.json()
          if (!response.ok) {
            const error = (data && data.message) || response.status
            return Promise.reject(error)
          }
          console.log(data)
          const spaces = await matrixClient.getSpaceSummary(projectSpace)
          console.log(spaces)
          setCounter(counter + 1)
          console.log(counter)
        })
        .catch(err => {
          console.error('There was an error!', err)
        })
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchSpace = async () => {
      const space = await matrixClient.getSpaceSummary(projectSpace)
      setBlocks(space.rooms)
      console.log(blocks);
    }
    setCounter(blocks.length)
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [counter, projectSpace]);

  const invite =  (e) => {
    e.preventDefault()
    const id = collab.split(' ')
    blocks.forEach(async (room, index) => {
      try {
        await matrixClient.invite(room.room_id, id[1]).then(() => console.log("invited " + id[1] + " to " + room.name))
        console.log(index);
      } catch (err) {
        console.error(err);
          }
        } 
      )
   }

  const fetchUsers = async (e, search) => {
    e.preventDefault()
    setFetchingUsers(true)
    try{
      const users = await matrixClient.searchUserDirectory({"term": search})
      setUserSearch(users.results)
      console.log(userSearch)
    }
    catch (err) {
      console.error('Error whhile trying to fetch users: ' + err);
    } finally {
      setFetchingUsers(false)
    }
  }

  const changeOrder = (e, pos, direction) => {
    e.preventDefault()
    blocks.splice((pos) + direction, 0, blocks.splice(pos, 1).pop())
    console.log(blocks);
    blocks.map(async (block, index) => {
      const json = JSON.parse(block.topic)
      const order = parseInt(block.name.split('_'))
      console.log(json.type)
      order !== index && index > 0 && matrixClient.setRoomName(block.room_id, index + '_' + json.type)

      try {
        await matrixClient.sendMessage(block.room_id, {
          body: localStorage.getItem(block.room_id),
          format: 'org.matrix.custom.html',
          msgtype: 'm.text',
          formatted_body: converter.makeHtml(localStorage.getItem(block.room_id))
        })

        // await matrixClient.redactEvent(roomId.room_id, entry.event, null, { 'reason': 'I have my reasons!' })
        // onSave()

      } catch (e) {
        console.error('error while trying to save: ' + e)
      }
    })
  }

  const onDelete = async (e, roomId) => {
    e.preventDefault()
    try {
      const count = await matrixClient.getJoinedRoomMembers(roomId)
      Object.keys(count.joined).length > 1 && Object.keys(count.joined).forEach(name => {
        localStorage.getItem('medienhaus_user_id') !== name && matrixClient.kick(roomId, name)
      })
      matrixClient.leave(roomId)
      setCounter(0)
    } catch (err) {
      console.error(err)
    }
    //matrixClient.kick(roomId, userId)
    //matrixClient.leave(roomId)
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
  
  //======= COMPONENTS ======================================================================
  
  const AddContent = ({block, index}) => {
    const [clicked, setClicked] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [saved, setSaved] = useState(false);
    const { cms, error, fetching } = FetchCms(block.room_id)

    console.log("block");
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
        // onSave()
  
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

        return (
          fetching
            ? <div style={{ height: "90px"}}>Loading</div> // @Andi sort of... hack to keep interface from violently redrawing. We need to see how we deal with this. Too many waterfalls, let's stick to the rivers and the lakes that we're used to.
            : error
              ? console.error(error)
              : (
                <>                                     
                  <Editor
                    dark={window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches}
                    defaultValue={cms && cms.body}
                    placeholder={json.type}
                    readOnly={readOnly}
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
                    key={index} />
                  <p style ={{fontSize: "calc(var(--margin) * 0.7"}}>{saved}</p>
                  {//@Andi maybe a check mark or something next to the editor/content block? some visual feedback for users to show their edit has been saved
                  }
                  <div className="grid">
                  {index !== 0 && <button key={'up' + index} onClick={(e) => changeOrder(e, index + 1, -1)}>UP</button>
                  }
                  {index < blocks.length - 2 && <button key={'down' + index} onClick={(e) => changeOrder(e, index + 1, 1)}>DOWN</button>
                  }
                    {<button key={'delete' + index} onClick={(e) => {
                      if (clicked) {
                        onDelete(e, block.room_id)
                        setClicked(false)
                      } else {
                        e.preventDefault()
                        setClicked(true)
                      }                      
                    }} >{clicked ? 'SURE?' : 'DELETE'}</button>}
                  </div>
                 
            </>
                )
        )
      
    
  }

  const Drafts = () => {
    console.log(joinedSpaces);
    return (
      <>
      <h2>Drafts:</h2>
      <ul>
          {spacesErr ? console.error(spacesErr) : joinedSpaces ? joinedSpaces.map((space, index) => {
            console.log(space);
            return <li key={index} ><button onClick={() => { setProjectSpace(space.room_id); setTitle(space.name); setVisibility(space.published) }}>{space.name}</button></li>
      }) : null 
        }
      </ul>
      </>
    )
  }

  const Collaborators = () => {
    return (
      <div>
        <ul>{
          joinedSpaces.map((space, i) => {
            if (space.name === title) {
              return Object.values(space.collab).map(name => {
                return <li>{name.display_name}</li>
              })
            }
          })
        }
          </ul>
      </div>
    )
  }

  const SubmitButton = ({ }) => {
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

  const DeleteProjectButton = () => {
    const [warning, setWarning] = useState(false);

    const deleteProject = (e) => {
      e.preventDefault()
      console.log('nööööööööö');
      setTitle("")
    }
  
    return (
        <>
        {warning && <p>Are you sure you want to delete the project <strong>{title}</strong>? This cannot be undone and will delete the project for you and any collaborator that might be part of it.</p>}
          <input style={{ backgroundColor: "red" }} //@Andi please add to css
            id="delete"
            name="delete"
            type="submit"
            value={warning ? "Yes, delete project" : "Delete project"}
            disabled={!title}
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
    <div>
     {fetchSpaces ? "Loading Drafts. This could take a few seconds..." : <Drafts />}
      <h2>New Project</h2>
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
        <div>
            <label htmlFor="title">Project Title</label>
          <input id="title" name="title" placeholder="project title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="Save Title" disabled={!title} onClick={() => createProject()} /> //@Andi disabled="true" seems to not change styling here for some reason 🤔
          }
          {loading ? <Loading /> : title && <DeleteProjectButton /> }
        </div>
        {projectSpace && (
          <>
            <h3>Collaborators / Credits</h3>
           { fetchingUsers ? "Looking for collaborators..." : <Collaborators />}
              <div>
              <label htmlFor="user-datalist">Add Collaborator</label>
              <input list="userSearch" id="user-datalist" name="user-datalist" onChange={debounce((e) => {
                fetchUsers(e, e.target.value)
                setCollab(e.target.value)
              }, 200)} />
                <datalist id="userSearch">
                {userSearch.map((users, i) => {
                    return <option key={i} value={users.display_name + ' ' + users.user_id} />
                  })}
                </datalist>
            </div>
        <div>
          <button onClick={(e) => invite(e)}>ADD Collaborators +</button>
          <button>ADD Credits +</button>
        </div>
            <h3>Content</h3>
            {blocks.filter(x => x.room_type !== "m.space").map((content, i) => 
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
              <button type="submit" id="" name="" disabled={contentSelect === "" || false } value="Add Audio" onClick={(e) => createBlock(contentSelect, e)}>Add Content</button>
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
