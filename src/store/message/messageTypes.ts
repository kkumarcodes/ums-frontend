export enum ConversationType {
  Tutor = 'tu',
  Counselor = 'co',
  Operations = 'op',
  CounselorTutor = 'ct',
  Other = 'ot',
}

export interface Conversation {
  slug: string
  pk: number
  title: string
  student?: number
  parent?: number
  counselor?: number
  conversation_type: ConversationType
  conversation_id: string
  conversation_chat_id: string
  active: boolean
}

export interface ConversationParticipant {
  slug: string
  pk: number
  conversation: number
  conversation_type: string
  display_name: string
  active: boolean
  // PKs
  conversation_student: number
  conversation_parent: number
  conversation_tutor: number
  conversation_counselor: number
  conversation_title: string
  notification_recipient: number
  participant_id: string
  phone_number: string // Number participant texts FROM
  proxy_phone_number: string // Number participant texts TO
  chat_identifier: string
  has_unread_messages: boolean
}

// This type is used only on the frontend, and is all we need to fully
// specify a conversation or prospective conversation that hasn't been created yet (i.e
// does not have a Conversation object)
export interface ConversationSpecification {
  student?: number
  parent?: number
  counselor?: number
  tutor?: number
  conversationType: ConversationType
}

export type MessageState = {
  conversations: {
    [pk: number]: Conversation
  }
  conversationParticipants: {
    [pk: number]: ConversationParticipant
  }
}
