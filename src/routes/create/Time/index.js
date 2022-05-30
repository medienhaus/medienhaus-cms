import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import SimpleButton from '../../../components/medienhausUI/simpleButton'
import Matrix from '../../../Matrix'

export default function Time ({ allocation, projectSpace, reloadSpace }) {
  const [isUIVisible, setIsUIVisible] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('00:00')
  const [temporalObject, setTemporalObject] = useState({})
  const { t, i18n } = useTranslation('content')
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    setTemporalObject({
      app: process.env.REACT_APP_APP_NAME,
      start: new Date(startDate + 'T' + startTime + ':00.000Z').valueOf() / 1000,
      end: new Date(endDate + 'T' + endTime + ':00.000Z').valueOf() / 1000
    })
  }, [startDate, endDate, startTime, endTime, allocation])

  const saveTime = async () => {
    let allocation
    // first we check if an allocation event already exists
    const existingEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.allocation').catch(() => {})
    if (existingEvent) {
      allocation = existingEvent
      allocation.version = '1.1'
      // if it does and also already has a temporal key we push to the existing array.
      if (existingEvent.temporal) allocation.temporal.push(temporalObject)
      // otherwise we create a new array
      else allocation.temporal = [temporalObject]
    } else {
      // if no allocation event exists we create a new object
      allocation = {
        version: '1.1',
        temporal: [
          temporalObject
        ]
      }
    }
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.allocation', allocation).catch(console.log)
    setIsUIVisible(false)
    reloadSpace()
  }

  const TimeSlots = ({ start, end }) => {
    const startToDate = new Date(start * 1000)
    startToDate.setHours(startToDate.getHours() - 2) // convert to Berlin Timezone

    const startUnixToRealWorld = startToDate.toLocaleString(i18n.language, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

    const endToDate = new Date(end * 1000)
    endToDate.setHours(endToDate.getHours() - 2) // convert to Berlin Timezone
    const endUnixToRealWorld = endToDate.toLocaleString(i18n.language, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

    return (
      <li>{startUnixToRealWorld} – {endUnixToRealWorld}</li>
    )
  }
  return (
    <section className="time">
      <h3>{t('Time')}</h3>
      <p>{t('Mark the exact time of your event with a start and end time.')}</p>
      {allocation?.temporal && (
        <ul className="times">
          {allocation.temporal.map((date, index) => <TimeSlots key={index + date.start} start={date.start} end={date.end} />
          )}
        </ul>
      )}
      {!isUIVisible && <button onClick={() => setIsUIVisible(true)}>{t('add date')}</button>}
      {isUIVisible && (
        <>
          <div className="timedate">
            <label htmlFor="time">{t('Start')}:</label>
            <div>
              <input type="date" id="start-date" min="2022-07-22" max="2022-07-24" name="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="time" id="start-time" name="start-time" onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="timedate">
            <label htmlFor="time">{t('End')}:</label>
            <div>
              <input type="date" id="end-date" name="end-date" min={startDate || '2022-07-22'} max="2022-07-24" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <input type="time" id="end-time" name="end-time" onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="confirmation">
            <SimpleButton cancel onClick={() => setIsUIVisible(false)}>CANCEL</SimpleButton>
            <LoadingSpinnerButton disabled={!startDate || !endDate || new Date(startDate + 'T' + startTime + '.000Z').valueOf() - new Date(endDate + 'T' + endTime + '.000Z').valueOf() > 0} onClick={saveTime}>{t('Save')}</LoadingSpinnerButton>
          </div>

        </>
      )}
    </section>
  )
};
