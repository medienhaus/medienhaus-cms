import React, { useState } from 'react'
import AddLocation from '../../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'

function AddEvent (props) {
  const [isAddEventVisible, setIsAddEventVisible] = useState(false)
  const { t } = useTranslation('date')

  return (
    <>
      {!isAddEventVisible && <button
        className="add-button" onClick={e => {
          e.preventDefault()
          setIsAddEventVisible(true)
        }}
                             >
        + {t('Add Event')}
      </button>}
      {isAddEventVisible &&
        <AddLocation
          number={props.length} // only return the number of new event spaces
          projectSpace={props.room_id}
          handleOnBlockWasAddedSuccessfully={props.reloadSpace}
          callback={() => setIsAddEventVisible(false)}
        />}
    </>
  )
}
export default AddEvent
