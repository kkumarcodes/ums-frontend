// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Modal from 'antd/lib/modal/Modal'
import styles from 'components/common/styles/HamburgerMenu.scss'
import DisplayResourceCategories from 'components/student/DisplayResourceCategories'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleHamburgerMenuModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { selectIsStudent, selectIsParent, selectIsTutor, selectIsCounselor } from 'store/user/usersSelector'
import { NavLink } from 'react-router-dom'

// TODO: Should I refactor this to be a dropdown instead of a modal?

/**
 * Component serves as sidebar replacement (HamburgerMenu Dropdown) tablet-down viewports for all platforms
 */
export const HamburgerMenuModal = () => {
  const dispatch = useReduxDispatch()

  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const isTutor = useSelector(selectIsTutor)
  const isCounselor = useSelector(selectIsCounselor)
  const visible = useSelector(selectVisibleHamburgerMenuModal)

  const handleModalClose = () => {
    dispatch(closeModal())
  }

  const handleEscape = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.which === 27) {
      handleModalClose()
    }
  }

  return (
    <Modal
      wrapClassName="modal-hamburger-menu"
      className={styles.hamburgerMenuModal}
      visible={visible}
      onCancel={handleModalClose}
      footer={null}
      destroyOnClose={true}
    >
      <div
        className={styles.hamburgerMenuList}
        onClick={handleModalClose}
        onKeyDown={handleEscape}
        tabIndex={0}
        role="menu"
      >
        {(isStudent || isParent) && <DisplayResourceCategories />}
        {isTutor && (
          <>
            <NavLink exact to="/">
              Students
            </NavLink>
            <NavLink to="/sessions/">Sessions</NavLink>
            <NavLink to="/availability/">Availability</NavLink>
            <NavLink to="/time-cards/">Time Card</NavLink>
          </>
        )}
        {isCounselor && (
          <>
            <NavLink exact to="/">
              CAS Students
            </NavLink>
          </>
        )}
      </div>
    </Modal>
  )
}
