import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import SimpleButton from '../../../components/medienhausUI/simpleButton'
import Matrix from '../../../Matrix'
import config from '../../../config.json'
import styled from 'styled-components'
import DeleteButton from '../components/DeleteButton'

const RemovableLiElement = styled.li`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: space-between;
  list-style: none;
  height: 2rem;
  margin-bottom: calc(var(--margin) / 2);
`
export default function Time ({ allocation, projectSpace, reloadSpace }) {
  const [isUIVisible, setIsUIVisible] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('00:00')
  const [temporalObject, setTemporalObject] = useState({})
  const { t } = useTranslation('content')
  const matrixClient = Matrix.getMatrixClient()

  useEffect(() => {
    let cancled = false
    if (!cancled) {
      setTemporalObject({
        app: process.env.REACT_APP_APP_NAME,
        start: new Date(startDate + 'T' + startTime + ':00.000Z').valueOf() / 1000,
        end: new Date(endDate + 'T' + endTime + ':00.000Z').valueOf() / 1000
      })
    }
    return () => {
      cancled = true
    }
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

  const deleteTime = async (index) => {
    // first we grab the allocation event from the server
    console.log(index)
    const existingEvent = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.allocation').catch(() => { })
    // then we remove the selected index
    existingEvent.temporal.splice(index, 1)
    // and send the new event to the server
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.allocation', existingEvent).catch(console.log)
    reloadSpace()
  }

  const TimeSlots = ({ index, start, end }) => {
    const startToDate = new Date(start * 1000)
    const startUnixToRealWorld = startToDate.toLocaleString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

    const endToDate = new Date(end * 1000)
    const endUnixToRealWorld = endToDate.toLocaleString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

    return (
      <RemovableLiElement key={index}>
        <span>{startUnixToRealWorld} – {endUnixToRealWorld}</span>
        <DeleteButton height="2rem" width="2rem" onDelete={() => deleteTime(index)} />
      </RemovableLiElement>
    )
  }
  return (
    <section className="time">
      <h3>{t('Time')}</h3>
      {allocation?.temporal && allocation?.temporal.length > 0 && (
        <ol>
          {allocation.temporal.map((date, index) => <TimeSlots key={index} index={index} start={date.start} end={date.end} />
          )}
        </ol>
      )}
      {!isUIVisible && <button onClick={() => setIsUIVisible(true)}>{t('add date')}</button>}
      {isUIVisible && (
        <>
          <div className="timedate">
            <label htmlFor="time">{t('Start')}:</label>
            <div>
              <input type="date" id="start-date" name="start-date" min={config.medienhaus?.item?.event?.dates?.min ? config.medienhaus.item.event.dates.min : ''} max={config.medienhaus?.item?.event?.dates?.max ? config.medienhaus.item.event.dates.max : ''} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input type="time" id="start-time" name="start-time" onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="timedate">
            <label htmlFor="time">{t('End')}:</label>
            <div>
              <input type="date" id="end-date" name="end-date" min={startDate || (config.medienhaus?.item?.event?.dates?.min ? config.medienhaus.item.event.dates.min : '')} max={config.medienhaus?.item?.event?.dates?.max ? config.medienhaus.item.event.dates.max : ''} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <input type="time" id="end-time" name="end-time" onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="confirmation">
            <SimpleButton cancel onClick={() => setIsUIVisible(false)}>CANCEL</SimpleButton>
            <LoadingSpinnerButton disabled={!startDate || !endDate || new Date(startDate + 'T' + startTime + ':00.000Z').valueOf() - new Date(endDate + 'T' + endTime + ':00.000Z').valueOf() > 0} onClick={saveTime}>{t('Save')}</LoadingSpinnerButton>
          </div>

        </>
      )}
    </section>
  )
};
