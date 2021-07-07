import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import debounce from 'lodash/debounce'

const Collaborators = ({ projectSpace, blocks, title, members, startListeningToCollab }) => {
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState([])
  const [collab, setCollab] = useState('')
  const [inviting, setInviting] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const invite = async (e) => {
    setInviting(true)
    e?.preventDefault()
    const id = collab.split(' ')

    try {
      await matrixClient.invite(projectSpace, id[1]).then(() => {
        const room = matrixClient.getRoom(projectSpace)
        matrixClient.setPowerLevel(projectSpace, id[1], 50, room.currentState.getStateEvents('m.room.power_levels', ''))
      })
      blocks.forEach(async (room, index) => {
        try {
          await matrixClient.invite(room.room_id, id[1]).then(async () => {
            const stateEvent = matrixClient.getRoom(projectSpace)
            await matrixClient.setPowerLevel(room.room_id, id[1], 50, stateEvent.currentState.getStateEvents('m.room.power_levels', ''))
          }).then(() => console.log('invited ' + id[1] + ' to ' + room.name))
        } catch (err) {
          console.error(err)
        }
      }
      )
      console.log('done')
    } catch (err) {
      console.error(err)
    } finally {
      setInviting(false)
    }
  }

  const fetchUsers = async (e, search) => {
    e.preventDefault()
    setFetchingUsers(true)
    try {
      const users = await matrixClient.searchUserDirectory({ term: search })
      setUserSearch(users.results)
      console.log(userSearch)
    } catch (err) {
      console.error('Error whhile trying to fetch users: ' + err)
    } finally {
      setFetchingUsers(false)
    }
  }

  return (
    <>
      <h3>Contributors</h3>
      <p>Did you work with other people on this project?</p>
      <p>You can share access (for editing) to this project. The contributing editor needs an <a href="https://spaces.udk-berlin.de" rel="external nofollow noopener noreferrer" target="_blank"><strong>udk/spaces</strong></a> account to edit the project.</p>
      <p>You can also give credits to a contributor without an <strong>udk/spaces</strong> account, but they won’t be able to get access for editing.</p>
      {
        < section >
          <ul>{
           members?.length > 1 && Object.values(members).map(name => {
             startListeningToCollab()
             return <li>{name.display_name}</li>
           })

          }
          </ul>
        </section>}
      <div>
        <div>
          <input list="userSearch" id="user-datalist" name="user-datalist" placeholder="contributor name" onChange={debounce((e) => {
            fetchUsers(e, e.target.value)
            setCollab(e.target.value)
          }, 200)} />
        </div>
        <datalist id="userSearch">
          {userSearch.map((users, i) => {
            return <option key={i} value={users.display_name + ' ' + users.user_id} />
          })}
        </datalist>
      </div>
      {fetchingUsers ? <Loading /> : inviting ?? null}
      <div>
        <button onClick={(e) => invite(e)}>{inviting ? <Loading /> : 'ADD'}</button>
      </div>
    </>
  )
}

export default Collaborators
