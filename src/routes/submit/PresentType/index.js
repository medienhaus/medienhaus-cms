import React, { useEffect, useState } from 'react'
import Matrix from '../../../Matrix'
import { useTranslation } from 'react-i18next'

const PresentType = ({ presentValue, projectSpace, callback }) => {
  const [presentTypeValue, setPresentTypeValue] = useState(presentValue)
  const [changingPresentType, setChangingPresentType] = useState(false)
  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()

  useEffect(() => {
    setPresentTypeValue(presentValue)
  }, [presentValue])

  const changePresentType = async (e) => {
    setChangingPresentType(true)
    e.preventDefault()
    setPresentTypeValue(e.target.value)
    const content = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
    content.present = e.target.value
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', content)
    callback(content)
    setChangingPresentType(false)
  }

  return (
    <>
      <p>{t('Need some text for this; wording of section is also not final; how about something along "Format", "Verortung", …')}</p>
      <select value={presentTypeValue} disabled={changingPresentType} onChange={(e) => changePresentType(e)}>
        <option value="analog">Analog</option>
        <option value="digital">Digital</option>
        <option value="hybrid">Hybrid</option>
      </select>
    </>
  )
}
export default PresentType
