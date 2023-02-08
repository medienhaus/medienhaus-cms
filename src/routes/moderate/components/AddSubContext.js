import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import SimpleContextSelect from '../../../components/SimpleContextSelect'
import Matrix from '../../../Matrix'

function AddSubContext (props) {
  const [selectedContext, setSelectedContext] = useState(null)
  const [loading, setLoading] = useState(false)

  const onContextChange = async (context) => {
    console.log(context)
    setSelectedContext(context)
  }
  const onClick = async (e) => {
    e.preventDefault()
    setLoading(true)
    // add this subspaces as children to the root space
    await Matrix.addSpaceChild(props.parent, selectedContext).catch((err) => console.log(err))
    // console.log('created Context ' + name + ' ' + space.room_id)
    // @TODO needs proper callback to update list of chilren in ManageContexts.js
    props.callback('')
    props.callback(props.parent)
    setSelectedContext(null)
    setLoading(false)
  }

  return (
    <form>
      <div>
        <SimpleContextSelect
          onItemChosen={onContextChange}
          selectedContext={selectedContext}
          struktur={props.nestedRooms}
          disabled={props.loading}
        />
      </div>
      <button type="submit" disabled={props.disableButton || !selectedContext || loading} onClick={onClick}>{loading ? <Loading /> : props.t('Add Context')}</button>
    </form>
  )
}
export default AddSubContext
