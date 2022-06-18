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

export function LeaveContext ({ disableButton, parent, loading, callback }) {
  const [checkbox, setCheckbox] = useState(false)
  const { t } = useTranslation('moderate')
  return (
    <section>
      <RemoveCheckbox>
        <label htmlFor="checkbox">{t('I am sure I want to irreversibly leave this context.')}</label>
        <input id="checkbox" name="checkbox" type="checkbox" checked={checkbox} onChange={() => setCheckbox(checkbox => !checkbox)} />
      </RemoveCheckbox>
      <div>❗️{t('You will not be able to moderate this context anymore unless you are invited by another moderator of the context. If you are the only or last member of this context, the context will be deleted after leaving.')}</div>
      <button type="submit" disabled={disableButton || !checkbox} onClick={e => callback(e, parent)}>{loading ? <Loading /> : t('Leave context')}</button>
    </section>
  )
}

export default LeaveContext
