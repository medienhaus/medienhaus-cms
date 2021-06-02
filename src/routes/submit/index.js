import React, { useState } from 'react'
import Matrix from '../../Matrix'
import { Loading } from "../../components/loading";

const Submit = () => {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('draft');
  const [loading, setLoading] = useState(false);

  const matrixClient = Matrix.getMatrixClient()

  

  const publish = async () => {
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
        })
    } catch (e) {
      console.log(e.data.error)
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
          <h3>Collaborators / Credits</h3> 
          <button>ADD Collaborators +</button>
          <button>ADD Credits +</button>
        </div>
        <div>
          <h3>Content</h3>
          <div className="grid">
            <button>Add Text</button>
            <button>Add Image</button>
            <button>Add Video</button>
            <button>Add Audio</button>
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
            {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="SUBMIT" onClick={()=>publish()} />}
          </div>
        </form>
    </div>
  )
}

export default Submit
