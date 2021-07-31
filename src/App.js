import React from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from 'react-router-dom'
import config from './config.json'

import './assets/css/index.css'
import Footer from './components/footer'
import Nav from './components/nav'
import { Loading } from './components/loading'

import Landing from './routes/landing'
import Login from './routes/login'
import Boilerplate from './routes/boilerplate'
import Content from './routes/projects'
import Create from './routes/create'
import Moderation from './routes/moderation'
import Support from './routes/support'
import Feedback from './routes/feedback'
import Terms from './routes/terms'
import Account from './routes/account'
import Pages from './routes/pages'

import { AuthProvider, useAuth } from './Auth'
import PropTypes from 'prop-types'
function PrivateRoute ({ children, ...rest }) {
  const auth = useAuth()
  const location = useLocation()

  // Still loading...
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
  // Consent not given to terms

  if (!localStorage.getItem('terms-consent')) {
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

PrivateRoute.propTypes = {
  children: PropTypes.element
}

function App () {
  return (
    <>
      <AuthProvider>
        <Router basename="/rundgang">
          <Nav />
          <main>
            <Switch>
              <Route path="/" exact component={Landing} />
              <Route path="/login" component={Login} />
              <Route path="/terms" component={Terms} />

              <PrivateRoute path="/create/:spaceId" component={Create} />
              <PrivateRoute path="/create" component={Create} />
              <PrivateRoute path="/boilerplate" component={Boilerplate} />
              <PrivateRoute path="/moderation" component={Moderation} />
              {config.function.content && <PrivateRoute path="/content" component={Content} />}
              {config.function.pages && <PrivateRoute path="/pages" component={Pages} />}

              <PrivateRoute path="/account" component={Account} />
              <PrivateRoute path="/feedback" component={Feedback} />
              <PrivateRoute path="/support" component={Support} />
            </Switch>
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </>
  )
}

export default App
