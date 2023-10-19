// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useState } from 'react'
import { ConversationSpecification } from 'store/message/messageTypes'
import { UserType } from 'store/user/usersTypes'
import ChatConversation from './ChatConversation'
import ChatConversationList from './ChatConversationList'
import styles from './styles/ChatApplication.scss'

interface OwnProps {
  studentID?: number
  tutorID?: number
  counselorID?: number
  parentID?: number
}

const ChatApplication = (props: OwnProps) => {
  const [activeConversation, setActiveConversation] = useState<ConversationSpecification | null>(null)

  // Figure out what type of user we're dealing with
  let userType: UserType
  let cwUserID: number
  if (props.studentID) {
    userType = UserType.Student
    cwUserID = props.studentID
  } else if (props.counselorID) {
    userType = UserType.Counselor
    cwUserID = props.counselorID
  } else if (props.parentID) {
    userType = UserType.Parent
    cwUserID = props.parentID
  } else if (props.tutorID) {
    userType = UserType.Tutor
    cwUserID = props.tutorID
  } else {
    return (
      <div className={styles.chatApplication}>
        <p className="center">Invalid user for chat</p>
      </div>
    )
  }
  return (
    <>
      <h2 className="center">Messages</h2>
      <div className="app-white-container">
        <div className={styles.chatApplication}>
          <div className="conversation-list-container">
            <ChatConversationList
              cwUserID={cwUserID}
              userType={userType}
              onSelectConversation={setActiveConversation}
              selectedConversation={activeConversation}
            />
          </div>
          <div className="conversation-container">
            {activeConversation && (
              <ChatConversation
                key={`${activeConversation.conversationType}${activeConversation.parent}${activeConversation.student}`}
                conversation={activeConversation}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatApplication
