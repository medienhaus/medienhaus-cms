import React, { useState } from 'react'
import AddLocation from '../../AddContent/AddLocation'
import { useTranslation } from 'react-i18next'

function AddEvent (props) {
  const [isAddEventVisible, setIsAddEventVisible] = useState(false)
  const { t } = useTranslation('locations')

  return (
    <>
      {!isAddEventVisible && (
        <button
          disabled={props.disabled}
          className="add-button" onClick={e => {
            e.preventDefault()
            setIsAddEventVisible(true)
          }}
        >
          + {t('Add Custom Location')}
        </button>
      )}
      {isAddEventVisible &&
        <AddLocation
          number={props.length} // only return the number of new event spaces
          projectSpace={props.room_id}
          handleOnBlockWasAddedSuccessfully={props.reloadSpace}
          inviteCollaborators={props.inviteCollaborators}
          callback={() => setIsAddEventVisible(false)}
          disabled={props.disabled}
          allocationEvent={props.allocation}
        />}
    </>
  )
}
export default AddEvent
