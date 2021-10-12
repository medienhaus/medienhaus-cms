import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CreateContext from './CreateContext'
import { RemoveContext } from './RemoveContext'

const ManageContexts = (props) => {
  const { t } = useTranslation('admin')
  const [selectedContext] = useState('!EyRTeozehwfsYePWMl:dev.medienhaus.udk-berlin.de')
  const [newContext, setNewContext] = useState('')
  const [parentName] = useState('Stechlin')
  // eslint-disable-next-line no-unused-vars
  const [disableButton, setDisableButton] = useState(false)
  const [parent] = useState('!ZbMmIxgnJIhuROlgKJ:dev.medienhaus.udk-berlin.de')

  const spaceChild = async (e, space, add) => {
    e && e.preventDefault()
    const body = {
      via:
        [process.env.REACT_APP_MATRIX_BASE_URL],
      suggested: false,
      auto_join: true
    }
    await fetch(process.env.REACT_APP_MATRIX_BASE_URL + `/_matrix/client/r0/rooms/${parent}/state/m.space.child/${space}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
      body: JSON.stringify(add ? body : { }) // if we add a space to an existing one we need to send the object 'body', to remove a space we send an empty object.
    }).catch(console.log)
  }

  function addSpace (e) {
    e.preventDefault()
    const createSpace = async (title) => {
      setDisableButton(true)
      const opts = (type, name, history) => {
        return {
          preset: 'private_chat',
          name: name,
          room_version: '7',
          creation_content: { type: 'm.space' },
          initial_state: [{
            type: 'm.room.history_visibility',
            content: { history_visibility: history } //  world_readable
          },
          {
            type: 'dev.medienhaus.meta',
            content: {
              version: '0.3',
              rundgang: 21,
              type: type,
              published: 'draft'
            }
          },
          {
            type: 'm.room.guest_access',
            state_key: '',
            content: { guest_access: 'can_join' }
          }],
          visibility: 'public'
        }
      }

      // create the space for the context
      const space = await props.matrixClient.createRoom(opts('context', title, 'world_readable')).catch(console.log)
      // add this subspaces as children to the root space
      spaceChild(e, space.room_id, true)
      console.log('created Context ' + newContext)

      setDisableButton(false)
      return space
    }
    createSpace(newContext)
  }

  return (
    <>
      <h2>Manage Contexts</h2>
      <p>Crazy circles</p>
      <label htmlFor="name">{t('Parent')}: </label>
      <input type="text" value={parentName} disabled />
      <RemoveContext t={t} selectedContext={selectedContext} parent={parent} parentName={parentName} disableButton={disableButton} callback={spaceChild} />
      <CreateContext t={t} parent={parent} matrixClient={props.matrixClient} setNewContext={setNewContext} parentName={parentName} disableButton={disableButton} callback={addSpace} />
    </>
  )
}
export default ManageContexts
