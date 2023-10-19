// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchNotificationRecipient, updateNotificationRecipient } from 'store/notification/notificationsThunks'
import { Input, Button, message } from 'antd'
import { fetchConversationParticipants } from 'store/message/messageThunks'
import styles from './styles/UpdatePhone.scss'

type UpdatePhoneProps = {
  notificationRecipientID: number
}

const UpdatePhone = ({ notificationRecipientID }: UpdatePhoneProps) => {
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const dispatch = useReduxDispatch()

  const notificationRecipient = useSelector((state: RootState) => {
    return state.notification.notificationRecipients[notificationRecipientID]
  })

  const recipientPhone = notificationRecipient?.phone_number

  // Mask to only allow entering numbers
  const maskInput = (val: string) => {
    val = val.replace(/\D/g, '')
    val = val.replace('-', '')
    setPhone(val)
  }

  useEffect(() => {
    if (recipientPhone) {
      setPhone(recipientPhone.slice(-10))
    }
  }, [recipientPhone])

  useEffect(() => {
    if (!notificationRecipient) {
      dispatch(fetchNotificationRecipient(notificationRecipientID))
    }
  }, [dispatch, notificationRecipient, notificationRecipientID])

  const submit = () => {
    if (phone.length === 10 || phone.length === 0) {
      setLoading(true)
      dispatch(updateNotificationRecipient(notificationRecipientID, { phone_number: phone ? `1${phone}` : '' }))
        .catch(() => message.error('Failed to save phone number'))
        .then(() => {
          message.success('Phone number saved!')
          // We have to update conversation participants so we don't display stale conversations!
          dispatch(fetchConversationParticipants(notificationRecipient.user))
        })
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className={styles.updatePhone}>
      <p>
        <label>Update phone number (enter numbers only):</label>
      </p>
      <div>
        <Input
          maxLength={10}
          type="number"
          minLength={10}
          addonBefore="+1"
          value={phone}
          onChange={e => maskInput(e.target.value)}
        />
        <Button type="primary" onClick={submit} loading={loading}>
          Save
        </Button>
      </div>
    </div>
  )
}

export default UpdatePhone
