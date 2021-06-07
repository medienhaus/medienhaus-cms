import React, { useEffect, useState } from 'react'
import Matrix from '../../Matrix'
import useJoinedSpaces from '../../components/matrix_joined_spaces'
import FetchCms from '../../components/matrix_fetch_cms'
import showdown from 'showdown'
import Editor from "rich-markdown-editor";
import debounce from "lodash/debounce";
import { Loading } from '../../components/loading'
import { User } from 'matrix-js-sdk'

const Submit = () => {
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState('draft')
  const [loading, setLoading] = useState(false)
  const [projectSpace, setProjectSpace] = useState('')
  const [counter, setCounter] = useState(0)
  const [blocks, setBlocks] = useState([])
  const joinedSpaces = useJoinedSpaces()
  const [blockContent, setBlockContent] = useState([])
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState([]);
  const [contentSelect, setContentSelect] = useState('');

  const converter = new showdown.Converter()
  const matrixClient = Matrix.getMatrixClient()

  const createProject = async () => {
    setLoading(true)
    const opts = {
      preset: visibility === 'published' ? 'public_chat' : 'private_chat',
      name: title,
      creation_content: { type: 'm.space' },
      initial_state: [{
        type: 'm.room.history_visibility',
        content: { history_visibility: visibility === 'published' ? 'world_readable' : 'invited' }
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
        auto_join: false
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
    }
    setCounter(blocks.length)
    projectSpace && fetchSpace()
    // eslint-disable-next-line
  }, [counter, projectSpace]);

  const AddContent = () => {
    return (
      // eslint-disable-next-line
      blocks.filter(x => x.room_type !== "m.space").map((block, index) => {
        const { cms, error, fetching } = FetchCms(block.room_id)
        const key = block.room_id
        // cms && setBlockContent(blockContent => [...blockContent, { [key] : cms.body } ])
        const json = JSON.parse(block.topic)
        return (
          fetching
            ? 'Loading'
            : error
              ? console.error(error)
              : (
                <div>
                   { /*
              <textarea id="text" key={block.room_id} name={block.name} placeholder={`Add ${json.type}`} type="text" value={cms !== undefined && cms.body} onChange={(e) =>
                localStorage.setItem(block.room_id, e.target.value)
              } />
                 */}
               <Editor
              defaultValue={cms && cms.body}
              onChange={debounce((value) => {
                const text = value();
                localStorage.setItem(block.room_id, text);
              }, 250)}
              key={index} />
            </div>
                )
        )
      })
    )
  }

  const invite = () => {
   // matrixClient.invite(roomId, userId)
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
      console.log(search)
    }
  }

  const onSave = (e) => {
    e.preventDefault()
    blocks.map(async (block, index) => {
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
        console.log('error while trying to edit: ')
      }
    })
  }

  const Drafts = () => {
    return (
      <>
      <h2>Drafts:</h2>
      <ul>
      {joinedSpaces && joinedSpaces.map((space, index) => {
        return <li key={index} ><button onClick={() => { setProjectSpace(space.room_id); setTitle(space.name) }}>{space.name}</button></li>
      })
        }
      </ul>
      </>
    )
  }

  return (
    <div>
     {joinedSpaces && <Drafts />}
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
          {loading ? <Loading /> : <input id="submit" name="submit" type="submit" value="Save Title" disabled={!title} onClick={() => createProject()} />}
        </div>
        {projectSpace && (
          <>
            <h3>Collaborators / Credits</h3>
              <div>
              <label htmlFor="user-datalist">Add Collaborator</label>
                <input list="userSearch" id="user-datalist" name="user-datalist" onChange={debounce((e) => {fetchUsers(e, e.target.value)}, 200)} />
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
              <AddContent />
              <div>
              <select name="content-select" id="content-select" onChange={(e) => setContentSelect(e.target.value)}>
                  <option value="" disabled={true} >--Text------------</option>
                  <option value="heading">Heading</option>
                  <option value="text">Text</option>
                  <option value="" disabled={true} >--Media------------</option>
                  <option value="image">Image</option>
                <option value="audio">Audio</option>
                </select>
                <button type="submit" id="" name="" value="Add Audio" onClick={(e) => createBlock(contentSelect, e)}>Add Content</button>
                {/*
            // fetch("https://stream.udk-berlin.de/api/userId/myVideos")
            */}
          
            </div>
            <h3>Visibility (Draft/Published)</h3>
            <div>
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
