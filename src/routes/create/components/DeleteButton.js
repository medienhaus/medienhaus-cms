import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'
import styled from 'styled-components'

const Button = styled.button`
  background-color: ${props => props.clickedDelete ? 'var(--color-no)' : 'var(--color-fg)'};
  border: none;
  display: grid;
  place-content: center;
  height:  ${props => props.height || '100%'};
  width:  ${props => props.width || '100%'};
`

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <Button
      height={props.height}
      width={props.width}
      clickedDelete={clickedDelete}
      disabled={deleting}
      onClick={async (e) => {
        if (clickedDelete) {
          setDeleting(true)
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
      {deleting ? <Loading /> : clickedDelete ? <TrashIcon fill="var(--color-bg)" /> : '×'}
    </Button>
  )
}
export default DeleteButton
