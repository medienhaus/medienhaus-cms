import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <button
      className={props.clickedDelete && 'del'} disabled={props.deleting} onClick={e => {
        if (clickedDelete) {
          setDeleting(true)
          props.onDelete(e, props.block.room_id, props.block.name, props.index)
          setClickedDelete(false)
          props.reloadSpace()
          setDeleting(false)
        } else {
          e.preventDefault()
          setClickedDelete(true)
        }

          <p>{props.deleting}</p> // feedback that deleting was succesfull or has failed
      }}
    >
      {clickedDelete ? <TrashIcon fill="var(--color-bg)" /> : deleting ? <Loading /> : '×'}
    </button>
  )
}
export default DeleteButton
