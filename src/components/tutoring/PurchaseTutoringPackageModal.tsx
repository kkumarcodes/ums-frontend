// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import Confetti from 'react-confetti'

import { selectVisiblePurchaseTutoringPackageModal, selectActiveModal } from 'store/display/displaySelectors'
import { PurchaseTutoringPackageModalProps } from 'store/display/displayTypes'
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import { Button, message, Modal } from 'antd'
import { closeModal } from 'store/display/displaySlice'
import styles from './styles/PurchaseTutoringPackageModal.scss'
import PurchaseIndividualTutoringPackage from './PurchaseIndividualTutoringPackage'
import PurchaseCourse from './PurchaseCourse'

const CONFETTI_DURATION = 5000

enum PurchaseType {
  Individual = 'individual',
  Group = 'group',
}

const PurchaseTutoringPackageModal = () => {
  const dispatch = useReduxDispatch()
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<PurchaseType>()
  const [showConfetti, setShowConfetti] = useState(false)

  const visible = useSelector(selectVisiblePurchaseTutoringPackageModal)
  const props = useSelector(selectActiveModal)?.modalProps as PurchaseTutoringPackageModalProps

  // Reset selected purchase type on modal open
  useEffect(() => {
    if (visible) {
      setSelectedPurchaseType(undefined)
    }
  }, [visible])

  /** Show confetti for 5 seconds */
  const doShowConfetti = () => {
    message.success('Purchase complete')
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), CONFETTI_DURATION)
  }

  const selectType = (
    <div className="select-type">
      <p className="instructions">What product would you like to purchase?</p>
      <p>
        <Button type="primary" size="large" onClick={() => setSelectedPurchaseType(PurchaseType.Individual)}>
          <UserOutlined />
          Individual Tutoring Hours
        </Button>
      </p>
      <p>
        <Button type="primary" size="large" onClick={() => setSelectedPurchaseType(PurchaseType.Group)}>
          <UserOutlined />
          Tutoring Class
        </Button>
      </p>
    </div>
  )

  const footer = (
    <div className="footer">
      {selectedPurchaseType && (
        <Button type="default" onClick={_ => setSelectedPurchaseType(undefined)}>
          <ArrowLeftOutlined />
          Back
        </Button>
      )}
    </div>
  )

  return (
    <>
      {showConfetti && <Confetti />}
      <Modal
        footer={footer}
        onCancel={() => dispatch(closeModal())}
        visible={visible}
        className={styles.purchaseTutoringPackageModal}
      >
        {!selectedPurchaseType && selectType}
        {selectedPurchaseType === PurchaseType.Individual && visible && (
          <PurchaseIndividualTutoringPackage onPurchase={doShowConfetti} studentID={props.studentID} />
        )}
        {selectedPurchaseType === PurchaseType.Group && visible && (
          <PurchaseCourse onPurchase={doShowConfetti} studentID={props.studentID} />
        )}
      </Modal>
    </>
  )
}
export default PurchaseTutoringPackageModal
