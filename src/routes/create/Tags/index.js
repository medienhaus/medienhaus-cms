import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinnerButton from '../../../components/LoadingSpinnerButton'
import InputField from '../../../components/medienhausUI/inputField'
import Matrix from '../../../Matrix'
import styled from 'styled-components'
import TagListElement from './TagListElement'

const TagList = styled.ul`
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--margin) * 0.5);
`

const Tags = ({ projectSpace, name, type, placeholder }) => {
  const matrixClient = Matrix.getMatrixClient()
  const [value, setValue] = useState('')
  const [tags, setTags] = useState([])
  const [edit, setEdit] = useState(false)
  const { t } = useTranslation('content')

  const fetchRoomTags = useCallback(async () => {
    // fetching current room tags and creating an array from them
    const roomTags = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.tags')
    console.log(roomTags.tags)
    setTags(roomTags.tags)
  }, [matrixClient, projectSpace])

  useEffect(() => {
    let cancelled = false

    !cancelled && fetchRoomTags()

    return () => {
      cancelled = true
    }
  }, [fetchRoomTags])

  const onChange = async (e) => {
    setEdit(true)
    setValue(e.target.value)
  }

  const onSubmit = async () => {
    // we create an array with the tags from the input field, and add the old tags to it
    const tagArray = value.split(' ').concat(tags)
    console.log(tagArray)
    // then we remove any duplicates buy converting the erray to a Set and back to an array
    const unique = [...new Set(tagArray)]
    // then we add all tags to the room
    await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.tags', { tags: unique })
    setValue('')
    await fetchRoomTags()
    setEdit(false)
  }

  return (
    <>
      <p>{t('You can add multiple tags by separating them with a space.')}</p>
      {tags.length > 0 && <TagList>
        {tags.map((name) => <TagListElement key={name} tagName={name} projectSpace={projectSpace} tagArray={tags} callback={fetchRoomTags} />
        )}
      </TagList>}
      <InputField name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} />
      {edit &&
        <div className="confirmation">
          <button className="cancel" onClick={(e) => { e.preventDefault(); setEdit(false); setValue(tags.join(', ')) }}>{t('CANCEL')}</button>
          <LoadingSpinnerButton onClick={onSubmit}>{t('SAVE')}</LoadingSpinnerButton>
        </div>}
    </>
  )
}

export default Tags
