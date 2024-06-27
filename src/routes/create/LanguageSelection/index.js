import ISO6391 from 'iso-639-1'
import config from '../../../config.json'
import SimpleButton from '../../../components/medienhausUI/simpleButton'
import { languageUtils } from '../utils/languageUtils'
import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import Matrix from '../../../Matrix'

const Wrapper = styled.section`
  display: grid;
  grid-gap: var(--margin);
  grid-auto-flow: row;

  /* unset margin-top for each direct child element directly following a previous one */
  & > * + * {
    margin-top: unset;
  }
`

const LanguageCancelConfirm = styled.div`
  display: flex;
  gap: var(--margin);
`

const LanguageSectionAdd = styled.div`
  display: grid;
  grid-gap: var(--margin);
  grid-auto-flow: row;
`
const LanguageSectionSelect = styled.div`
  display: flex;
  gap: var(--margin);
  
  > button {
  width: calc(var(--margin) * 2.5);
}
`
/**
 * LanguageSelectionComponent is a React component for language selection.
 *
 * @param {boolean} addingAdditionalLanguage - Whether additional language is being added.
 * @param {Function} setContentLang - Function to set the content language.
 * @param {Function} setDescription - Function to set the description.
 * @param {Array} languages - Array of languages.
 * @param {Function} setAddingAdditionalLanguage - Function to set whether additional language is being added.
 * @param {Function} inviteCollaborators - Function to invite collaborators.
 * @param {string} projectSpace - The project space.
 * @param {Function} setLanguages - Function to set the languages.
 * @returns {JSX.Element} The rendered component.
 */

const LanguageSelection = ({
  addingAdditionalLanguage,
  setContentLang,
  setDescription,
  languages,
  setAddingAdditionalLanguage,
  inviteCollaborators,
  projectSpace,
  setLanguages
}) => {
  const [newLang, setNewLang] = useState('')
  const { t } = useTranslation('create')
  const matrixClient = Matrix.getMatrixClient()

  return (
    <Wrapper className="request">
      <LanguageSectionSelect>
        <select
          disabled={addingAdditionalLanguage}
          onChange={(e) => {
            setContentLang(e.target.value)
            setDescription()
          }}
        >
          {languages.map((lang) => (
            <option value={lang} key={lang}>
              {ISO6391.getName(lang)}
            </option>
          ))}
        </select>
        {config.medienhaus?.customLanguages && (
          <SimpleButton
            value="languageUtils"
            key="lang"
            disabled={addingAdditionalLanguage}
            onClick={() => {
              if (!addingAdditionalLanguage) {
                setAddingAdditionalLanguage(true)
              }
            }}
          >
            +
          </SimpleButton>
        )}
      </LanguageSectionSelect>
      <LanguageSectionAdd>
        {config.medienhaus?.customLanguages && (
          <>
            {addingAdditionalLanguage && (
              <select
                onChange={(e) => setNewLang(e.target.value)}
                value={newLang || ''}
              >
                <option disabled value="">
                  {t('select language')}
                </option>
                {ISO6391.getAllNames().map((lang, i) => (
                  <option key={i} value={ISO6391.getCode(lang)}>
                    {lang}
                  </option>
                ))}
              </select>
            )}
            {addingAdditionalLanguage && (
              <LanguageCancelConfirm>
                <SimpleButton
                  cancel
                  onClick={() => {
                    setAddingAdditionalLanguage(false)
                    setNewLang('')
                  }}
                >
                  {t('CANCEL')}
                </SimpleButton>
                <SimpleButton
                  value="languageUtils"
                  key="lang"
                  onClick={() => {
                    if (
                      addingAdditionalLanguage &&
                                            newLang?.length > 0
                    ) {
                      languageUtils(matrixClient, inviteCollaborators, projectSpace, languages, newLang, setNewLang, setLanguages, setAddingAdditionalLanguage)
                    }
                  }}
                >
                  {t('Add')}
                </SimpleButton>
              </LanguageCancelConfirm>
            )}
          </>
        )}
      </LanguageSectionAdd>
    </Wrapper>
  )
}
export default LanguageSelection
