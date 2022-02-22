import React from 'react'
import LanguageSelector from '../LanguageSelector'
import { useAuth } from '../../Auth'

const Footer = () => {
  const auth = useAuth()

  return (
    <footer>
      <p className="copyleft">&#x1f12f; {new Date().getFullYear()} <a href="https://medienhaus.dev" rel="nofollow noopener noreferrer" target="_blank"><strong>medienhaus/</strong></a></p>
      {!auth.user && <LanguageSelector />}
    </footer>
  )
}

export default Footer
