// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Select } from 'antd'
import { getFullName } from 'components/administrator'
import ChatConversation from 'components/messages/ChatConversation'
import styles from 'components/messages/styles/ChatConversation.scss'
import { keys } from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { ConversationType } from 'store/message/messageTypes'
import { getStudents, selectStudents } from 'store/user/usersSelector'

const { Option } = Select
export const ChatConversationAdminPage = () => {
  const students = useSelector(getStudents)
  const studentsValues = useSelector(selectStudents)
  const [selectedStudent, setSelectedStudent] = useState<number>()
  const [selectedConversationType, setSelectedConversationType] = useState<ConversationType>()

  return (
    <section className={styles.pageChatConversationAdmin}>
      <h2>Student Conversations</h2>
      <div className={styles.selectChatConversation}>
        <label htmlFor="selectStudent">Student:</label>
        <Select
          id="selectStudent"
          autoFocus
          showSearch
          placeholder="Search for a student"
          optionFilterProp="children"
          className={styles.selectStudent}
          onChange={(value: number) => setSelectedStudent(value)} // TS dislikes implicit invocation
          loading={!studentsValues.length}
        >
          {studentsValues.map(student => (
            <Option key={student.pk} value={student.pk}>
              {getFullName(student)}
            </Option>
          ))}
        </Select>
        <label htmlFor="selectConversationType">Conversation:</label>
        <Select
          id="selectConversationType"
          placeholder="Select conversation type"
          className={styles.selectConversationType}
          onChange={(value: ConversationType) => setSelectedConversationType(value)} // TS dislikes implicit invocation
        >
          {keys(ConversationType).map(ele => (
            <Option key={ele} value={ConversationType[ele as keyof typeof ConversationType]}>
              {ele}
            </Option>
          ))}
        </Select>
      </div>
      <div className={styles.chatConversationContainer}>
        {selectedStudent && selectedConversationType ? (
          <ChatConversation
            readOnly
            authorName={getFullName(students[selectedStudent])}
            conversation={{ student: selectedStudent, conversationType: selectedConversationType }}
          />
        ) : (
          <div>
            <img
              alt="waiting"
              src="/static/cwcommon/chatConversationWaiting.png"
              className="chat-conversation-waiting-png"
            />
            <h3 className="center">Select Student and Conversation to View...</h3>
          </div>
        )}
      </div>
    </section>
  )
}
export default ChatConversationAdminPage
