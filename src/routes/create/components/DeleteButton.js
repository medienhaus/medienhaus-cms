import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import { ReactComponent as TrashIcon } from '../../../assets/icons/remix/trash.svg'
import styled from 'styled-components'
// import { isArray } from 'lodash'

const Button = styled.button`
width:  ${props => props.width || '100%'};
float: right;
clear: both;
border-color: var(--color-bg);
background-color: ${props => props.clickedDelete ? 'var(--color-no)' : 'var(--color-fg)'};
`

function DeleteButton (props) {
  const [clickedDelete, setClickedDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <Button
      width={props.width}
      clickedDelete={clickedDelete}
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
    </Button>
  )
}
export default DeleteButton
