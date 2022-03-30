import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from 'react-router-dom'

import './assets/css/index.css'
import Footer from './components/footer'
import Nav from './components/nav'
import { Loading } from './components/loading'

import Admin from './routes/admin'
import Landing from './routes/landing'
import Login from './routes/login'
import Boilerplate from './routes/boilerplate'
import Content from './routes/content'
import Create from './routes/create'
import Moderate from './routes/moderate'
import Support from './routes/support'
import Feedback from './routes/feedback'
import Credits from './routes/credits'
import Account from './routes/account'
import Request from './routes/request'
import Preview from './routes/preview'
import Pages from './routes/pages'

import { AuthProvider, useAuth } from './Auth'
import PropTypes from 'prop-types'

import config from './config.json'
function PrivateRoute ({ children, ...rest }) {
  const auth = useAuth()
  const location = useLocation()

  // Still loading information...
  if (auth.user === null) {
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
        <Router basename={process.env.REACT_APP_BASENAME}>
          <ScrollToTop />
          <Nav />
          <main>
            <Switch>
              <Route path="/" exact component={Landing} />
              <Route path="/login" component={Login} />
              {config.medienhaus?.sites?.account && <PrivateRoute path="/account" component={Account} />}
              <PrivateRoute path="/admin" component={Admin} />
              <PrivateRoute path="/boilerplate" component={Boilerplate} />
              <PrivateRoute path="/content" component={Content} />
              <PrivateRoute path="/create/:spaceId" component={Create} />
              <PrivateRoute path="/preview/:spaceId" component={Preview} />
              <PrivateRoute path="/create" component={Create} />
              {config.medienhaus?.sites?.moderate && <PrivateRoute path="/moderate" component={Moderate} />}
              {config.medienhaus?.sites?.support && <PrivateRoute path="/support" component={Support} />}
              {config.medienhaus?.sites?.feedback && <PrivateRoute path="/feedback" component={Feedback} />}
              {config.medienhaus?.sites?.request && <PrivateRoute path="/request" component={Request} />}
              {config.medienhaus?.sites?.credits && <PrivateRoute path="/credits" component={Credits} />}
              {config.medienhaus?.pages && <PrivateRoute path="/pages/:id" component={Pages} />}
            </Switch>
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </>
  )
}

export default App
