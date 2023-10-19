// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CaretDownOutlined,
  CaretUpOutlined,
  CheckOutlined,
  DownloadOutlined,
  DownOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Dropdown, Empty, Input, Menu, Row, Skeleton, Space } from 'antd'
import { renderHighlighter } from 'components/administrator'
import WisernetSection from 'components/common/UI/WisernetSection'
import CounselingFileUploads from 'components/counseling/CounselingFileUploads'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import { CounselorMeetingNoteForm } from 'components/counselor/CounselorMeetingNoteForm'
import styles from 'components/counselor/styles/CounselorNotesAndFilesPage.scss'
import ResourceManager from 'components/resources/ResourceManager'
import { useOnClickOutside } from 'hooks'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty, keys, lowerCase, map, orderBy, startCase, uniqBy, values } from 'lodash'
import moment, { Moment } from 'moment'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent, selectCounselorNotes } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { CounselorMeeting, CounselorNote, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { selectVisibleModal } from 'store/display/displaySelectors'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor, selectStudent } from 'store/user/usersSelector'
type Props = {
  studentID?: number
}
const CounselorNotesAndFilesPage = ({ studentID }: Props) => {
  const activeStudent = useActiveStudent()
  const propStudent = useSelector(selectStudent(studentID))
  const isCounselorMeetingNoteModalVisible = useSelector(selectVisibleModal(MODALS.COUNSELOR_MEETING_NOTE))
  const student = propStudent || activeStudent
  // Despite what TS says studentPK will be a number
  const studentPK = student?.pk as number
  const dispatch = useReduxDispatch()
  const isCounselor = useSelector(selectIsCounselor)
  const counselorNotes = useSelector(selectCounselorNotes)
  const counselorMeetingsWithNotes = counselorNotes.map(n => n.counselor_meeting)
  const counselorMeetingNoteCards = useSelector(selectCounselorMeetingsForStudent(student?.pk)).filter(
    cm => (cm.start && moment(cm.start).isBefore()) || counselorMeetingsWithNotes.includes(cm.pk),
  )
  // Bare with me ... The pk below is lie, but it's a necessary evil, because the individual collapse/expand logic
  // requires meeting and non-meeting notes to share a common field to function properly
  const counselorNonMeetingNoteCards = uniqBy(
    counselorNotes
      .filter(cn => cn.note_date && cn.note_student === studentPK)
      .map(cn => ({
        pk: cn.note_date,
        start: cn.note_date,
        title: `${moment(cn.note_date as string).format('MMM DD')}${cn.note_title ? ` - ${cn.note_title}` : ''}`,
      })),
    'start',
  )
  const combinedCounselorNoteCards = orderBy(
    counselorMeetingNoteCards.concat(counselorNonMeetingNoteCards),
    'start',
    'desc',
  )
  const counselorNoteCardsWithNotes = combinedCounselorNoteCards.map(noteCard => {
    // CASE 1: This is a counselor note associated with a meeting
    if (noteCard.student) {
      const counselorNotesForThisCard = counselorNotes.filter(cn => cn.counselor_meeting === noteCard.pk)
      return {
        ...noteCard,
        counselorNotes: counselorNotesForThisCard,
      }
    }
    // CASE 2: This is a counselor note associated with a specific date
    const counselorNotesForThisCard = counselorNotes.filter(cn => cn.note_date === noteCard.start)
    return {
      ...noteCard,
      counselorNotes: counselorNotesForThisCard,
    }
  })
  const hasCounselorMeetingNoteCards = !isEmpty(counselorMeetingNoteCards)
  const [nonMeetingNoteDate, setNonMeetingNoteDate] = useState<string>()
  const [search, setSearch] = useState('')
  const [noteCategoryVisible, setNoteCategoryVisible] = useState(false)
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<CounselorNoteCategory[]>(
    values(CounselorNoteCategory),
  )
  const [collapsedCounselorMeetings, setCollapsedCounselorMeetings] = useState<number[]>([])
  const noteCategoryRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(noteCategoryRef, () => setNoteCategoryVisible(false))
  useEffect(() => {
    if (!isCounselorMeetingNoteModalVisible) {
      setNonMeetingNoteDate(undefined)
    }
  }, [isCounselorMeetingNoteModalVisible])
  useEffect(() => {
    if (!hasCounselorMeetingNoteCards && studentPK) {
      dispatch(fetchCounselorMeetings({ student: studentPK }))
    }
  }, [dispatch, hasCounselorMeetingNoteCards, studentPK])

  const handleNoteFilter = (cn: CounselorNote) => {
    const trimmedSearch = search.toLowerCase().trim()
    const counselorMeeting = counselorMeetingNoteCards.find(cm => cm.pk === cn.counselor_meeting)
    return (
      counselorMeeting?.title?.toLowerCase().includes(trimmedSearch) ||
      (counselorMeeting?.start &&
        moment(counselorMeeting.start).format('MMMM D - ').toLowerCase().includes(trimmedSearch)) ||
      cn.title.toLowerCase().includes(trimmedSearch) ||
      cn.category.toLowerCase().includes(trimmedSearch) ||
      cn.note.toLowerCase().includes(trimmedSearch)
    )
  }
  const maxCounselorNoteCategoryCount = keys(CounselorNoteCategory).length
  const handleNoteCardFilter = () => {
    const trimmedSearch = search.toLowerCase().trim()
    return counselorNoteCardsWithNotes.filter(noteCard => {
      // Special Filter Case: CounselorNote card without any existing notes
      if (noteCard.counselorNotes.length === 0) {
        return !trimmedSearch && selectedNoteCategory.length === maxCounselorNoteCategoryCount
      }
      return noteCard.counselorNotes.some(note => {
        return (
          selectedNoteCategory.includes(note.category) &&
          (note.note?.toLowerCase().includes(trimmedSearch) ||
            noteCard?.title?.toLowerCase().includes(trimmedSearch) ||
            (noteCard?.start && moment(noteCard.start).format('MMMM D - ').toLowerCase().includes(trimmedSearch)) ||
            lowerCase(note.category).includes(trimmedSearch))
        )
      })
    })
  }

  const toggleCounselorMeetingCollapseIcon = (cm: CounselorMeeting) =>
    collapsedCounselorMeetings.includes(cm.pk)
      ? setCollapsedCounselorMeetings(prev => prev.filter(cmPK => cmPK !== cm.pk))
      : setCollapsedCounselorMeetings(prev => prev.concat([cm.pk]))
  const handleAddOrEditNote = useCallback(
    (ccn: CounselorMeeting) =>
      dispatch(
        showModal({
          modal: MODALS.COUNSELOR_MEETING_NOTE,
          props: ccn.student ? { counselorMeetingID: ccn.pk } : { nonMeetingNoteDate: ccn.start, studentPK },
        }),
      ),
    [dispatch, studentPK],
  )
  const handleDatePickerChange = useCallback(
    (_: Moment, dateString: string) => {
      setNonMeetingNoteDate(dateString)
      if (!isCounselorMeetingNoteModalVisible) {
        dispatch(
          showModal({
            modal: MODALS.COUNSELOR_MEETING_NOTE,
            props: {
              nonMeetingNoteDate: moment(dateString, 'MM-DD-YYYY').format('YYYY-MM-DD'),
              studentPK,
            },
          }),
        )
      }
    },
    [dispatch, isCounselorMeetingNoteModalVisible, studentPK],
  )
  const noteCategoryMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={e => setSelectedNoteCategory(prev => prev.concat([e.key as CounselorNoteCategory]))}
      onDeselect={e => setSelectedNoteCategory(prev => prev.filter(category => category !== e.key))}
      selectedKeys={selectedNoteCategory}
    >
      {map(values(CounselorNoteCategory), k => (
        <Menu.Item key={k} className="wisernet-ddown-item">
          <span>
            {selectedNoteCategory.includes(k) ? <CheckOutlined /> : <span className="spacer" />}
            {startCase(k)}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )
  const notesTitle = (
    <div className="notes-container-title flex">
      <Row justify="space-between" className="w100">
        <h3 className="f-title">Notes</h3>
        <Button
          className="collapse-expand-all-meetings"
          type="link"
          onClick={() =>
            setCollapsedCounselorMeetings(prev => (prev.length ? [] : combinedCounselorNoteCards.map(cm => cm.pk)))
          }
        >
          {`${collapsedCounselorMeetings.length ? 'Expand' : 'Collapse'} All Meetings`}
        </Button>
      </Row>
      {isCounselor && student?.cpp_notes && (
        <div className="cpp-notes-alert f-content">
          <label className="help">Notes imported from CPP:</label>&nbsp;&nbsp;
          <Button target="_blank" type="primary" size="small" href={student.cpp_notes}>
            <DownloadOutlined />
            &nbsp;CPP Notes
          </Button>
        </div>
      )}
    </div>
  )
  if (!student) return <Skeleton />
  return (
    <div className={`${styles.CounselorNotesAndFilesPage}`}>
      <div className="flex">
        <div className="files-resources-container">
          <WisernetSection noPadding>
            <CounselingFileUploads studentID={student.pk} />
          </WisernetSection>
          <WisernetSection noPadding title="Forms">
            <CounselingStudentParentTaskList studentID={student.pk} formsOnly />
          </WisernetSection>
        </div>
        <WisernetSection className="notes-container" noPadding title={notesTitle}>
          <p>
            <small>Select a date below to add new notes that are not associated with a meeting.</small>
          </p>
          <Space direction="vertical" size="middle">
            <Row justify="space-between">
              <DatePicker
                placeholder="Add New Note"
                style={{ width: 150 }}
                onChange={handleDatePickerChange}
                value={nonMeetingNoteDate ? moment(nonMeetingNoteDate, 'MM-DD-YYYY') : undefined}
                format="MM-DD-YYYY"
              />
              <div ref={noteCategoryRef}>
                <Dropdown
                  getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                  visible={noteCategoryVisible}
                  overlay={noteCategoryMenu}
                  trigger={['click']}
                >
                  <Button onClick={() => setNoteCategoryVisible(prev => !prev)}>
                    Choose Note Category ({`${selectedNoteCategory.length}`})
                    {noteCategoryVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
                  </Button>
                </Dropdown>
              </div>
              <Input
                style={{ width: '30%' }}
                suffix={<SearchOutlined />}
                placeholder="Search Notes"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Row>
            <p className="help">
              Notes below are organized by date.
              {isCounselor && counselorMeetingNoteCards.length > 0 && (
                <span>&nbsp;Use the &quot;Click To Add or Edit Notes...&quot; link to add additional note(s).</span>
              )}
            </p>
          </Space>
          ​{counselorNoteCardsWithNotes.length === 0 && <Empty description="No past meetings or notes" />}
          {handleNoteCardFilter().map(noteCard => (
            <div key={noteCard.pk} className="counselor-meeting-container">
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
              <div
                className={`note-title ${noteCard.student ? '' : 'non-meeting-note-title'}`}
                onClick={() => toggleCounselorMeetingCollapseIcon(noteCard)}
                role="button"
                tabIndex={0}
              >
                {noteCard.student && (
                  <span>
                    {noteCard?.start ? renderHighlighter(moment(noteCard.start).format('MMMM D - '), search) : ''}
                  </span>
                )}
                <span>{renderHighlighter(noteCard?.title, search)}</span>
                <Button
                  className="collapse-note-content-icon slim-btn"
                  type="link"
                  icon={collapsedCounselorMeetings.includes(noteCard.pk) ? <DownOutlined /> : <UpOutlined />}
                />
              </div>
              <div
                className={`counselor-meeting-content ${
                  collapsedCounselorMeetings.includes(noteCard.pk) ? 'hide' : ''
                }`}
              >
                {noteCard.counselorNotes
                  .filter(cn => {
                    // Meeting note filter
                    if (noteCard.student) {
                      return (
                        cn.counselor_meeting === noteCard.pk &&
                        handleNoteFilter(cn) &&
                        selectedNoteCategory.includes(cn.category)
                      )
                    }
                    // Non-Meeting note filter
                    return (
                      cn.note_date === noteCard.start &&
                      cn.note_student === studentPK &&
                      handleNoteFilter(cn) &&
                      selectedNoteCategory.includes(cn.category)
                    )
                  })
                  .map(cn => (
                    <CounselorMeetingNoteForm
                      key={cn.pk}
                      counselorMeetingID={noteCard.pk}
                      counselorNote={cn}
                      isReadOnly={true}
                      highlightText={search}
                      nonMeetingNoteDate={cn.note_date}
                    />
                  ))}
                <div className="new-note-container">
                  {isCounselor && (
                    <Button type="link" className="new-note-btn" onClick={() => handleAddOrEditNote(noteCard)}>
                      Click To Add or Edit Notes ...
                    </Button>
                  )}
                  {!isCounselor && <p className="help center">No notes have been created for this meeting</p>}
                </div>
              </div>
            </div>
          ))}
        </WisernetSection>
      </div>
      <ResourceManager studentID={student.pk} />
    </div>
  )
}
export default CounselorNotesAndFilesPage
