import React, { useState } from 'react'
import LoadingSpinnerButton from '../../components/LoadingSpinnerButton'
import Matrix from '../../Matrix'
import { useTranslation } from 'react-i18next'
import createBlock from './matrix_create_room'

const AddDate = ({ number, reloadSpace, projectSpace, saveButton, callback }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation('date')

  const handleSubmit = async () => {
    setLoading(true)

    await createBlock(undefined, 'date', number, projectSpace).then(async (res) =>
      await matrixClient.sendMessage(res, {
        msgtype: 'm.text',
        body: date + ' ' + time
      })).catch(console.log)
    callback()
    reloadSpace()
    setLoading(false)
  }

  return (
    <>
      <div>
        <label htmlFor="date">{t('Choose a date')}:</label>
        <input
          id="date"
          name="date"
          type="date"
          min="2021-10-29"
          max="2021-10-31"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="time">{t('Choose a time')}:</label>
        <input
          id="time" name="time" type="time" value={time} onChange={(e) => {
            setTime(e.target.value)
          }}
        />
      </div>
      {saveButton &&
        <div className="confirmation">
          <button className="cancel" onClick={() => { callback() }}>{t('CANCEL')}</button>
          <LoadingSpinnerButton disabled={loading || (!date && !time)} loading={loading} onClick={handleSubmit}>{t('SAVE')}</LoadingSpinnerButton>
        </div>}
    </>
  )
}

export default AddDate
