// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import LoginForm, { LoginResponse } from 'components/login/LoginForm'

import React from 'react'

import 'style/login/style.scss'



const initialState = {
  username: '',
  password: '',
}

type State = Readonly<typeof initialState>

class LoginApp extends React.Component<object, State> {
  // We bind login form to local state
  state: State = initialState

  loginSuccess = (response: LoginResponse) => {
    // If redirect URL was specified, we use it!
    console.log(response, '==response==')
    if (window.location.search.includes('?redirect') && window.location.search.includes('upload')) {
      const urlparams = new URLSearchParams(window.location.search)
      window.open(urlparams.get('redirect'))
    }
    let url = `${response.redirectURL}${window.location.search}`
    if (response.registering) {
      url += window.location.search ? '&welcomeModal=true' : '?welcomeModal=true'
    }
    localStorage.setItem('cwuser_pk', response.userID);
    localStorage.setItem('user_pk', response.userID);
    localStorage.setItem('cwuser_type', response.userType);
    window.location.href = url

  }

  render() {
    return (
      <div className="login-container">
        <LoginForm onSuccess={this.loginSuccess} />
      </div>
    )
  }
}

export default LoginApp;
