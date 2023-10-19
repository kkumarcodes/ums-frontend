// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createBrowserHistory } from 'history'

const history = createBrowserHistory()
history.listen(location => {
  if (window.ga) {
    window.ga('set', 'page', location.pathname + location.hash)
    window.ga('send', 'pageview')
  }
})

export default history
