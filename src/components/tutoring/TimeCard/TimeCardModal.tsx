// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Modal from 'antd/lib/modal/Modal'
import { TimeCardApprovalForm, TimeCardForm, TimeCardLineItemForm } from 'components/tutoring/TimeCard'
import { useShallowSelector } from 'libs'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveModal, selectVisibleTimeCardModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { TimeCardModalProps } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'

export enum Views {
  TimeCard = 'timeCard',
  LineItem = 'lineItem',
  Approval = 'approval',
}
/**
 * Component renders TimeCard modal. Manages active form view (TimeCardForm or LineItemForm)
 */
export const TimeCardModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleTimeCardModal)
  const props = useSelector(selectActiveModal)?.modalProps as TimeCardModalProps
  // pk = timeCardPK
  const pk = props?.pk
  const tutorID = props?.tutorID
  const adminID = props?.adminID

  const timeCard = useShallowSelector((state: RootState) => (pk ? state.tutoring.timeCards[pk] : null))
  const tutor = useShallowSelector((state: RootState) => (timeCard ? state.user.tutors[timeCard.tutor] : null))

  const [activeView, setActiveView] = useState(pk ? Views.LineItem : Views.TimeCard)

  useEffect(() => {
    if (tutorID || adminID) {
      return setActiveView(Views.Approval)
    }

    if (pk) {
      return setActiveView(Views.LineItem)
    }
    return setActiveView(Views.TimeCard)
  }, [adminID, pk, tutorID])

  const handleCancel = () => {
    dispatch(closeModal())
  }

  const renderTitle = () => {
    if (Views.TimeCard === activeView) {
      return `${pk ? 'Edit' : 'Create'} Time Card ${tutor ? `for ${tutor.first_name}` : ''}`
    }
    if (Views.Approval === activeView) {
      return 'Approve Time Card'
    }
    if (Views.LineItem === activeView) {
      return 'Create New Line Item'
    }
    throw new Error('Unknown activeView')
  }

  return (
    <Modal
      wrapClassName="containerModal"
      title={renderTitle()}
      width={Views.LineItem === activeView ? 750 : 520}
      style={{ top: 16 }}
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose={true}
    >
      {Views.TimeCard === activeView && <TimeCardForm pk={pk as number} setActiveView={setActiveView} />}
      {Views.LineItem === activeView && <TimeCardLineItemForm pk={pk as number} />}
      {Views.Approval === activeView && <TimeCardApprovalForm pk={pk as number} tutorID={tutorID} adminID={adminID} />}
    </Modal>
  )
}
