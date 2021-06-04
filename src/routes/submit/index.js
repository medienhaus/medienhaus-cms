import React, { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import showdown from "showdown"
import { Loading } from "../../components/loading";

const Submit = () => {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [projectSpace, setProjectSpace] = useState('');
  const [counter, setCounter] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const joinedSpaces = useJoinedSpaces()

  const converter = new showdown.Converter()
  const matrixClient = Matrix.getMatrixClient()

  const createProject = async () => {
    setLoading(true)
    const opts = {
      preset: visibility === "published" ? "public_chat" : "private_chat",
      name: title,
      creation_content: { type: "m.space" },
      initial_state: [{
        type: "m.room.history_visibility",
        content: { history_visibility: visibility === "published" ? "world_readable" : "invited" }
      },
      {
        type: "m.room.topic",
        content: { topic: JSON.stringify({ "Rundgang": 21, "type": "Studentproject" }) }
      },
      {
        type: "m.room.guest_access",
        state_key: "",
        content: { guest_access: "can_join" }
      }],
      power_level_content_override: { events_default: 100 },
      visibility: "private"
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
      visibility: "public",
      preset: "public_chat",
      topic: JSON.stringify({ "type": content }),
      creation_content: { "m.federate": false },
      initial_state: [{
        type: "m.space.parent",
        content: {
          via: [localStorage.getItem("mx_home_server")],
          canonical: true
        },
        state_key: projectSpace
      }, {
        type: "m.room.history_visibility",
        content: { history_visibility: "world_readable" }
      }]
    }

    const req = {
      method: 'PUT',
      headers: { 'Authorization': "Bearer " + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        "via": [localStorage.getItem('mx_home_server')],
        "suggested": false,
        "auto_join": false
      })
    }

    try {
      await matrixClient.createRoom(opts)
        .then((res) => fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${projectSpace}/state/m.space.child/${res.room_id}`, req))
        .then(async response => {
          const data = await response.json();
          if (!response.ok) {
            const error = (data && data.message) || response.status;
            return Promise.reject(error);
          }
          console.log(data);
          const spaces = await matrixClient.getSpaceSummary(projectSpace)
          console.log(spaces)
          setCounter(counter + 1)
          console.log(counter)
        })
        .catch(error => {
          console.error('There was an error!', error);
        });
    }
    catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchSpace = async () => {
      const space = await matrixClient.getSpaceSummary(projectSpace)
      setBlocks(space.rooms)
    }
    setCounter(blocks.length)
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [counter, projectSpace]);
  
  const AddContent = () => {
    return (
      // eslint-disable-next-line
      blocks.map((block, index) => {
        if (index > 0) {
          const json = JSON.parse(block.topic)
          return (
            <div>
              <textarea id="text" key={block.room_id} name={block.name} placeholder={`Add ${json.type}`} type="text" onChange={(e) =>
                localStorage.setItem(block.room_id, e.target.value)
              } />
            </div>
          )
        }
      })
    )
  }

  const onSave = (e) => {
    e.preventDefault()
    blocks.map(async (block, index) => {
      try {
        await matrixClient.sendMessage(block.room_id, {
          "body": localStorage.getItem(block.room_id),
          "format": "org.matrix.custom.html",
          "msgtype": "m.text",
          "formatted_body": converter.makeHtml(localStorage.getItem(block.room_id))
        })
        //await matrixClient.redactEvent(roomId.room_id, entry.event, null, { 'reason': 'I have my reasons!' })

        //onSave()
      } catch (e) {
        console.log("error while trying to edit: ")
      }
    })
  }

  return (
    <div>
      <h2>Drafts:</h2>
      <ul>
      {joinedSpaces.map((space, index) => {
        console.log(space)
        return <li key={index} ><button onClick={() => {setProjectSpace(space.room_id); setTitle(space.name) }}>{space.name}</button></li>
      })
        }
        </ul>
      <h2>New Project</h2>
      <form>
        <div>
        <h3>Category / Context / Course</h3>
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
        
        <div>
        <h3>Project Title / Collaborators / Credits</h3>
            <label htmlFor="title">Project Title</label>
            <input id="title" name="title" placeholder="project title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
            {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="Save Title" onClick={() => createProject()} />}
        </div>
        {projectSpace && (
            <>
        <div>
          <h3>Collaborators / Credits</h3> 
          <button>ADD Collaborators +</button>
          <button>ADD Credits +</button>
        </div>
            <div>
              <h3>Content</h3>
              <AddContent />
              <div className="grid">
                <button type="submit" id="" name="" value="Add Text" onClick={(e) => createBlock('text', e)} >Add Text</button>
                <button type="submit" id="" name="" value="Add Image" onClick={(e) => createBlock('img', e)}>Add Image</button>
                <button type="submit" id="" name="" value="Add Video" onClick={(e) => createBlock('video', e)}>Add Video</button>
                <button type="submit" id="" name="" value="Add Audio" onClick={(e) => createBlock('audio', e)}>Add Audio</button>
                {/*
            // fetch("https://stream.udk-berlin.de/api/userId/myVideos")
            */}
              </div>
            </div>
            <div>
              <h3>Visibility (Draft/Published)</h3>
              <select id="visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="SUBMIT" onClick={(e) => onSave(e)} />}
            </div>
          </>
         )
        }
        </form>
    </div>
  )
}

export default Submit
