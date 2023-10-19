// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'
import { Button, Modal, Skeleton, message } from 'antd'
import { selectVisiblePaygoPurchaseModal, selectActiveModal } from 'store/display/displaySelectors'
import { PaygoPurchaseModalProps } from 'store/display/displayTypes'
import {
  fetchStudentTutoringSession,
  fetchPurchaseableTutoringPackages,
  magentoAPIPayment,
  updateStudentTutoringSession,
} from 'store/tutoring/tutoringThunks'
import { closeModal } from 'store/display/displaySlice'
import { CreditCardOutlined, CheckOutlined } from '@ant-design/icons'
import { selectIsAdmin } from 'store/user/usersSelector'
import moment from 'moment'
import styles from '../styles/PaygoPurchaseModal.scss'

const PaygoPurchaseModal = () => {
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisiblePaygoPurchaseModal)
  const props: PaygoPurchaseModalProps = useSelector(selectActiveModal)?.modalProps as PaygoPurchaseModalProps

  const packages = useSelector((state: RootState) => state.tutoring.tutoringPackages)
  const session = useSelector((state: RootState) =>
    props?.individualTutoringSessionID
      ? state.tutoring.studentTutoringSessions[props.individualTutoringSessionID]
      : null,
  )
  const student = useSelector((state: RootState) => (session ? state.user.students[session.student] : null))
  const packageToPurchase = session?.paygo_tutoring_package ? packages[session.paygo_tutoring_package] : null
  const isAdmin = useSelector(selectIsAdmin)

  const loadPackages = visible && !packageToPurchase && session?.student
  const loadSession = !session && props?.individualTutoringSessionID
  useEffect(() => {
    async function loadData() {
      if (loadPackages) {
        setLoading(true)
        await dispatch(fetchPurchaseableTutoringPackages(session.student))
      } else if (loadSession) {
        setLoading(true)
        await dispatch(fetchStudentTutoringSession(props.individualTutoringSessionID))
      }
      setLoading(false)
    }
    loadData()
  }, [dispatch, loadPackages, loadSession, props, session])

  const total = session
    ? Math.round((session.duration_minutes / 60) * (packageToPurchase?.price || 0) * 100) / 100
    : null

  // Event handler to execute payment via Magento API
  const executePayment = () => {
    setPaying(true)
    dispatch(magentoAPIPayment(props.individualTutoringSessionID))
      .then(() => {
        message.success('Transaction succeeded')
        dispatch(closeModal())
      })
      .catch(() => {
        message.error('Transaction failed')
      })
      .finally(() => setPaying(false))
  }

  // Mark a session paid without actually charging for it
  const markPaid = () => {
    if (!isAdmin) {
      return
    }
    setPaying(true)
    dispatch(
      updateStudentTutoringSession(props.individualTutoringSessionID, {
        paygo_transaction_id: `PAID: ${moment().toISOString()}`,
      }),
    )
      .then(() => {
        message.success('Session marked paid - NOT charged')
        dispatch(closeModal())
      })
      .catch(() => {
        message.error('Marking session as paid failed')
      })
      .finally(() => setPaying(false))
  }

  // Render controls/description for when we can execute payment via Magento API
  const renderAPIPayment = () => {
    return (
      <div className="content center">
        <Button className="pay-button" type="primary" onClick={executePayment} loading={paying}>
          <CreditCardOutlined />
          Pay for this session now
        </Button>
        {isAdmin && (
          <Button className="pay-button" type="primary" onClick={markPaid} loading={paying}>
            <CheckOutlined />
            Mark session paid without charging
          </Button>
        )}
        <p className="help">${total} will be charged to your card on file</p>
        <p>
          You have the option to pay for this session now. If you don't pay for this session before it occurs, you will
          automatically be charged upon its completion.
        </p>
        {isAdmin && (
          <p className="help">
            Package: {packageToPurchase?.pk} {packageToPurchase?.title}
          </p>
        )}
      </div>
    )
  }

  // Render controls/description for when we can execute payment via Magento Link
  const renderMagentoLinkPayment = () => {
    return (
      <div className="content center">
        {isAdmin && (
          <p>
            Family can pay via this link:{' '}
            <a href={packageToPurchase?.magento_purchase_link} target="_blank">
              {packageToPurchase?.magento_purchase_link}
            </a>
            <Button className="pay-button" type="primary" onClick={markPaid} loading={paying}>
              <CheckOutlined />
              Mark session paid without charging
            </Button>
          </p>
        )}
        {!isAdmin && (
          <>
            <Button
              className="pay-button"
              type="primary"
              href={packageToPurchase?.magento_purchase_link}
              target="_blank"
            >
              <CreditCardOutlined />
              Pay for this session now
            </Button>
            <p>
              You have the option to pay for this session now. You must pay for this session or purchase a package of
              hours before you can schedule another session.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <Modal
      className={styles.paygoPurchaseModal}
      visible={visible}
      cancelButtonProps={{ style: { display: 'none' } }}
      okText="Close"
      onCancel={() => dispatch(closeModal())}
      onOk={() => dispatch(closeModal())}
      confirmLoading={paying}
    >
      {loading && <Skeleton />}
      {!loading && student?.last_paygo_purchase_id && renderAPIPayment()}
      {!loading && !student?.last_paygo_purchase_id && renderMagentoLinkPayment()}
    </Modal>
  )
}

export default PaygoPurchaseModal
