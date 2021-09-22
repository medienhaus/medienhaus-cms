import React, { useState } from 'react'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const Requests = ({ roomId, roomName, userName, userId, eventId, matrixClient }) => {
  const { t } = useTranslation()
  const [allButtonsDisabled, setAllButtonsDisabled] = useState(false)

  const kick = async () => {
    setAllButtonsDisabled(true)
    try {
      await matrixClient.kick(roomId, userId).then(console.log)
    } catch (err) {
      console.error(err)
      setAllButtonsDisabled(false)
    }
  }

  const invite = async () => {
    setAllButtonsDisabled(true)
    try {
      await matrixClient.invite(roomId, userId).then((res) => {
        console.log(res)
        // in case we need to change power level for users
        // knockClient.getRoom(projectSpace)
        // matrixClient.setPowerLevel(projectSpace, id[1], 100, room.currentState.getStateEvents('m.room.power_levels', ''))
      })
    } catch (err) {
      console.error(err)
      setAllButtonsDisabled(false)
    }
  }

  /*  @TODO what happens when reporting ?
  const report = () => {
      setAllButtonsDisabled(true)
      console.log('Reported ' + userName + ' for spamming in ' + roomName)
    }
  */
  return (
    <div className="requests">
      <div>
        <p>{userName} ({userId}) {t(' wants to join ')} {roomName}</p>
        <div className="confirmation">
          <LoadingSpinnerButton className="cancel" disabled={allButtonsDisabled} onClick={kick}>{t('REJECT')}</LoadingSpinnerButton>
          <LoadingSpinnerButton className="confirm" disabled={allButtonsDisabled} onClick={invite}>{t('ACCEPT')}</LoadingSpinnerButton>
        </div>
        {// <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={report}>{t('REPORT')}</LoadingSpinnerButton>
        }
      </div>
    </div>
  )
}
export default Requests
