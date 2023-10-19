// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CloseOutlined, ShrinkOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import React from 'react'
import { alterModalVisibility, closeModal } from 'store/display/displaySlice'
import { ModalVisibility } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import styles from './styles/MinimizeModalTitle.scss'

type Props = {
  onMinimize?: () => void
  title: string
}

const MinimizeModalTitle = ({ onMinimize, title }: Props) => {
  const dispatch = useReduxDispatch()

  const doMinimize = () => {
    if (onMinimize) {
      onMinimize()
    } else {
      dispatch(alterModalVisibility({ visibility: ModalVisibility.Minimized, title }))
    }
  }

  return (
    <div className={styles.minimizeModalTitle}>
      <h3 className="w100">{title}</h3>
      <div className="icons">
        <Tooltip title="Minimize">
          <Button type="link" onClick={doMinimize}>
            <ShrinkOutlined />
          </Button>
        </Tooltip>
        <Button type="link" onClick={e => dispatch(closeModal())}>
          <CloseOutlined />
        </Button>
      </div>
    </div>
  )
}
export default MinimizeModalTitle
