// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckCircleFilled, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Empty, message, Radio, Select, Skeleton, Switch } from 'antd'
import { getFullName } from 'components/administrator'
import { EditableText } from 'components/common/FormItems'
import useStickyState from 'hooks/useStickyState'
import { extractDeadlineSortDate } from 'libs/ScheduleSelector/date-utils'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty, map, sortBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { fetchCollegeResearchFormSubmissions, fetchTasks } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { selectSUDsForStudent, selectUniversities } from 'store/university/universitySelectors'
import { addStudentUniversityDecision } from 'store/university/universitySlice'
import {
  fetchDeadlines,
  fetchStudentUniversityDecisions,
  fetchUniversities,
  updateStudentUniversityDecision,
} from 'store/university/universityThunks'
import {
  Deadline,
  IsApplying,
  SortedTargetReachSafety,
  StudentUniversityDecision,
  University,
} from 'store/university/universityTypes'
import { selectIsCounselor, selectIsParent, selectIsStudentOrParent, selectStudent } from 'store/user/usersSelector'
import { updateStudent } from 'store/user/usersThunks'
import { Student } from 'store/user/usersTypes'
import SUDCard, { SUDCardDisplay } from './StudentUniversityDecisioncard'
import styles from './styles/StudentSchoolList.scss'

type Props = {
  studentID?: number
  readOnly?: boolean
}

const DEFAULT_SORT = 'chances'

const StudentSchoolList = ({ studentID, readOnly = false }: Props) => {
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const [loadingFinalize, setLoadingFinalize] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [savingRTL, setSavingRTL] = useState(false)
  const [hideRTL, setHideRTL] = useState(false)
  const dispatch = useReduxDispatch()
  const activeStudentHookValue = useActiveStudent()
  const studentProp = useSelector(selectStudent(studentID))
  const activeStudent = (studentProp || activeStudentHookValue) as Student
  const sortByPropString = `student_college_list_sort_${activeStudent.pk}`
  const [sortByProp, setSortBy] = useStickyState<string>(sortByPropString, DEFAULT_SORT)
  const isCounselor = useSelector(selectIsCounselor)
  const isParent = useSelector(selectIsParent)
  const isStudentOrParent = useSelector(selectIsStudentOrParent)

  const [cardDisplay, setCardDisplay] = useState<SUDCardDisplay>(SUDCardDisplay.Condensed)
  readOnly = readOnly || !!isParent

  const universities = useSelector(selectUniversities)
  let studentUniversityDecisions = useSelector(selectSUDsForStudent(activeStudent?.pk))
  if (sortByProp === 'created') {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, s => moment(s[sortByProp]).valueOf())
  } else if (sortByProp === 'deadline_date') {
    // We sort independent of year, since deadlines can have "old" years
    studentUniversityDecisions = sortBy(studentUniversityDecisions, s =>
      extractDeadlineSortDate(s[sortByProp]).valueOf(),
    )
  } else if (sortByProp === 'chances') {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, s =>
      SortedTargetReachSafety.indexOf(s.target_reach_safety),
    )
  } else {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, sortByProp)
  }

  const universitiesLoaded = !isEmpty(universities)
  const tasksExist = useSelector(selectTasksForStudent(activeStudent?.pk)).length > 0

  // Load student university decisions and deadlines and tasks for our active student
  const studentPK = activeStudent?.pk
  const studentUserID = activeStudent?.user_id

  useEffect(() => {
    if (studentPK) {
      dispatch(fetchCollegeResearchFormSubmissions({ student: studentPK }))
    }
  }, [dispatch, studentPK])

  useEffect(() => {
    if (studentPK && studentUserID) {
      const promises: Promise<StudentUniversityDecision[] | University[] | Deadline[] | Task[]>[] = [
        dispatch(fetchStudentUniversityDecisions({ student: studentPK })),
        dispatch(fetchDeadlines({ student: studentPK })),
      ]
      setLoading(!studentUniversityDecisions.length || !universitiesLoaded || !tasksExist)
      if (!universitiesLoaded) {
        promises.push(dispatch(fetchUniversities()))
      }
      if (!tasksExist) {
        promises.push(dispatch(fetchTasks({ user: studentUserID })))
      }

      Promise.all(promises).finally(() => setLoading(false))
    }
  }, [studentPK, studentUserID, dispatch, studentUniversityDecisions.length, tasksExist, universitiesLoaded])

  const hideTargetReachSafety = activeStudent?.hide_target_reach_safety

  useEffect(() => {
    setHideRTL(hideTargetReachSafety)
  }, [hideTargetReachSafety])

  // Counselor finalizes (or unfinalizes) student's school list
  const toggleFinalize = () => {
    setLoadingFinalize(true)
    dispatch(
      updateStudent(activeStudent.pk, { school_list_finalized: !activeStudent.school_list_finalized }),
    ).finally(() => setLoadingFinalize(false))
  }

  const handleDragEnd = (result: DropResult) => {
    // Abort if draggable destination not valid or draggable destination == source column
    if (!result.destination || result.destination?.droppableId === result.source.droppableId) return
    // Find the card we just dragged
    const sud = studentUniversityDecisions.find(sud => sud.pk === Number(result.draggableId))
    if (!sud) return

    const destinationColumn = result?.destination?.droppableId
    // Student must add note for schools they are removing
    if (destinationColumn === IsApplying.No && !sud?.note) {
      message.warning(
        `Please ${
          cardDisplay === SUDCardDisplay.Condensed ? 'enter expanded view and ' : ''
        } add a note describing why you are removing ${sud.university_name}`,
      )
      return
    }

    const updateSUD: StudentUniversityDecision = { ...sud, is_applying: result.destination?.droppableId as IsApplying }
    // Optimistically update dragged card on client
    dispatch(addStudentUniversityDecision(updateSUD))
    // Dispatch AJAX request to server to make update persist
    dispatch(
      updateStudentUniversityDecision(result.draggableId, {
        is_applying: updateSUD.is_applying,
      }),
    )
  }

  // Counselor has changed note for student that lives at top of page
  const updateStudentSchoolsNote = async (newNote: string) => {
    if (activeStudent.pk) {
      setSavingNote(true)
      await dispatch(updateStudent(activeStudent.pk, { schools_page_note: newNote }))
      setSavingNote(false)
    }
  }

  // Display SUDNoteModal for all schools on student's final or recommended list
  const editAllNotes = () => {
    const suds = activeStudent.school_list_finalized
      ? studentUniversityDecisions.filter(s => s.is_applying === IsApplying.Yes)
      : studentUniversityDecisions
    dispatch(
      showModal({
        modal: MODALS.SUD_NOTES,
        props: { studentUniversityDecisionIDs: map(suds, 'pk'), studentPK: activeStudent.pk },
      }),
    )
  }

  // Render a single column (droppable yes/no/maybe columns)
  const renderSchoolListCol = (isApplying: IsApplying) => {
    const items = studentUniversityDecisions.filter(sud => sud.is_applying === isApplying)
    let title = 'Recommended'
    if (isApplying === IsApplying.Yes) {
      title = activeStudent.school_list_finalized ? 'Finalized' : 'Keep'
    } else if (isApplying === IsApplying.No) {
      title = 'Removed'
    }
    const initialDisplay: SUDCardDisplay =
      cardDisplay || (isApplying === IsApplying.No ? SUDCardDisplay.Condensed : SUDCardDisplay.Standard)
    return (
      <Droppable droppableId={isApplying}>
        {(provided, snapshot) => (
          <div className="school-list-col" {...provided?.droppableProps} ref={provided.innerRef}>
            <div className="col-title">
              {title} ({items.length})
            </div>
            <div className={`school-list-col-inner ${snapshot.isDraggingOver ? 'no-scroll' : ''}`}>
              {items.map((sud, index) => (
                <Draggable isDragDisabled={readOnly} key={sud.pk} draggableId={String(sud.pk)} index={index}>
                  {(provided, snapshot) => (
                    <SUDCard
                      provided={provided}
                      innerRef={provided.innerRef}
                      initialDisplay={initialDisplay}
                      displayCounselorControls={isCounselor}
                      displayIsApplying={!activeStudent.school_list_finalized}
                      studentUniversityDecisionPK={sud.pk}
                      displayRTLColor={!isStudentOrParent || !activeStudent.hide_target_reach_safety}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    )
  }

  const studentName = isCounselor ? `${activeStudent?.first_name}'s` : 'your'
  const emptyState = (
    <Empty
      className="empty-state"
      description={`${activeStudent?.first_name} does not have any schools on their School List`}
    >
      <Button
        size="large"
        type="primary"
        onClick={() =>
          dispatch(
            showModal({
              modal: MODALS.CREATE_STUDENT_UNIVERSITY_DECISION,
              props: { studentPK: activeStudent?.pk },
            }),
          )
        }
      >
        <PlusCircleOutlined />
        Add {studentName} first school
      </Button>
    </Empty>
  )

  const hasSchools = studentUniversityDecisions.length > 0

  const handleRTLChange = async (checked: boolean) => {
    setSavingRTL(true)
    try {
      await dispatch(updateStudent(activeStudent.pk, { hide_target_reach_safety: !checked }))
    } catch (err) {
      message.error('Failed to update R/T/L')
    }
    setSavingRTL(false)
  }

  if (!activeStudent) return <Skeleton />

  return (
    <div className={styles.studentSchoolList}>
      <div className="note-search">
        <div className="note">
          {isCounselor && <label>Note for {getFullName(activeStudent)}</label>}
          {!isCounselor && activeStudent.schools_page_note && <label>Note from your counselor:</label>}
          <EditableText
            loading={savingNote}
            isFormItem={false}
            placeholder={isCounselor ? `Click to add a note on this page for ${getFullName(activeStudent)}` : ''}
            readOnly={!isCounselor}
            name="schools_page_note"
            value={activeStudent.schools_page_note}
            onUpdate={updateStudentSchoolsNote}
          />
        </div>
        <div className="search-container">
          <Select
            showSearch={true}
            allowClear={true}
            onChange={iped => history.push(`/school/${iped}/`)}
            optionFilterProp="filter"
            placeholder="School search..."
          >
            {universities.map(u => (
              <Select.Option value={u.iped} key={u.slug} filter={`${u.name} ${u.abbreviations}`}>
                {u.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="toolbar">
        {isCounselor && (
          <Switch
            checkedChildren="RTL Visible"
            unCheckedChildren="RTL Hidden"
            checked={!hideRTL}
            onChange={handleRTLChange}
            loading={savingRTL}
          />
        )}
        {(!hideTargetReachSafety || isCounselor) && (
          <div className="legend">
            <span className="likely">Likely</span>
            <span className="target">Target or Target/Likely</span>
            <span className="target-reach">Target/Reach</span>
            <span className="reach">Reach or Far Reach</span>
          </div>
        )}
        <div className="sort-by">
          <label>Sort:</label>
          <Radio.Group size="small" onChange={e => setSortBy(e.target.value)} value={sortBy}>
            <Radio.Button value="university_name">A - Z</Radio.Button>
            <Radio.Button value="created">Added</Radio.Button>
            <Radio.Button value="deadline_date">Deadline</Radio.Button>
            <Radio.Button value="chances">Chances</Radio.Button>
          </Radio.Group>
        </div>
        <div className="expanded-condensed">
          <label>View:</label>
          <Radio.Group size="small" onChange={e => setCardDisplay(e.target.value)} value={cardDisplay}>
            <Radio.Button value={SUDCardDisplay.Standard}>Expanded</Radio.Button>
            <Radio.Button value={SUDCardDisplay.Condensed}>Condensed</Radio.Button>
          </Radio.Group>
        </div>
        <div className="finalize-add">
          {!isParent && (
            <Button type="default" size="small" onClick={editAllNotes} className="edit-all-notes">
              <EditOutlined />
              &nbsp;View/Edit All Notes
            </Button>
          )}
          {isCounselor && (
            <Button type="default" size="small" onClick={toggleFinalize} loading={loadingFinalize} className="finalize">
              {activeStudent.school_list_finalized && <CheckCircleFilled />}
              {activeStudent.school_list_finalized ? 'Unfinalize' : 'Finalize'}
            </Button>
          )}
          {!activeStudent.school_list_finalized && !readOnly && (
            <Button
              type="primary"
              className="add-schools"
              size="small"
              onClick={() =>
                dispatch(
                  showModal({
                    modal: MODALS.CREATE_STUDENT_UNIVERSITY_DECISION,
                    props: { studentPK: activeStudent.pk },
                  }),
                )
              }
            >
              <PlusCircleOutlined />
              Add Colleges
            </Button>
          )}
        </div>
      </div>
      {loading && <Skeleton />}
      {!loading && !hasSchools && emptyState}

      {/* School list not finalized. Render column for each IsApplying state */}
      {!loading && hasSchools && !activeStudent.school_list_finalized && (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="school-list-col-container">
              {renderSchoolListCol(IsApplying.No)}
              {renderSchoolListCol(IsApplying.Maybe)}
              {renderSchoolListCol(IsApplying.Yes)}
            </div>
          </DragDropContext>
        </>
      )}
      {/* Just render all cards as finalized school list */}
      {!loading && hasSchools && activeStudent.school_list_finalized && (
        <div className="finalized-school-list-container">
          {studentUniversityDecisions
            .filter(s => s.is_applying === IsApplying.Yes)
            .map(sud => (
              <SUDCard
                displayCounselorControls={isCounselor}
                displayIsApplying={!activeStudent.school_list_finalized}
                studentUniversityDecisionPK={sud.pk}
                initialDisplay={cardDisplay}
                key={sud.pk}
                displayRTLColor={!isStudentOrParent || !activeStudent.hide_target_reach_safety}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default StudentSchoolList
