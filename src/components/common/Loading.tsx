import React from 'react'
import _ from 'lodash'

import styles from './styles/Loading.scss'

type Props = {
  message?: string
}

const Loading = ({ message = '' }: Props) => {
  return (
    <div className={styles.loading}>
      <div className={styles.animate}>
        <img src="/static/cwcommon/common_app.png" alt="Collegewise" />
      </div>
      {message && <p className="center">{message}</p>}
    </div>
  )
}
export default Loading
