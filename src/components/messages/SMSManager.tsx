// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { UserAddOutlined } from '@ant-design/icons'
import { Button, message, Switch } from 'antd'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import {
  createConversation,
  createConversationParticipant,
  deleteConversationParticipant,
  fetchConversationParticipants,
} from 'store/message/messageThunks'
import {
  Conversation,
  ConversationParticipant,
  ConversationSpecification,
  ConversationType,
} from 'store/message/messageTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { UserType } from 'store/user/usersTypes'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import WisernetSection, { WisernetSectionContrast } from 'components/common/UI/WisernetSection'
import styles from './styles/SMSManager.scss'
import { NotificationRecipient } from '../../store/notification/notificationsTypes'
import { updateNotificationRecipient } from '../../store/notification/notificationsThunks'

interface OwnProps {
  // We can show this component for a student or a counselor. That student or counselor
  // is specified here
  student?: number
  counselor?: number
}

const SMSManager = (props: OwnProps) => {
  const dispatch = useReduxDispatch()

  // Some loading variables
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [loadingCoConversation, setLoadingCoConversation] = useState(false)
  const [loadingTuConversation, setLoadingTuConversation] = useState(false)

  const { student, counselor, conversationParticipants, notificationRecipient } = useSelector((state: RootState) => {
    // We get student/counselor using props or - if not provided, active user
    if (props.student || props.counselor) {
      return {
        student: props.student ? state.user.students[props.student] : null,
        counselor: props.counselor ? state.user.students[props.counselor] : null,
      }
    }
    if (state.user.activeUser?.userType === UserType.Student) {
      const student = state.user.students[state.user.activeUser.cwUserID]
      return {
        student,
        counselor: null,
        conversationParticipants: _.filter(
          _.values(state.message.conversationParticipants),
          p => p.conversation_student === state.user.activeUser?.cwUserID,
        ),
        notificationRecipient: state.notification.notificationRecipients[student.notification_recipient],
      }
    }
    if (state.user.activeUser?.userType === UserType.Counselor) {
      const counselor = state.user.counselors[state.user.activeUser.cwUserID]
      return {
        counselor,
        student: null,
        conversationParticipants: _.filter(
          _.values(state.message.conversationParticipants),
          p => p.conversation_type === ConversationType.Counselor,
        ),
        notificationRecipient: state.notification.notificationRecipients[counselor.notification_recipient],
      }
    }
    return { student: null, counselor: null, notificationRecipient: null }
  }, shallowEqual)

  // Load conversation participants on render
  let userID: number | null = null
  let notificationRecipientID: number | null = null
  if (student) {
    userID = student.user_id
    notificationRecipientID = student.notification_recipient
  } else if (counselor) {
    userID = counselor.user_id
    notificationRecipientID = counselor.notification_recipient
  }
  useEffect(() => {
    if (userID) {
      setLoadingParticipants(true)
      dispatch(fetchConversationParticipants(userID)).finally(() => setLoadingParticipants(false))
    }
    if (notificationRecipientID && !notificationRecipient) {
      dispatch(fetchNotificationRecipient(notificationRecipientID))
    }
  }, [dispatch, notificationRecipient, notificationRecipientID, userID])

  /** Returns conversationParticipant matching parameters
   */
  const getConversation = (student: number, conversationType: ConversationType) => {
    const conversation = _.find(
      conversationParticipants,
      p => p.conversation_student === student && p.conversation_type === conversationType && p.phone_number,
    ) as ConversationParticipant
    return conversation || null
  }

  /** Create a new conversation */
  const createParticipant = async (conversationSpecification: ConversationSpecification) => {
    if (conversationSpecification.conversationType === ConversationType.Counselor) {
      setLoadingCoConversation(true)
    } else if (conversationSpecification.conversationType === ConversationType.Tutor) {
      setLoadingTuConversation(true)
    } else {
      throw new Error('Attempting to create unsupported conversation type')
    }
    try {
      const conversation: Conversation = await dispatch(createConversation(conversationSpecification))
      await dispatch(createConversationParticipant(conversation.pk, student ? student.user_id : counselor?.user_id))
    } catch (err) {
      message.error('Failed to create conversation')
    } finally {
      setLoadingTuConversation(false)
      setLoadingCoConversation(false)
    }
  }

  const deleteParticipant = async (pk: number) => {
    try {
      const participant = _.find(conversationParticipants, p => p.pk === pk)
      if (participant?.conversation_type === ConversationType.Counselor) {
        setLoadingCoConversation(true)
      } else {
        setLoadingTuConversation(true)
      }
      await dispatch(deleteConversationParticipant(pk))
      setLoadingCoConversation(false)
      setLoadingTuConversation(false)
    } catch (err) {
      message.error('Failed to delete conversation')
      setLoadingCoConversation(false)
      setLoadingTuConversation(false)
    }
  }

  /** Render switches for student (counselor and tutor conversations only) */
  const renderStudentOptions = () => {
    if (!student) {
      return null
    }
    const tutorConversation = getConversation(student.pk, ConversationType.Tutor)
    const counselorConversation = getConversation(student.pk, ConversationType.Counselor)
    return (
      <>
        <div className="toggle-group">
          <Switch
            checked={Boolean(tutorConversation?.active)}
            loading={loadingTuConversation}
            onClick={() =>
              tutorConversation?.active
                ? deleteParticipant(tutorConversation.pk)
                : createParticipant({ student: student.pk, conversationType: ConversationType.Tutor })
            }
          />
          I would like to text with my tutors
          {tutorConversation?.active && (
            <div className="contact-card-container">
              <Button
                type="primary"
                target="_blank"
                href={`/message/conversation-participants/${tutorConversation.pk}/vcard`}
              >
                <UserAddOutlined />
                Save Tutors&apos; Contact Card
              </Button>
            </div>
          )}
        </div>
        <div className="toggle-group">
          <Switch
            checked={Boolean(counselorConversation?.active)}
            loading={loadingCoConversation}
            onClick={() =>
              counselorConversation?.active
                ? deleteParticipant(counselorConversation.pk)
                : createParticipant({ student: student.pk, conversationType: ConversationType.Counselor })
            }
          />
          I would like to text with my counselor ({student.counselor_name})
          {counselorConversation?.active && (
            <div className="contact-card-container">
              <Button
                type="primary"
                target="_blank"
                href={`/message/conversation-participants/${counselorConversation.pk}/vcard`}
              >
                <UserAddOutlined />
                Save {student.counselor_name}&apos;s Contact Card
              </Button>
            </div>
          )}
        </div>
      </>
    )
  }

  const handleAllTextChange = (checked: boolean) => {
    if (checked) {
      dispatch(
        updateNotificationRecipient(notificationRecipientID as number, {
          unsubscribed_text_notifications: (notificationRecipient as NotificationRecipient)
            ?.unsubscribable_notifications,
        }),
      )
    } else {
      dispatch(updateNotificationRecipient(notificationRecipientID as number, { unsubscribed_text_notifications: [] }))
    }
  }

  return (
    <WisernetSection contrast={WisernetSectionContrast.Low} title="Text Message Settings">
      <div className={styles.smsManager}>
        <div className="toggle-group">
          <Switch onChange={handleAllTextChange} />
          Disable all text messages (do not text me!)
        </div>
        {student &&
          notificationRecipient?.phone_number_is_confirmed &&
          notificationRecipient.phone_number &&
          renderStudentOptions()}
      </div>
    </WisernetSection>
  )
}

export default SMSManager
