import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import Matrix from '../../../Matrix'
import styled from 'styled-components'

const TagListLi = styled.li`
    display: inline-grid;
    grid-auto-flow: column;
    place-items: center;
    height: calc(var(--margin) * 2);

    div {
        display: grid;
        height: 2rem;
        place-content: center;
        border: unset;
        border-color: var(--color-fg);
        border-radius: unset;
        border-style: solid;
        border-width: calc(var(--margin) * 0.2) 0 calc(var(--margin) * 0.2) calc(var(--margin) * 0.2);
        padding: 0 calc(var(--margin) * 0.5);

    }

    button{
        display: grid;
        place-content: center;
        width: 2rem;
        height: 2rem; 
    }
`

const TagListElement = ({ tagName, projectSpace, callback }) => {
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()

  const onDelete = async (e, tagName) => {
    e.preventDefault()
    setLoading(true)
    await matrixClient.deleteRoomTag(projectSpace, tagName).catch((error) => console.log(error))
    await callback()
    setLoading(false)
  }

  return (
    <TagListLi>
      <div>{tagName}</div>
      <button onClick={(e) => onDelete(e, tagName)}>
        {loading ? <Loading /> : '×'}
      </button>
    </TagListLi>
  )
}

export default TagListElement
