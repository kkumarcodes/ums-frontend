// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Badge, Input, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import { user_pk } from 'global'
import _, { filter, flatten, isEmpty, map, sortBy, values } from 'lodash'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { selectActiveConversationParticipants } from 'store/message/messageSelector'
import { fetchConversationParticipants } from 'store/message/messageThunks'
import { ConversationSpecification, ConversationType } from 'store/message/messageTypes'
import {
  getParents,
  selectActiveUser,
  selectCounselors,
  selectParent,
  selectStudent,
  selectTutors,
} from 'store/user/usersSelector'
import { fetchCounselors, fetchStudents, FetchStudentsFilter, fetchTutors } from 'store/user/usersThunks'
import { Student, UserType } from 'store/user/usersTypes'
import { RootState } from '../../store/rootReducer'
import { useReduxDispatch } from '../../store/store'
import styles from './styles/ChatConversationList.scss'

interface OwnProps {
  userType: UserType
  cwUserID: number // ID of CW user object we are displaying conversations for (student/tutor/counselor)
  onSelectConversation: (conversationPayload: ConversationSpecification) => void
  selectedConversation: ConversationSpecification | null
}

interface ConversationListItem extends ConversationSpecification {
  title: string
  subtitle?: string
  notification?: boolean
  selected?: boolean
  key: string
  unreadMesssages?: boolean
}

const StudentParentItems: ConversationListItem[] = [
  {
    title: 'Tutor',
    conversationType: ConversationType.Tutor,
    key: '1',
  },
  {
    title: 'Counselor',
    conversationType: ConversationType.Counselor,
    key: '2',
  },
]

const ChatConversationList = (props: OwnProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  /**
   * studentList is list of students for counselor - if user type is counselor - or tutor - if user type
   * is --- you guesed it --- tutor. So many hyphens in that sentence. I guess they should be M dashes?
   * idk I ain't got time for that. Just time to write really long comments without M dashes
   */
  const activeUser = useSelector(selectActiveUser)
  const student = useSelector(
    selectStudent(activeUser?.userType === UserType.Student ? activeUser.cwUserID : undefined),
  )
  const studentList = useSelector((state: RootState) => {
    let studentList: Student[] = []
    if (props.userType === UserType.Tutor) {
      studentList = values(state.user.students).filter(s => s.tutors.includes(props.cwUserID))
    } else if (props.userType === UserType.Counselor) {
      studentList = filter(values(state.user.students), { counselor: props.cwUserID })
    }

    return studentList
  }, shallowEqual)

  const allTutors = useSelector(selectTutors)
  const allCounselors = useSelector(selectCounselors)
  const hasTutors = !isEmpty(allTutors)
  const hasCounselors = !isEmpty(allCounselors)
  const studentTutors = flatten(studentList.map(s => s.tutors))
  const tutorList = allTutors.filter(t => studentTutors.includes(t.pk))
  const studentCounselors = map(studentList, 'counselor')
  const counselorList = allCounselors.filter(c => studentCounselors.includes(c.pk))
  const cwUserID = activeUser?.cwUserID
  const conversationParticipants = useSelector(selectActiveConversationParticipants)
  const parents = useSelector(getParents)

  /** Load tutor/counselor students if there aren't any */

  const getParentName = (parentPK: number) => {
    const parent = parents[parentPK]
    const parentName = getFullName(parent)
    return parentName
  }

  useEffect(() => {
    if ([UserType.Counselor, UserType.Tutor].includes(props.userType) && studentList.length === 0) {
      setLoading(true)
      const filterStudents: FetchStudentsFilter =
        props.userType === UserType.Tutor ? { tutor: props.cwUserID } : { counselor: props.cwUserID }
      dispatch(fetchStudents(filterStudents)).then(() => setLoading(false))
    }
    // We load conversation participants so we can check to see if there are unread messages
    dispatch(fetchConversationParticipants(user_pk))
  }, [counselorList.length, dispatch, props.cwUserID, props.userType, studentList.length, tutorList.length])

  useEffect(() => {
    if (props.userType === UserType.Counselor && !hasTutors) {
      dispatch(fetchTutors())
    }
  }, [dispatch, hasTutors, props.userType])
  useEffect(() => {
    if (props.userType === UserType.Tutor && !hasCounselors) {
      dispatch(fetchCounselors())
    }
  }, [dispatch, hasCounselors, props.userType])

  /**
   * We create our list of conversationItems. For students and parents: Tutor and Counselor
   * For Tutors and Counselors: List of students
   */
  let conversationItems: ConversationListItem[] = []
  if (props.userType === UserType.Student || props.userType === UserType.Parent) {
    conversationItems = StudentParentItems.map(s => {
      const participant = conversationParticipants.find(
        p => p.conversation_type === s.conversationType && p.conversation_student === s.student,
      )
      s.unreadMesssages = participant?.has_unread_messages
      if (props.userType === UserType.Student) {
        s.student = props.cwUserID
      } else {
        s.parent = props.cwUserID
      }

      s.selected = Boolean(
        props.selectedConversation &&
          props.selectedConversation.student === s.student &&
          props.selectedConversation.conversationType === s.conversationType &&
          props.selectedConversation?.parent === s.parent,
      )
      // Set person's name
      if (s.conversationType === ConversationType.Counselor && student) {
        s.subtitle = student.counselor_name
      }

      return s
    })
  } else {
    // We create items for students and also each parent if they exist. We sort by student last name
    sortBy(studentList, s => s.last_name.toLowerCase()).forEach(s => {
      // This is the participant for the TUTOR/COUNSELOR for the conversation with the STUDENT
      const participant = conversationParticipants.find(p => p.conversation_student === s.pk)
      const conversationType = props.userType === UserType.Tutor ? ConversationType.Tutor : ConversationType.Counselor
      conversationItems.push({
        unreadMesssages: participant?.has_unread_messages,
        title: getFullName(s),
        key: `student${s.pk}`,
        conversationType,
        student: s.pk,
        selected: Boolean(
          props.selectedConversation &&
            props.selectedConversation.conversationType === conversationType &&
            props.selectedConversation.student === s.pk,
        ),
      })
      if (s.parent) {
        // This is the participant for the TUTOR/COUNSELOR for the conversation with the STUDENT
        const participant = conversationParticipants.find(p => p.conversation_student === s.parent)
        const conversationType = props.userType === UserType.Tutor ? ConversationType.Tutor : ConversationType.Counselor

        conversationItems.push({
          unreadMesssages: participant?.has_unread_messages,
          title: `${getParentName(s.parent)}, Parent of ${getFullName(s)}`,
          key: `parent${s.pk}`,
          conversationType,
          parent: s.parent,
          selected: Boolean(
            props.selectedConversation &&
              props.selectedConversation.conversationType === conversationType &&
              props.selectedConversation.parent === s.parent,
          ),
        })
      }
    })

    // Tutors get counselors to converse with
    if (props.userType === UserType.Tutor) {
      const studentsByPK = _.keyBy(studentList, 'pk')
      conversationItems = conversationItems.concat(
        counselorList.map(counselor => {
          const participant = conversationParticipants.find(
            p => p.conversation_type === ConversationType.CounselorTutor && p.conversation_counselor === counselor.pk,
          )
          const studentNames: string[] = []
          counselor.students.forEach(s => {
            if (studentsByPK.hasOwnProperty(s)) {
              studentNames.push(getFullName(studentsByPK[s]))
            }
          })
          return {
            unreadMesssages: participant?.has_unread_messages,
            title: getFullName(counselor),
            key: `cousnelor${counselor.pk}`,
            subtitle: `Counselor for: ${studentNames.join(', ')}`,
            conversationType: ConversationType.CounselorTutor,
            counselor: counselor.pk,
            tutor: cwUserID,
            selected: Boolean(
              props.selectedConversation &&
                props.selectedConversation.conversationType === ConversationType.CounselorTutor &&
                props.selectedConversation.counselor === counselor.pk,
            ),
          }
        }),
      )
    } else if (props.userType === UserType.Counselor) {
      const studentsByPK = _.keyBy(studentList, 'pk')
      conversationItems = conversationItems.concat(
        tutorList.map(t => {
          const participant = conversationParticipants.find(
            p => p.conversation_type === ConversationType.CounselorTutor && p.conversation_tutor === t.pk,
          )
          const studentNames: string[] = []
          t.students.forEach(s => {
            if (studentsByPK.hasOwnProperty(s)) {
              studentNames.push(getFullName(studentsByPK[s]))
            }
          })
          return {
            unreadMesssages: participant?.has_unread_messages,
            title: getFullName(t),
            subtitle: `Tutor for: ${studentNames.join(', ')}`,
            key: `tutor${t.pk}`,
            conversationType: ConversationType.CounselorTutor,
            tutor: t.pk,
            counselor: cwUserID,
            selected: Boolean(
              props.selectedConversation &&
                props.selectedConversation.conversationType === ConversationType.CounselorTutor &&
                props.selectedConversation.counselor === t.pk,
            ),
          }
        }),
      )
    }
  }
  if (search.length > 2) {
    conversationItems = conversationItems.filter(
      c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(search.toLowerCase()),
    )
  }

  /**
   * A new conversation is selected. Pass conversation to parent via props.onSelectConversation
   * @param conversationItem
   */
  const selectConversation = (conversationItem: ConversationListItem) => {
    const { student, parent, conversationType, counselor, tutor } = conversationItem
    const selectedConversation = { student, parent, conversationType, counselor, tutor }
    props.onSelectConversation(selectedConversation)
  }

  // Loading stte is just skeleton
  if (loading) {
    return (
      <div className={styles.chatConversationList}>
        <Skeleton />
      </div>
    )
  }

  return (
    <div className={styles.chatConversationList}>
      <div className="f-subtitle-1 center">Conversations</div>
      <div className="list-search">
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} size="small" />
      </div>
      <div className="chat-conversation-inner-list">
        {conversationItems.map(ci => {
          const title = ci.unreadMesssages ? (
            <Badge dot={true}>
              <p className="conversation-name">{ci.title}</p>
            </Badge>
          ) : (
            <p className="conversation-name">{ci.title}</p>
          )
          return (
            <div
              onClick={() => {
                selectConversation(ci)
              }}
              onKeyPress={e => e.charCode === 13 && selectConversation(ci)}
              role="button"
              tabIndex={0}
              key={ci.key}
              className={`${ci.selected ? 'active' : ''} conversation-item`}
            >
              {title}
              {ci.subtitle && <p className="conversation-subtitle">{ci.subtitle}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChatConversationList
