import React, { useState } from 'react'
import matrixcs from 'matrix-js-sdk'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import { useTranslation } from 'react-i18next'

const knockClient = matrixcs.createClient({
  baseUrl: process.env.REACT_APP_MATRIX_BASE_URL,
  accessToken: process.env.REACT_APP_KNOCK_BOT_TOKEN,
  userId: process.env.REACT_APP_KNOCK_BOT_ACCOUNT,
  useAuthorizationHeader: true
})

const Requests = ({ roomId, roomName, userName, userId, eventId }) => {
  const { t } = useTranslation()
  const [allButtonsDisabled, setAllButtonsDisabled] = useState(false)

  const kick = async () => {
    setAllButtonsDisabled(true)
    try {
      await knockClient.kick(roomId, userId).then(console.log)
    } catch (err) {
      console.error(err)
      setAllButtonsDisabled(false)
    }
  }

  const invite = async () => {
    setAllButtonsDisabled(true)

    try {
      await knockClient.invite(roomId, userId).then((res) => {
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

  const report = () => {
    setAllButtonsDisabled(true)
    console.log('Reported ' + userName + ' for spamming in ' + roomName)
    // @TODO what happens when reporting?
  }
  return (
    <div className="requests">
      <div>
        <p>{userName} ({userId}) {t(' wants to join ')} {roomName}</p>
        <div className="confirmation">
          <LoadingSpinnerButton className="cancel" disabled={allButtonsDisabled} onClick={kick}>{t('REJECT')}</LoadingSpinnerButton>
          <LoadingSpinnerButton className="confirm" disabled={allButtonsDisabled} onClick={invite}>{t('ACCEPT')}</LoadingSpinnerButton>
        </div>
        <LoadingSpinnerButton disabled={allButtonsDisabled} onClick={report}>{t('REPORT')}</LoadingSpinnerButton>
      </div>
    </div>
  )
}
export default Requests
