// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'
import { Icon } from 'antd'

import styles from './styles/BulletinsPage.scss'

type Props = {}

const BulletinsPage = ({}: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const {} = useSelector((state: RootState) => {
    return {}
  }, shallowEqual)

  useEffect(() => {
    setLoading(true)
  }, [dispatch])
  return <div className={styles.BulletinsPage} />
}
export default BulletinsPage
