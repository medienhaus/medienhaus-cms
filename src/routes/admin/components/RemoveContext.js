import React, { useState } from 'react'
import { Loading } from '../../../components/loading'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

const RemoveCheckbox = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: var(--margin);
  align-items: center;
  justify-content: space-between;
`

export function RemoveContext (props) {
  const [checkbox, setCheckbox] = useState(false)
  const { t } = useTranslation('moderate')
  return (
    <>
      <h3>⚠️&nbsp;&nbsp;DANGER ZONE&nbsp;‼️</h3>
      <RemoveCheckbox>
        <label htmlFor="checkbox">{t('I am sure I want to irreversibly delete this context.')}</label>
        <input id="checkbox" name="checkbox" type="checkbox" checked={checkbox} onChange={() => setCheckbox(checkbox => !checkbox)} />
      </RemoveCheckbox>
      <button type="submit" disabled={props.disableButton || !checkbox} onClick={e => props.callback(e, props.parent, false)}>{props.loading ? <Loading /> : props.t('Delete context')}</button>
    </>
  )
}

export default RemoveContext
