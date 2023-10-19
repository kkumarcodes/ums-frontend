// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'

import { Button, message, Skeleton } from 'antd'
import _ from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
// import { useSelector } from 'react-redux'
// import {
//   selectConversation,
//   selectConversationParticipantByTwilioID,
//   selectConversationParticipantsForConversation,
// } from 'store/message/messageSelector'
// import { addConversationParticipant } from 'store/message/messageSlice'
// import { createConversation, fetchChatToken, fetchConversation, TokenPayload } from 'store/message/messageThunks'
import { ConversationSpecification, ConversationType } from 'store/message/messageTypes'
// import { useReduxDispatch } from 'store/store'
// import { selectIsCounselor, selectStudent } from 'store/user/usersSelector'
// import { Client as ChatClient } from 'twilio-chat'
// import { Channel } from 'twilio-chat/lib/channel'
// import { Client as TwilioClient } from 'twilio-chat/lib/client'
// import { Message } from 'twilio-chat/lib/message'
// import ChatBubble, { Direction } from './ChatBubble'
// import InputForm from './ChatConversationInputForm'
import styles from './styles/ChatConversation.scss'

interface OwnProps {
  // All the information we need to find or create a unique conversation
  conversation: ConversationSpecification
  readOnly?: boolean
  authorName?: string
}

const ChatConversation = (props: OwnProps) => {
  // const dispatch = useReduxDispatch()

  // // Whether or not we've attempted to fetch conversation
  // const [fetchedConversation, setFetchedConversation] = useState(false)
  // const [chatToken, setChatToken] = useState('')
  // const [participantID, setParticipantID] = useState('')
  // // Variables that hold our loading state
  // const [loadingConversation, setLoadingConversation] = useState(false)
  // const [loadingToken, setLoadingToken] = useState(false)

  // const [messageList, setMessageList] = useState<Message[]>([])
  // const [channel, setChannel] = useState<Channel | null>(null)
  // const [twilioStatus, setTwilioStatus] = useState('')
  // const isCounselor = useSelector(selectIsCounselor)
  // /**
  //  * Callback to add a new message to our messagelist, and scroll that message into view
  //  */
  // const addMessage = useCallback(
  //   (message: Message) => {
  //     if (!_.some(messageList, m => m.sid === message.sid)) {
  //       setMessageList([...messageList, message])
  //       // Scroll to show new message
  //       document.querySelector('#chatBubblesContainer').scrollTop = document.querySelector(
  //         '#chatBubblesContainer>div:last-child',
  //       )?.offsetTop
  //     }
  //   },
  //   [messageList],
  // )

  // useEffect(() => {
  //   if (channel) {
  //     // channel.off('messageAdded', addMessage)
  //     channel.on('messageAdded', addMessage)
  //   }
  //   return () => {
  //     if (channel) {
  //       channel.removeAllListeners('messageAdded')
  //     }
  //   }
  // }, [addMessage, channel])

  // /**
  //  * conversation {Conversation} current conversation
  //  * participantMap { [phone_number: string]: Display Name of Sender } Dictionary of participants in this
  //  *  conversation
  //  */
  // const conversation = useSelector(
  //   selectConversation(props.conversation.conversationType, props.conversation.student, props.conversation.parent),
  // )
  // const participant = useSelector(selectConversationParticipantByTwilioID(participantID))
  // const conversationParticipants = useSelector(selectConversationParticipantsForConversation(conversation?.pk))
  // const conversationStudent = useSelector(selectStudent(conversation?.student))

  // const phoneNumberMap: { [phone_number: string]: string } = {}
  // let studentHasPhone = false
  // conversationParticipants.forEach(p => {
  //   // TODO: Add additional (secondary/old phone numbers from conversation participant's NotificationRecipient)
  //   if (p.phone_number) {
  //     phoneNumberMap[p.phone_number] = p.display_name
  //     if (conversationStudent && p.notification_recipient === conversationStudent.notification_recipient) {
  //       studentHasPhone = true
  //     }
  //   }
  // })

  // /**
  //  * Create our chat client, and subscribe to events for joining a channel
  //  * @param token Twilio web chat token from fetchChatToken thunk
  //  */
  // const initChat = useCallback(
  //   async (token: string) => {
  //     // chatClient = ChatClient
  //     const twilioClient: TwilioClient = await ChatClient.create(token, {
  //       logLevel: 'info',
  //     })
  //     twilioClient.on('tokenAboutToExpire', async () => {
  //       const token: TokenPayload = await fetchChatToken(conversation?.pk)
  //       twilioClient.updateToken(token.token)
  //     })

  //     twilioClient.on('tokenExpired', async () => {
  //       message.error({
  //         content: (
  //           <span>
  //             Chat session has expired! Please&nbsp;
  //             <Button type="link" className="slim-btn red" onClick={() => window.location.reload()}>
  //               refresh browser
  //             </Button>
  //             &nbsp;to reset connection.
  //           </span>
  //         ),
  //         duration: 0,
  //       })
  //     })
  //     twilioClient.on('connectionStateChanged', setTwilioStatus)
  //     twilioClient.on('channelJoined', (channel: Channel) => {
  //       if (channel.sid === conversation?.conversation_id) {
  //         setChannel(channel)
  //       }
  //     })
  //     twilioClient.on('channelLeft', (channel: Channel) => {
  //       if (channel.sid === conversation?.conversation_id) {
  //         setChannel(null)
  //       }
  //     })
  //   },
  //   [conversation],
  // )

  // // Attempt to load conversation when props change.
  // useEffect(() => {
  //   setFetchedConversation(false)
  //   setLoadingConversation(true)
  //   // Attempt to fetch conversation
  //   dispatch(fetchConversation(props.conversation)).finally(() => {
  //     setFetchedConversation(true)
  //     setLoadingConversation(false)
  //   })
  //   // Important to NOT just be dependent on props.conversation because that obj can change
  //   // even if none of its values do
  // }, [dispatch, props.conversation.student, props.conversation.conversationType]) // eslint-disable-line react-hooks/exhaustive-deps

  // const getChatToken = useCallback(async () => {
  //   setLoadingToken(true)
  //   try {
  //     if (!conversation?.pk) return
  //     const tokenPayload = await fetchChatToken(conversation.pk)

  //     if (!tokenPayload) {
  //       return
  //     }
  //     setChatToken(tokenPayload.token)
  //     setParticipantID(tokenPayload.participant_id)
  //     // Note we DON'T unset loading token until after client initiates
  //     initChat(tokenPayload.token)
  //     // .then(() => setLoadingToken(false)) // Hack to prevent old conversation from popping up
  //   } catch {
  //     setLoadingToken(false)
  //   }
  // }, [conversation?.pk, dispatch, initChat]) // eslint-disable-line react-hooks/exhaustive-deps

  // // Obtain chat token when conversation changes
  // useEffect(() => {
  //   if (conversation) {
  //     getChatToken()
  //   }
  // }, [getChatToken, conversation])

  // // When participant changes, we can assume we're reading our messages
  // useEffect(() => {
  //   // Update unread messages on our chat participant
  //   if (participant) {
  //     dispatch(addConversationParticipant({ ...participant, has_unread_messages: false }))
  //   }
  // }, [participant?.pk]) // eslint-disable-line react-hooks/exhaustive-deps

  // const fetchMessages = useCallback(async () => {
  //   if (!channel) {
  //     return
  //   }

  //   setLoadingConversation(true)
  //   setLoadingToken(false) // this prevents showing old conversation after new token found but not yet loaded new conversation
  //   const response = await channel.getMessages(100)
  //   setMessageList(response.items)
  //   setLoadingConversation(false)
  //   // Scroll to show all messages
  //   document.querySelector('#chatBubblesContainer').scrollTop = document.querySelector(
  //     '#chatBubblesContainer>div:last-child',
  //   )?.offsetTop
  // }, [channel])

  // // Obtain messages when we get a new channel
  // useEffect(() => {
  //   fetchMessages()
  // }, [fetchMessages])

  // /**
  //  * Send a brand new message! Twilio adds message to channel
  //  * @param messageText
  //  */
  // const sendMessage = (messageText: string) => {
  //   channel
  //     ?.sendMessage(messageText)
  //     .catch(_ =>
  //       message.error(
  //         'Unable to send message because connection to messaging service has timed out. Please refresh to send your message.',
  //       ),
  //     )
  // }

  // /**
  //  * Create conversation, based on our props' conversation specification
  //  */
  // const newConversation = () => {
  //   if (conversation) {
  //     throw new Error('Cannot create a conversation because we have one!')
  //   }
  //   setLoadingConversation(true)
  //   dispatch(createConversation(props.conversation))
  //     .catch(e => {
  //       message.error('Unable to start conversation 🤔')
  //     })
  //     .finally(() => setLoadingConversation(false))
  // }

  // // Four render scenarios
  // // 1) We get to render our chat!
  // if (conversation && chatToken && !loadingConversation && !loadingToken) {
  //   // One does not simply load chat conversations!
  //   return (
  //     <div className={styles.chatConversation}>
  //       <div className="chat-bubbles-container" id="chatBubblesContainer">
  //         {/* {(!messageList?.length || loadingConversation || loadingToken) && <h2>Loading ...</h2>} */}
  //         {messageList.map(message => {
  //           /**
  //            * Seem a little complex? That's because messages sent from a student via SMS and messages
  //            * sent from same student via web chat are technically sent from different conversation participants
  //            * (and only the messages sent from web chat will match participantID).
  //            * Sooo we need to check against both participantID and notification_recipient
  //            * Also note that while it shouldn't happen, we need to be tolerant to
  //            * memberSIDs not defined in participantMap
  //            */
  //           let mine =
  //             message.memberSid === participantID ||
  //             (participant?.phone_number && message.author.includes(participant.phone_number))
  //           // Attempt to get identity of sender based on participant ID
  //           const authorName = message.author in phoneNumberMap ? phoneNumberMap[message.author] : message.author

  //           mine = authorName === participant?.display_name || authorName === props.authorName || mine

  //           return (
  //             <ChatBubble
  //               key={message.sid}
  //               direction={mine ? Direction.incoming : Direction.outgoing}
  //               message={message}
  //               author={authorName}
  //             />
  //           )
  //         })}
  //       </div>
  //       {!props.readOnly && (
  //         <div className="input-form-container">
  //           <InputForm onSendMessage={sendMessage} />
  //         </div>
  //       )}
  //       {isCounselor && conversation.conversation_type !== ConversationType.CounselorTutor && (
  //         <div className="student-sms-container">
  //           Student will {studentHasPhone ? '' : 'NOT'} receive messages as text messages
  //         </div>
  //       )}
  //       {!props.readOnly && (
  //         <div className="status-container">
  //           {conversation ? '✅' : '🚫'} conversation {conversation.pk} &bull; Chat Service: {twilioStatus}
  //         </div>
  //       )}
  //     </div>
  //   )
  // }
  // if (loadingConversation || loadingToken) {
  //   // 2) Loading conversation and/or token
  //   return (
  //     <div className={styles.chatConversation}>
  //       {loadingConversation && <p className="center">Loading conversation...</p>}
  //       {loadingToken && <p className="center">Connecting to chat...</p>}
  //       <Skeleton />
  //     </div>
  //   )
  // }
  // if (fetchedConversation) {
  //   // 3) No conversation - can create one
  //   return (
  //     <div className={styles.chatConversation}>
  //       {!props.readOnly ? (
  //         <p className="center start-conversation-container">
  //           <Button onClick={newConversation} className="action-button primary">
  //             <PlusCircleOutlined />
  //             &nbsp; Start Conversation...
  //           </Button>
  //         </p>
  //       ) : (
  //         // 4) No conversation - console snoopy admin with slick svg
  //         <div className={styles.chatConversationContainer}>
  //           <img className="not-found-png" src="/static/cwcommon/notFound.png" alt="not found" />
  //           <h3 className="center">Conversation Not Found</h3>
  //         </div>
  //       )}
  //     </div>
  //   )
  // }
  // 4) Error
  return (
    <div className={styles.chatConversation}>
      <p>An error has occurred - cannot determine conversation</p>
    </div>
  )
}

export default ChatConversation
