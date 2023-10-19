// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'

import { ModalInstance, ModalVisibility } from 'store/display/displayTypes'
import { selectAllModals } from 'store/display/displaySelectors'
import { reduce } from 'lodash'
import { ArrowsAltOutlined, ExpandOutlined } from '@ant-design/icons'
import { alterModalVisibility } from 'store/display/displaySlice'
import styles from './styles/MinimizedModalManager.scss'

type MinimizedModal = {
  modal: ModalInstance
  idx: number
}

const MinimizedModalManager = () => {
  const dispatch = useReduxDispatch()

  // Array of only modals that are minimized
  const modals = reduce(
    useSelector(selectAllModals),
    (memo: MinimizedModal[], modal, idx) => {
      if (modal.visibility === ModalVisibility.Minimized) memo.push({ modal, idx })
      return memo
    },
    [],
  )

  const expandModal = (minimizedModal: MinimizedModal) => {
    dispatch(
      alterModalVisibility({
        idx: minimizedModal.idx,
        title: minimizedModal.modal.title || '',
        visibility: ModalVisibility.Visible,
      }),
    )
  }

  return (
    <div className={styles.minimizedModalContainer}>
      {modals.map(m => (
        <div
          className="minimized-modal-tab"
          key={m.idx}
          onClick={() => expandModal(m)}
          role="button"
          tabIndex={0}
          onKeyPress={() => expandModal(m)}
        >
          {m.modal.title}
          <ArrowsAltOutlined />
        </div>
      ))}
    </div>
  )
}
export default MinimizedModalManager
