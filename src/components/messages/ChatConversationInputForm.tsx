// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { MessageFilled } from '@ant-design/icons'
import { Button, Input } from 'antd'
import React, { useState } from 'react'
import styles from './styles/ChatConversationInputForm.scss'

interface OwnProps {
  onSendMessage: (message: string) => void
}

const ChatConversationInputForm = (props: OwnProps) => {
  const [message, setMessage] = useState('')

  const sendMessage = () => {
    if (message) {
      props.onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <div className={styles.chatConversationInputForm}>
      <Input.TextArea
        allowClear={true}
        onPressEnter={e => {
          e.preventDefault()
          sendMessage()
        }}
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <Button type="primary" disabled={!message.length} onClick={sendMessage}>
        Send
        <MessageFilled />
      </Button>
    </div>
  )
}

export default ChatConversationInputForm
