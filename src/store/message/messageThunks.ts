// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import errorHandler from 'store/errorHandler'
import { ConversationParticipant, ConversationSpecification } from 'store/message/messageTypes'
import { RootState } from 'store/rootReducer'
import {
  addConversation,
  addConversationParticipant,
  addConversationParticipants,
  removeConversationParticipant,
} from './messageSlice'

const CONVERSATION_ENDPOINT = '/message/conversations/'
const CHAT_TOKEN_ENDPOINT = '/message/chat-token/'
const CONVERSATION_PARTICIPANT_ENDPOINT = (userID?: number) =>
  userID ? `/message/conversation-participants/?user=${userID}` : '/message/conversation-participants/'

const CP_LAST_READ_ENDPOINT = (pk: number) => `/message/conversation-participants/${pk}/update-last-read/`
const DELETE_CONVERSATION_PARTICIPANT_ENDPOINT = (pk: number | string) => `/message/conversation-participants/${pk}`

/** Little function to update conversation participant last read. Updates conversation participant in store */
export const updateConversationParticipantLastRead = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: ConversationParticipant } = await API.post(CP_LAST_READ_ENDPOINT(pk))
    dispatch(addConversationParticipant(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const fetchConversation = (specification: ConversationSpecification) => async (dispatch: Dispatch) => {
  // We can pass specification as query params, but need to make conversationType -> conversation_type
  const { conversationType } = specification
  const params = { ...specification, conversation_type: conversationType }
  delete params.conversationType

  try {
    const { data } = await API.get(CONVERSATION_ENDPOINT, { params })
    // Flatten data. Replace participants with list of PKs
    data.participants.forEach((p: ConversationParticipant) => dispatch(addConversationParticipant(p)))
    data.participants = data.participants.map((p: ConversationParticipant) => p.pk)
    return dispatch(addConversation(data))
  } catch (err) {
    // We don't log 404s here, because we expect them :)
    return errorHandler(err)
  }
}

/**
 * Get a twilio chat token that can be used to engage in a conversation via web chat
 * @param conversationID {number} PK of Conversation object to join
 * NOTE THAT THIS IS NOT ACTUALLY A THUNK, AND WILL RETURN TOKEN. THIS DOES NOT ACTUALLY
 * INTERACT WITH STORE
 */

export type TokenPayload = {
  token: string
  participant_id: string
}
export const fetchChatToken = async (conversationID: number) => {
  try {
    const { data }: { data: TokenPayload } = await API.post(CHAT_TOKEN_ENDPOINT, { conversation: conversationID })
    return data
  } catch (e) {
    return errorHandler(e)
  }
}

/**
 * Create a new Conversation
 * @param conversation {ConversationSpecification}
 */
export const createConversation = (conversation: ConversationSpecification) => async (dispatch: Dispatch) => {
  const { conversationType } = conversation
  const postData = { ...conversation, conversation_type: conversationType }
  delete postData.conversationType

  try {
    const { data } = await API.post(CONVERSATION_ENDPOINT, postData)
    await dispatch(addConversation(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Retrieve conversation participants. NOT stored in store
 */
export const fetchConversationParticipants = (userID?: number) => async (
  dispatch: Dispatch,
  getState: () => RootState,
) => {
  try {
    // We have to remove all conversations for our conversation recipient. Active conversations will get replaced
    // with result of fetch
    const notificationRecipient = Object.values(getState().notification.notificationRecipients).find(
      nr => nr.user === (userID || getState().user.activeUser?.userID),
    )
    if (notificationRecipient) {
      Object.values(getState().message.conversationParticipants)
        .filter(cp => cp.notification_recipient === notificationRecipient.pk)
        .forEach(cp => dispatch(removeConversationParticipant(cp.pk)))
    }
    const response = await API.get(CONVERSATION_PARTICIPANT_ENDPOINT(userID))
    const participants: ConversationParticipant[] = response.data
    dispatch(addConversationParticipants(participants))
    return participants
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Attempt to create a new !SMS! participant. For chat participants use fetchChatToken
 */
export const createConversationParticipant = (conversation: number, user?: number) => async (dispatch: Dispatch) => {
  try {
    const data = { conversation, user }
    const response = await API.post(CONVERSATION_PARTICIPANT_ENDPOINT(), data)
    const newParticipant: ConversationParticipant = response.data
    dispatch(addConversationParticipant(newParticipant))
    return newParticipant
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Kinda self-explanatory but just so we're on the same page:
 * This thunk deletes a conversationParticipant. If associated with a twilio participant,
 * that twilio participant will also get deleted
 */
export const deleteConversationParticipant = (conversationParticipant: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.delete(DELETE_CONVERSATION_PARTICIPANT_ENDPOINT(conversationParticipant))
    dispatch(removeConversationParticipant(conversationParticipant))
    return response.data
  } catch (err) {
    return errorHandler(err)
  }
}
