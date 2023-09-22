// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from "react";
import {
  Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import { createBrowserHistory } from "history";
import { Provider } from "react-redux";
import store from "./store/store";
import LoginApp from './apps/login/Main'
import Admin from './apps/administrator/App'
import Tutor from './apps/tutor/App'
import Student from './apps/student/TutoringApp'
import Parent from './apps/parent/ParentApp'
import Landing from './apps/landing/Landing'
import CounselorApp from './apps/counseling/CounselorApp'
import Diagnostic from './apps/diagnostic/Diagnostic'

import './style/common/global.scss'
import './App.scss';
import 'antd/dist/antd.css';

export const PublicRoute = ({ component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) => (
        React.createElement(component, props)
      )}
    />
  );
};

export const history = createBrowserHistory()
function App() {

  return (
    <Provider store={store}>
      <Router history={history}>
        {/* A <Switch> looks through its children <Route>s and
					renders the first one that matches the current URL. */}
        <Switch>
          <PublicRoute path="/user/platform/student" component={Student}/>
          <PublicRoute path="/user/platform/parent" component={Parent}/>
          <PublicRoute path="/login" component={LoginApp}/>
          <PublicRoute path="/user/platform/admin" component={Admin}/>
          <PublicRoute path="/user/platform/tutor" component={Tutor}/>
          <PublicRoute path="/user/platform/landing" component={Landing}/>
          <PublicRoute path="/user/platform/counseling" component={CounselorApp}/>
          <PublicRoute path="/user/platform/diagnostic" component={Diagnostic}/>

          <Route path="/404" exact>
            <div />
          </Route>
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
