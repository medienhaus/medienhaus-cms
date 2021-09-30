import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <button
      className={clickedDelete && 'del'} disabled={deleting} onClick={async (e) => {
        if (clickedDelete) {
          setDeleting(true)
          await props.onDelete(e, props.block.room_id, props.block.name, props.index)
          setClickedDelete(false)
          await props.reloadSpace()
          setDeleting(false)
        } else {
          e.preventDefault()
          setClickedDelete(true)
        }
      }}
    >
      {clickedDelete ? <TrashIcon fill="var(--color-bg)" /> : deleting ? <Loading /> : '×'}
    </button>
  )
}
export default DeleteButton
