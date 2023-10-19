// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { handleSuccess } from 'components/administrator'
import { WrappedFormControl } from 'components/common/FormItems'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { TimeCardLineItemCreate, TimeCardLineItemList } from 'components/tutoring/TimeCard'
import React from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'

type Props = {
  pk: number
}
/**
 * Component renders LineItem form. Used in TimeCardModal.
 * pk is timeCardPK
 */
export const TimeCardLineItemForm = ({ pk }: Props) => {
  const dispatch = useReduxDispatch()
  const timeCard = useSelector((state: RootState) => state.tutoring.timeCards[pk])
  return (
    <div className={styles.containerForm}>
      <TimeCardLineItemCreate pk={pk} />
      <TimeCardLineItemList pk={pk} lineItems={timeCard?.line_items} />
      <WrappedFormControl
        cancelText="Back"
        okText="Confirm Line Items"
        onSubmit={() => {
          dispatch(closeModal())
          handleSuccess('Record updated!')
        }}
      />
    </div>
  )
}
