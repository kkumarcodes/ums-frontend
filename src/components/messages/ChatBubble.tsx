// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import moment from 'moment'
import React from 'react'
import { Message } from 'twilio-chat/lib/message'
import styles from './styles/ChatBubble.scss'

export enum Direction {
  outgoing,
  incoming,
}

type props = {
  direction: Direction
  message: Message
  author?: string | null // Will use message.author if not set
}

const ChatBubble = (props: props) => {
  const style = props.direction === Direction.incoming ? styles.chatBubbleIncoming : styles.chatBubbleOutgoing
  return (
    <div className={style}>
      <p className="message-bubble-inner">
        <span className="person">
          <strong>{props.author ? props.author : props.message.author}</strong>&nbsp;&nbsp;&nbsp;
          {moment(props.message.timestamp).fromNow()}
        </span>
        <span className="message">{props.message.body}</span>
      </p>
    </div>
  )
}

export default ChatBubble
