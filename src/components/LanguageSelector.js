import i18n from 'i18next'
import React from 'react'

const LanguageSelector = () => {
  const changeLanguage = event => {
    const languageCode = event.target.value
    localStorage.setItem('cr_lang', languageCode)
    i18n.changeLanguage(languageCode)
  }

  return (
    <select className="languageSelector" defaultValue={i18n.language} onChange={changeLanguage}>
      <option value="en">EN</option>
      <option value="de">DE</option>
    </select>
  )
}

export default LanguageSelector
