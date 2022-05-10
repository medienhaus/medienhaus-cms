import React, { useState } from 'react'
import createBlock from '../../matrix_create_room'
import reorder from '../../DisplayContent/matrix_reorder_rooms'
import { Loading } from '../../../../components/loading'

const AddBlock = ({ contentSelect, number, projectSpace, blocks, reloadSpace, displayPlusButton }) => {
  const [loading, setLoading] = useState(false)
  return (
    <button
      className="add-content" type="submit" disabled={contentSelect === '' || false} value={`add ${contentSelect}`} onClick={async (e) => {
        setLoading(true)
        blocks.forEach((block, i) => {
          if (i >= number) {
            console.log(block.name)
            reorder(block.name, block.room_id, projectSpace, false)
          }
        })

        await createBlock(e, contentSelect, number, projectSpace).then((res) => {
          setLoading(false)
          displayPlusButton(true)
          reloadSpace(res)
        })
      }}
    >{loading ? <Loading /> : 'Add Content'}
    </button>
  )
}

export default AddBlock
