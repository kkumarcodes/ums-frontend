// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { find, values } from 'lodash'
import { getActiveNotificationRecipient } from 'store/notification/notificationsSelector'
import { RootState } from 'store/rootReducer'
import { Conversation, ConversationType } from './messageTypes'

const getConversations = (state: RootState) => state.message.conversations
const getConversationParticipants = (state: RootState) => state.message.conversationParticipants

export const getActiveConversationParticipants = (state: RootState) => {
  const notificationRecipient = getActiveNotificationRecipient(state)
  return Object.values(state.message.conversationParticipants).filter(
    cp => cp.notification_recipient === notificationRecipient?.pk,
  )
}
export const selectActiveConversationParticipants = createSelector(getActiveConversationParticipants, x => x)

export const selectConversation = (conversationType: ConversationType, student?: number, parent?: number) =>
  createSelector(getConversations, conversations => {
    const searchParams: Partial<Conversation> = {
      conversation_type: conversationType,
    }
    if (student) searchParams.student = student
    if (parent) searchParams.parent = parent
    return find(values(conversations), searchParams)
  })

export const selectConversationParticipantByTwilioID = (participant_id?: string) =>
  createSelector(getConversationParticipants, participants => find(values(participants), { participant_id }))

export const selectConversationParticipantsForConversation = (conversation?: number) =>
  createSelector(getConversationParticipants, participants =>
    values(participants).filter(p => p.conversation === conversation),
  )
