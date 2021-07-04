import React from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from 'react-router-dom'
// import { Link } from 'react-router-dom'
// import './App.css';
import './assets/css/index.css'
import Header from './components/header'
import Footer from './components/footer'
import Nav from './components/nav'
import { Loading } from './components/loading'

import Landing from './routes/landing'
import Login from './routes/login'
import Tools from './routes/tools'
import Profile from './routes/profile'
import Submit from './routes/submit'
import Moderation from './routes/moderation'

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
    return <Redirect
      to={{
        pathname: '/login',
        state: { from: location }
      }}
    />
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
        <Router>
          <Header />
          <main>
            <Switch>
              <Route path="/" exact component={Landing} />
              <Route path="/login" component={Login} />
              <PrivateRoute path="/tools" component={Tools} />
              <PrivateRoute path="/profile" component={Profile} />
              <PrivateRoute path="/submit/:spaceId" component={Submit} />
              <PrivateRoute path="/submit" component={Submit} />
              <PrivateRoute path="/moderation" component={Moderation} />
            </Switch>
          </main>
          <Nav />
          <Footer />
        </Router>
      </AuthProvider>
    </>
  )
}

export default App
