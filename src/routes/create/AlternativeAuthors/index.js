import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash'
import Matrix from '../../../Matrix'

const AlternativeAuthors = ({ projectSpace, defaultAuthors }) => {
  const [authors, setAuthors] = useState()

  const matrixClient = Matrix.getMatrixClient()
  const { t } = useTranslation()
  console.log(authors)

  useEffect(() => {
    defaultAuthors && setAuthors(defaultAuthors.toString())
  }, [defaultAuthors])

  useEffect(() => {
    if (!authors) return
    const putAlternativeAuthors = async () => {
      const content = await matrixClient.getStateEvent(projectSpace, 'dev.medienhaus.meta')
      if (authors.length > 0) content.alternativeAuthors = authors.split(',')
      else delete content.AlternativeAuthors

      console.log(content)
      const sendCredit = await matrixClient.sendStateEvent(projectSpace, 'dev.medienhaus.meta', content)
      console.log(sendCredit)
    }
    putAlternativeAuthors()
  }, [authors, matrixClient, projectSpace])

  return (
    <>
      <h3>{t('Alternative Authors')}</h3>
      <p>{t('If filled in, this will overwrite all contributors in the "Contributor" field. Credits will still be displayed normally.')}</p>
      <p>{t('Please seperate authors by commas.')}</p>
      <input
        defaultValue={authors}
        type="text" onChange={
                  debounce((e) => {
                    setAuthors(e.target.value)
                  }, 800)
}
      />
    </>

  )
}
export default AlternativeAuthors
