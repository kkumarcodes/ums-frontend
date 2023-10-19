// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckCircleFilled } from '@ant-design/icons'
import { Button, Input, message } from 'antd'
import React, { MouseEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  confirmPhoneNumber,
  fetchNotificationRecipient,
  resendVerification,
} from 'store/notification/notificationsThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'

type ConfirmPhoneProps = {
  notificationRecipientID: number
  setModalVisible: () => void
}
const ConfirmPhoneForm = ({ notificationRecipientID, setModalVisible }: ConfirmPhoneProps) => {
  const [value, setValue] = useState<number | null>(null)
  const [isError, setIsError] = useState(false)
  const [resend, setResend] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const dispatch = useReduxDispatch()

  const notificationRecipient = useSelector((state: RootState) => {
    return state.notification.notificationRecipients[notificationRecipientID]
  })

  // Load our recipient if needed
  const recipientExists = Boolean(notificationRecipient)
  useEffect(() => {
    if (!recipientExists) {
      dispatch(fetchNotificationRecipient(notificationRecipientID))
    }
  }, [dispatch, notificationRecipientID, recipientExists])

  const handleResend = (e: MouseEvent<HTMLButtonElement>) => {
    setResend(true)
    setIsError(false)
    setValue(null)
    dispatch(resendVerification(notificationRecipientID))
    setAttemptCount(0)
  }

  const handleConfirm = () => {
    setResend(false)
    if (attemptCount === 4) {
      setAttemptCount(0)
    } else {
      setAttemptCount(attemptCount + 1)
    }

    setIsError(false)

    if (value != null) {
      dispatch(confirmPhoneNumber(notificationRecipientID, value))
        .then(result => {
          setModalVisible()
        })
        .catch(err => {
          setIsError(true)
        })
        .finally(() => setValue(null))
    }
  }

  const overCount = (): boolean => {
    return attemptCount >= 3
  }

  if (notificationRecipient && notificationRecipient.phone_number && !notificationRecipient.phone_number_is_confirmed) {
    return (
      <div className="confirmation-container">
        <p>
          <label>Confirm your phone number. Enter the 5-digit confirmation code sent to your phone:</label>
        </p>
        {resend && <p>(Check your phone for a new confirmation number.)</p>}

        <form>
          <Input
            id="confCode"
            name="confCode"
            min={0}
            max={99999}
            type="number"
            value={value}
            required
            autoFocus
            onChange={e => setValue(Number(e.target.value))}
            style={{ width: '260px' }}
          />
          {overCount() && (
            <h3>
              It looks like you are having trouble. Click <strong>Resend Code</strong> to request a new code be sent to
              your phone.
            </h3>
          )}
          {isError && !overCount() && <h3>That is incorrect. Please try again.</h3>}
          <br />
          <br />
          <Button onClick={handleResend}>Resend Code</Button>
          &nbsp;&nbsp;
          <Button type="primary" onClick={handleConfirm} htmlType="button">
            Submit
          </Button>
        </form>
      </div>
    )
  }
  if (notificationRecipient && notificationRecipient.phone_number && notificationRecipient.phone_number_is_confirmed) {
    return (
      <div>
        <CheckCircleFilled />
        &nbsp; Phone number confirmed
      </div>
    )
  }
  return null
}

type Props = {
  notificationRecipientID: number | undefined
}
const ConfirmPhone = ({ notificationRecipientID }: Props) => {
  return (
    <>
      {notificationRecipientID && (
        <ConfirmPhoneForm
          notificationRecipientID={notificationRecipientID}
          setModalVisible={() => message.success('Phone number confirmed 👍🏾')}
        />
      )}
    </>
  )
}

export default ConfirmPhone
