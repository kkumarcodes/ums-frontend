// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Checkbox, DatePicker, Select, Tabs, Tooltip } from 'antd'
import { OptionType } from 'antd/lib/select'
import { getFullName } from 'components/administrator'
import TagsSelectorWithAll from 'components/common/FormItems/TagsSelectorWithAll'
import { flatten, keys, map, orderBy, reduce, sortBy, uniq } from 'lodash'
import moment from 'moment'
import React from 'react'
import { useSelector } from 'react-redux'
import { Bulletin } from 'store/notification/notificationsTypes'
import {
  selectAllUniqueStudentTags,
  selectIsAdmin,
  selectParents,
  selectParentsObject,
  selectStudents,
  selectStudentsObject,
} from 'store/user/usersSelector'
import { CounselingStudentType, CounselingStudentTypeLabels, Student, UserType } from 'store/user/usersTypes'
import styles from './styles/CreateBulletinModal.scss'

type Props = {
  bulletin: Partial<Bulletin>
  setBulletin: React.Dispatch<React.SetStateAction<Partial<Bulletin>>>
}

export enum RecipientSelectionTabs {
  ClassYearAndPackage = '1',
  IndividualStudentsAndParents = '2',
}

const CreateBulletinModalRecipients = ({ bulletin, setBulletin }: Props) => {
  const studentsObject = useSelector(selectStudentsObject)
  const students = useSelector(selectStudents)
  const parents = useSelector(selectParents)
  const parentsObject = useSelector(selectParentsObject)
  const classYears = uniq(map(students, 'graduation_year')).sort()
  const isAdmin = useSelector(selectIsAdmin)
  const existingTags = useSelector(selectAllUniqueStudentTags)

  let userTypes = bulletin.students ? 'students' : ''
  if (bulletin.parents) {
    userTypes = `${userTypes} ${userTypes ? ' and ' : ''} parents`
  }

  const studentPackages = sortBy(uniq(flatten(students.map(s => s.counseling_student_types_list))))

  const studentTypeOptions = studentPackages.map(studentPackage => ({
    label: studentPackage,
    value: studentPackage,
  }))

  // Helpers to deal with all selection for student types and class years
  const setBulletinStudentTypes = (studentTypes: string[]) => {
    const all = studentTypes.length === studentTypeOptions.length
    setBulletin({ ...bulletin, counseling_student_types: studentTypes, all_counseling_student_types: all })
  }
  const setBulletinClassYears = (years: number[]) => {
    const all = years.length === classYears.length
    setBulletin({ ...bulletin, class_years: years, all_class_years: all })
  }

  const setBulletinStudentTags = (tags: string[]) => {
    setBulletin({ ...bulletin, tags })
  }

  // For use in our selects
  const displayStudents = students.filter(s =>
    (bulletin.visible_to_notification_recipients ?? []).includes(s.notification_recipient),
  )
  const displayParents = parents.filter(s =>
    (bulletin.visible_to_notification_recipients ?? []).includes(s.notification_recipient),
  )

  const updateNotificationRecipients = (userPKs: number[], userType: UserType.Student | UserType.Parent) => {
    // For students, we grab notification recipients of all parents, plus notification recipients of students in
    // userPKs. For parents we do the opposite.
    const newNotificationRecipients =
      userType === UserType.Parent
        ? [
            ...map(displayStudents, 'notification_recipient'),
            ...map(userPKs, p => parentsObject[p].notification_recipient),
          ]
        : [
            ...map(displayParents, 'notification_recipient'),
            ...map(userPKs, p => studentsObject[p].notification_recipient),
          ]
    setBulletin({ ...bulletin, visible_to_notification_recipients: newNotificationRecipients })
  }

  const parentOptions = reduce(
    orderBy(students, 'parent'),
    (options: { label: string; value: number }[], student) => {
      if (student.parent) {
        // Check to see if last item in options is same parent. If so, update label. Otherwise append our new parent!
        if (options.length && options[options.length - 1].value === student.parent) {
          options[options.length - 1].label += ` and ${getFullName(student)}`
        } else {
          options.push({
            label: `${getFullName(parentsObject[student.parent])} parent of ${getFullName(student)}`,
            value: student.parent,
          })
        }
      }
      return options
    },
    [],
  )

  return (
    <div className={styles.createBulletinRecipients}>
      <h2 className="f-subtitle-2">Who should receive this announcement?</h2>
      {userTypes && isAdmin && (
        <>
          <div className="form-group">
            <Checkbox checked={bulletin.cap} onChange={e => setBulletin({ ...bulletin, cap: e.target.checked })}>
              Counseling Platform {userTypes}
            </Checkbox>
          </div>
          <div className="form-group">
            <Checkbox checked={bulletin.cas} onChange={e => setBulletin({ ...bulletin, cas: e.target.checked })}>
              Tutoring Platform {userTypes}
            </Checkbox>
          </div>
        </>
      )}
      <Tabs defaultActiveKey={RecipientSelectionTabs.ClassYearAndPackage}>
        <Tabs.TabPane tab="Select Class Year/Package" key={RecipientSelectionTabs.ClassYearAndPackage}>
          <div className="form-group flex">
            <Checkbox
              checked={bulletin.students}
              onChange={e => setBulletin({ ...bulletin, students: e.target.checked })}
            >
              Students
            </Checkbox>
            <Checkbox
              checked={bulletin.parents}
              onChange={e => setBulletin({ ...bulletin, parents: e.target.checked })}
            >
              Parents
            </Checkbox>
          </div>
          <div className="form-group">
            <Checkbox
              checked={bulletin.evergreen}
              onChange={e => setBulletin({ ...bulletin, evergreen: e.target.checked })}
            >
              Evergreen&nbsp;
              <Tooltip title="Evergreen announcements are made visible to students and parents created in the future (who meet the class year/package type criteria set)">
                <QuestionCircleOutlined />
              </Tooltip>
            </Checkbox>
          </div>
          {bulletin.evergreen && (
            <div className="form-group flex datetime-container">
              <label>
                Evergreen Expiration:&nbsp;
                <Tooltip title="Only students and parents created before this date will see the announcement (optional)">
                  <QuestionCircleOutlined />
                </Tooltip>
              </label>
              <DatePicker
                allowClear
                value={bulletin.evergreen_expiration ? moment(bulletin.evergreen_expiration) : null}
                onChange={e => setBulletin({ ...bulletin, evergreen_expiration: e ? e.toISOString() : null })}
              />
            </div>
          )}
          <div className="form-group flex select-container">
            <label>Class Years:</label>
            <TagsSelectorWithAll
              options={classYears.map(y => ({ label: y, value: y }))}
              value={bulletin.class_years}
              onChange={setBulletinClassYears}
            />
          </div>
          {bulletin.cap && (
            <div className="form-group flex select-container">
              <label>Counseling Packages:</label>
              <TagsSelectorWithAll
                options={studentTypeOptions}
                value={bulletin.counseling_student_types}
                onChange={setBulletinStudentTypes}
              />
            </div>
          )}
          {!bulletin.evergreen && (
            <div className="form-group flex select-container">
              <label>Student Tags:</label>
              <Select
                mode="tags"
                value={bulletin.tags}
                onSelect={tag => {
                  if (bulletin.tags) {
                    setBulletinStudentTags([...bulletin.tags, tag])
                  } else {
                    setBulletinStudentTags([tag])
                  }
                }}
                onDeselect={tag => {
                  setBulletinStudentTags(bulletin.tags?.filter(_tag => _tag !== tag) ?? [])
                }}
                options={existingTags.map(tag => ({ label: tag, value: tag }))}
              />
            </div>
          )}
        </Tabs.TabPane>
        <Tabs.TabPane
          tab="Select Individual Students/Parents"
          key={RecipientSelectionTabs.IndividualStudentsAndParents}
        >
          <div className="form-group flex select-container">
            <label>Students:</label>
            <Select
              mode="tags"
              value={map(displayStudents, 'pk')}
              onChange={e => updateNotificationRecipients(e, UserType.Student)}
              options={students.map(s => ({ label: getFullName(s), value: s.pk }))}
              optionFilterProp="label"
              showSearch
            />
          </div>
          <div className="form-group flex select-container">
            <label>Parents:</label>
            <Select
              mode="tags"
              value={map(displayParents, 'pk')}
              onChange={e => updateNotificationRecipients(e, UserType.Parent)}
              options={parentOptions}
              optionFilterProp="label"
              showSearch
            />
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}
export default CreateBulletinModalRecipients
