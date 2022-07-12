import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import TextareaAutosize from 'react-textarea-autosize'
import { useTranslation } from 'react-i18next'

const TextareaMaxLength = styled.section`
  border-color: var(--color-fg);
  border-radius: unset;
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);

  & > textarea {
    border: unset;
    resize: none;
  }

  & > .maxlength {
    margin-top: unset;
    padding: calc(var(--margin) * 0.4);
  }
`

function TextareaAutoSizeMaxLength ({ description: incomingDescription, onSaveDescription, maxLength = 500 }) {
  const [description, setDescription] = useState(incomingDescription)
  const { t } = useTranslation('moderate')

  useEffect(() => {
    let cancelled = false

    if (!cancelled) setDescription(incomingDescription)
    return () => {
      cancelled = true
    }
  }, [incomingDescription])

  return (
    <TextareaMaxLength>
      <TextareaAutosize minRows={6} placeholder={`${t('Please add a short description.')}`} value={description} onChange={e => setDescription(e.target.value)} onBlur={() => onSaveDescription(description)} />
      <div className="maxlength">
        <span>{description.length + '/' + maxLength}</span>
      </div>
    </TextareaMaxLength>
  )
}
export default TextareaAutoSizeMaxLength
