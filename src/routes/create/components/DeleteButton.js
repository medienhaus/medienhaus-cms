import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'
// import { isArray } from 'lodash'

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <button
      className={clickedDelete && 'del'} disabled={deleting} onClick={async (e) => {
        console.log(props.block)

        if (clickedDelete) {
          setDeleting(true)
          // @TODO delete rooms within space when deleting event space
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
