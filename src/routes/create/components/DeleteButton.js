import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'
// import { isArray } from 'lodash'

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <button
      className={clickedDelete ? 'del' : ''} disabled={deleting} onClick={async (e) => {
        if (clickedDelete) {
          setDeleting(true)
          // @TODO delete rooms within space when deleting event space
          await props.onDelete()
          setClickedDelete(false)
          props.callback && await props.callback()
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
