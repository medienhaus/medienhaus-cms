import React, { useState } from 'react'
import Matrix from '../../Matrix'
import { Loading } from "../../components/loading";

const Submit = () => {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [projectSpace, setProjectSpace] = useState('');
  const [counter, setCounter] = useState(0);

  const matrixClient = Matrix.getMatrixClient()

  const createProject = async () => {
    setLoading(true)
    const opts = {
      preset: visibility === "published" ? "public_chat": "private_chat",
      name: title,
      creation_content: { type: "m.space" },
      initial_state: [{
        type: "m.room.history_visibility",
        content: { history_visibility: visibility === "published" ? "world_readable" : "invited"  }
      },
        {
          type: "m.room.topic",
          content: { topic: "project data and stuff" }
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
    setCounter(counter + 1)
    console.log(counter)
    
    const req2 = {
      method: 'PUT',
      header: {'Authorization': "Bearer " + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify({
        "via": [localStorage.getItem('mx_home_server')],
        "suggested": false,
        "auto_join": false
      })
    }
    const opts = {
      name: counter + '_' + content,
      visibility: "public",
      preset: "public_chat",
      topic: content,
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
    try {
      await matrixClient.createRoom(opts)
      .then((res) => fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${encodeURIComponent(projectSpace)}/state/m.space.child/${encodeURIComponent(res.room_id)}?access_token=${localStorage.getItem('medienhaus_access_token')}`, req2))
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            const error = (data && data.message) || response.status;
            return Promise.reject(error);
        }
        console.log(data);
        console.log(await matrixClient.getSpaceSummary(projectSpace))
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

  return (
    <div>
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
        <div>
          <h3>Collaborators / Credits</h3> 
          <button>ADD Collaborators +</button>
          <button>ADD Credits +</button>
        </div>
        <div>
          <h3>Content</h3>
          <div className="grid">
            <input type="submit" id="" name="" value="Add Text" onClick={(e)=>createBlock('text', e)}/>
            <input type="submit" id="" name="" value="Add Image" onClick={(e)=>createBlock('img', e)}/>
            <input type="submit" id="" name="" value="Add Video" onClick={(e)=>createBlock('video', e)}/> 
            <input type="submit" id="" name="" value="Add Audio" onClick={(e)=>createBlock('audio', e)}/>
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
            {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="SUBMIT" />}
          </div>
        </form>
    </div>
  )
}

export default Submit
