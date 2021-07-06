import React, { useState } from 'react'
import { ReactComponent as TextIcon } from '../../../assets/icons/remix/text.svg'
import Matrix from '../../../Matrix'

const ProjectDescription = ({ space, callback }) => {
  const [saved, setSaved] = useState(false)
  const [description, setDescription] = useState(space?.topic)
  const matrixClient = Matrix.getMatrixClient()

  const onSave = async () => {
    const save = await matrixClient.setRoomTopic(space.room_id, description)
    if ('event_id' in save) {
      setSaved('Saved!')
      callback()
      setTimeout(() => {
        setSaved()
      }, 1000)
    }
  }

  return (
        <>
            <div className="editor">
                <div className="left">
                    <button disabled={true}>↑</button>
                    <figure className="icon-bg"><TextIcon fill="var(--color-fg)" /></figure>
                    <button disabled={true}>↓</button>
                </div>
                <div className="center">
                  <textarea
                      style={{ height: '100%', border: 'none' }}
                      value = { description }
                      onChange={(e) => {
                        setDescription(e.target.value)
                      }}
                      placeholder="Please add a short description of your project. This field is required before publishing."
                        onBlur={() => onSave(space.room_id)} />
                    <p>{saved}</p>
                </div>
                <div className="right">
                    <button disabled={true} >x</button>
                </div>
            </div>
            <div className="add">
                <button className="add-button" disabled={true} >+</button>
            </div>
        </>
  )
}
export default ProjectDescription
