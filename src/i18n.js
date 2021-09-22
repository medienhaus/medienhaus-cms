import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// eslint-disable-next-line import/no-webpack-loader-syntax
const resBundle = require(
  'i18next-resource-store-loader!./assets/locales/index.js'
)

let lng
if (localStorage.getItem('cr_lang') !== null) {
  lng = localStorage.getItem('cr_lang')
} else {
  lng = 'en'
}

i18n
  // connect with React
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources: resBundle,
    debug: false,
    lng,
    nsSeparator: false,
    keySeparator: false,
    fallbackLng: false,
    whitelist: ['en', 'de'],
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false
    }
  })

export default i18n
