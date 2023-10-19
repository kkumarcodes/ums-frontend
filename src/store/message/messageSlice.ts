// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { zipObject, map } from 'lodash'
import { Conversation, ConversationParticipant, MessageState } from './messageTypes'

const initialState: MessageState = {
  conversations: {},
  conversationParticipants: {},
}

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addConversation(state, action: PayloadAction<Conversation>) {
      state.conversations[action.payload.pk] = action.payload
    },
    addConversationParticipant(state, action: PayloadAction<ConversationParticipant>) {
      state.conversationParticipants[action.payload.pk] = action.payload
    },
    addConversationParticipants(state, action: PayloadAction<Array<ConversationParticipant>>) {
      state.conversationParticipants = {
        ...state.conversationParticipants,
        ...zipObject(map(action.payload, 'pk'), action.payload),
      }
    },
    removeConversationParticipant(state, action: PayloadAction<number>) {
      delete state.conversationParticipants[action.payload]
    },
  },
})

export const {
  addConversation,
  addConversationParticipant,
  addConversationParticipants,
  removeConversationParticipant,
} = messageSlice.actions
export default messageSlice.reducer
