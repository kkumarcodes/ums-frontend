// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import moment from 'moment-timezone'
import { Button, Form, Input, Spin } from 'antd'
import { FormInstance } from 'antd/lib/form'
import axios from 'store/api'
import React from 'react'
import styles from './styles/LoginForm.scss'

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN'

const TOKEN_URL = `/token/`
const LOGIN_URL = `/user/login/`
const REGISTER_URL = `/user/register/`

declare const registerUUID: string
declare const registerEmail: string

export type LoginResponse = {
  redirectURL: string
  userID: string
  userType: string
  registering: boolean
}

type LoginFormProps = {
  onSuccess: (response: LoginResponse) => void
}

class LoginForm extends React.Component<LoginFormProps> {
  state = {
    error: '',
    loading: false,
    registering: Boolean(window.registerUUID),
    registerEmail: window.registerEmail,
    registerUUID: window.registerUUID
  }

  formRef = React.createRef<FormInstance>()

  componentDidMount() {
    console.log(moment.tz.guess(), window.version)
    if (this.state.registering) {
      this.formRef?.current?.setFieldsValue({ username: this.state.registerEmail })
    }
  }

  onSubmit = async () => {
    this.setState({ loading: true })
    try {
      let response = await axios.post(TOKEN_URL, {
        username: this.formRef?.current?.getFieldValue('username'),
        password: this.formRef?.current?.getFieldValue('password'),
      })

      localStorage.clear();
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      response = await axios.post(LOGIN_URL, {
        username: this.formRef?.current?.getFieldValue('username'),
        password: this.formRef?.current?.getFieldValue('password'),
      })

      this.setState({ loading: false })
      this.props.onSuccess({ ...response.data, registering: this.state.registering })
    } catch (err) {
      if (err.response) {
        this.setState({
          loading: false,
          error: err.response.data.detail,
        })
      }
    }
  }

  /**
   * Attempt to login using a demo account. Just pass that account's username
   * @param username
   */
  demoLogin = async (username: string) => {
    this.setState({ loading: true })
    try {
      const response = await axios.post(LOGIN_URL, { demo_account: username })
      this.setState({ loading: false })
      this.props.onSuccess(response.data)
    } catch (err) {
      if (err.response) {
        this.setState({
          loading: false,
          error: err.response.data.detail,
        })
      }
    }
  }

  renderDemoButtons() {
    if (!['dev', 'staging'].includes(window.env)) {
      return null
    }

    return (
      <div className="demo-buttons">
        <label>Login using demo account:</label>
        <br />
        <Button type="primary" onClick={() => this.demoLogin('admin')} loading={this.state.loading}>
          Admin
        </Button>
        <Button type="primary" onClick={() => this.demoLogin('tutor')} loading={this.state.loading}>
          Tutor
        </Button>
        <Button type="primary" onClick={() => this.demoLogin('student')} loading={this.state.loading}>
          Student
        </Button>
        <Button type="primary" onClick={() => this.demoLogin('counselor')} loading={this.state.loading}>
          Counselor
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className={styles.loginForm}>
        <Form layout="horizontal" colon={false} ref={this.formRef} onFinish={this.onSubmit}>
          <h2 className="center">{this.state.registering ? 'Register' : 'Log In'}</h2>
          <div className="logo">
            <img src="/static/cwcommon/common_app.png" alt="Collegewise" />
            <h2>University Management System</h2>
          </div>
          {this.state.registering && (
            <p className="center">
              Almost there! Just enter in a password below to finish creating your account. Then click “Register”.
            </p>
          )}
          <Form.Item label="Username (email)" name="username">
            <Input disabled={this.state.registering} placeholder="username" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password placeholder="password" />
          </Form.Item>
          <div className="right">
            {this.state.error ? <p className="center error">{this.state.error}</p> : ''}
            <Form.Item>
              {this.state.loading ? (
                <Spin />
              ) : (
                <Button type="primary" htmlType="submit">
                  {this.state.registering ? 'Register >' : 'Log In >'}
                </Button>
              )}
              <br /> <br />
              <a href="/accounts/password_reset/">Reset Password</a>
            </Form.Item>
          </div>
        </Form>
        {this.renderDemoButtons()}
      </div>
    )
  }
}

export default LoginForm
