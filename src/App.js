import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from 'react-router-dom'

import './assets/css/index.css'
import Footer from './components/footer'
import Nav from './components/nav'
import { Loading } from './components/loading'

import Landing from './routes/landing'
import Login from './routes/login'
import Boilerplate from './routes/boilerplate'
import Projects from './routes/projects'
import Create from './routes/create'
import Moderation from './routes/moderation'
import Support from './routes/support'
import Feedback from './routes/feedback'
import Credits from './routes/credits'
import Terms from './routes/terms'
import Account from './routes/account'
// import Request from './routes/request'
import Preview from './routes/preview'

import { AuthProvider, useAuth } from './Auth'
import PropTypes from 'prop-types'
import { makeRequest } from './Backend'
function PrivateRoute ({ children, ...rest }) {
  const auth = useAuth()
  const location = useLocation()

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(process.env.NODE_ENV === 'development' ? true : null)

  useEffect(() => {
    makeRequest('rundgang/terms', null, 'GET').then(({ hasAcceptedTerms }) => {
      setHasAcceptedTerms(hasAcceptedTerms)
    })
  })

  // Still loading information...
  if (auth.user === null || hasAcceptedTerms === null) {
    return <Loading />
  }

  // Not logged in
  if (auth.user === false) {
    return (
      <Redirect
        to={{
          pathname: '/login',
          state: { from: location }
        }}
      />
    )
  }

  // Consent not given to terms
  if (!hasAcceptedTerms) {
    return (
      <Redirect
        to={{
          pathname: '/terms',
          state: { from: location }
        }}
      />
    )
  }

  // Logged in - render our actual route components
  return (
    <Route {...rest}>{children}</Route>
  )
}

function ScrollToTop () {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

PrivateRoute.propTypes = {
  children: PropTypes.element
}

function App () {
  return (
    <>
      <AuthProvider>
        <Router basename="/rundgang">
          <ScrollToTop />
          <Nav />
          <main>
            <Switch>
              <Route path="/" exact component={Landing} />
              <Route path="/login" component={Login} />
              <Route path="/terms" component={Terms} />
              <PrivateRoute path="/account" component={Account} />
              <PrivateRoute path="/boilerplate" component={Boilerplate} />
              <PrivateRoute path="/projects" component={Projects} />
              <PrivateRoute path="/create/:spaceId" component={Create} />
              <PrivateRoute path="/preview/:spaceId" component={Preview} />
              <PrivateRoute path="/create" component={Create} />
              <PrivateRoute path="/moderation" component={Moderation} />
              <PrivateRoute path="/support" component={Support} />
              <PrivateRoute path="/feedback" component={Feedback} />
              {/* <PrivateRoute path="/request" component={Request} /> */}
              <PrivateRoute path="/credits" component={Credits} />
            </Switch>
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </>
  )
}

export default App
