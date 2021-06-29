import React, { useState } from 'react'
import Matrix from '../../../Matrix'
import { Loading } from '../../../components/loading'
import debounce from 'lodash/debounce'

const Collaborators = ({ projectSpace, blocks, title, joinedSpaces, startListeningToCollab }) => {
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
      <h3>Collaborators / Credits</h3>
      {// @Andi would probably be nice to have the loading spinner next to the h3 whil its looking for collabrators
        < section >
          <ul>{
            joinedSpaces?.map((space, i) => space.name === title && Object.values(space.collab).map(name => {
              startListeningToCollab()
              return <li>{name.display_name}</li>
            })
            )
          }
          </ul>
        </section>}
      <div>
        <div>
          <label htmlFor="user-datalist">Add Collaborator</label>
          <input list="userSearch" id="user-datalist" name="user-datalist" onChange={debounce((e) => {
            fetchUsers(e, e.target.value)
            setCollab(e.target.value)
          }, 200)} />
        </div>
        {fetchingUsers ? <Loading /> : inviting ?? null}
        <datalist id="userSearch">
          {userSearch.map((users, i) => {
            return <option key={i} value={users.display_name + ' ' + users.user_id} />
          })}
        </datalist>
      </div>
      <div>
        <button onClick={(e) => invite(e)}>{inviting ? <Loading /> : 'ADD Collaborators +'}</button>
        <button disabled={true}>ADD Credits +</button>
      </div>
    </>
  )
}
export default Collaborators
