import { createCtx } from 'components/administrator'
import { EventTypes } from 'components/common/TaskSession'

export type TaskSessionContext = {
  eventType: EventTypes
  setEventType: React.Dispatch<React.SetStateAction<EventTypes>>
}

export const [useTaskSessionCtx, TaskSessionProvider] = createCtx<TaskSessionContext>()
