// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretDownOutlined, CaretUpOutlined, CheckOutlined } from '@ant-design/icons'
import { Button, Card, Dropdown, Menu, Select } from 'antd'
import { getFullName } from 'components/administrator'
import { useOnClickOutside } from 'hooks'
import { flatten, map, uniq, values } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplyingStudentsList, fetchApplyingStudents } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { IsApplying, University } from 'store/university/universityTypes'
import { selectStudents, selectStudentsObject } from 'store/user/usersSelector'
import SchoolRequirementsTab from './SchoolRequirementsTab'
import styles from './styles/StudentRequirementsTab.scss'

type Props = {
  university: University
}

enum Finalized {
  Finalized = 'finalized',
}

const StudentRequirementsTab = ({ university }: Props) => {
  const dispatch = useReduxDispatch()
  const studentsObject = useSelector(selectStudentsObject)
  const students = values(studentsObject)
  const studentGradYears = uniq(map(students, s => s.graduation_year.toString()))
  const [applyingStudents, setApplyingStudents] = useState<ApplyingStudentsList & { [Finalized.Finalized]: number[] }>({
    [IsApplying.Yes]: [],
    [IsApplying.No]: [],
    [IsApplying.Maybe]: [],
    [Finalized.Finalized]: [],
  })
  const [isApplyingFilter, setIsApplyingFilter] = useState<IsApplying | 'all'>('all')
  const [gradYearsFilter, setGradYearsFilter] = useState(studentGradYears)
  const gradYearsMenuRef = useRef<HTMLDivElement>(null)
  const [gradYearsMenuVisible, setGradYearsMenuVisible] = useState(false)
  useOnClickOutside(gradYearsMenuRef, () => setGradYearsMenuVisible(false))
  const universityPK = university.pk
  useEffect(() => {
    dispatch(fetchApplyingStudents(universityPK)).then(d =>
      setApplyingStudents({
        [IsApplying.No]: d.NO.filter(pk => !studentsObject[pk]?.school_list_finalized),
        [IsApplying.Maybe]: d.MAYBE.filter(pk => !studentsObject[pk]?.school_list_finalized),
        [IsApplying.Yes]: d.YES.filter(pk => !studentsObject[pk]?.school_list_finalized),
        [Finalized.Finalized]: d.YES.filter(pk => studentsObject[pk]?.school_list_finalized),
      }),
    )
  }, [dispatch, studentsObject, university.pk, universityPK])

  // The students we actualy weant to display, based on selected filters
  const filteredStudents = students.filter(s => {
    if (!gradYearsFilter.includes(s.graduation_year.toString())) return false
    if (isApplyingFilter === 'all') {
      return flatten(values(applyingStudents)).includes(s.pk)
    }
    return applyingStudents[isApplyingFilter].includes(s.pk)
  })

  const gradYearsMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={e => setGradYearsFilter(prev => prev.concat([e.key]))}
      onDeselect={e => setGradYearsFilter(prev => prev.filter(category => category !== e.key))}
      selectedKeys={gradYearsFilter}
    >
      {map(studentGradYears, k => (
        <Menu.Item key={k} className="wisernet-ddown-item">
          <span>
            {gradYearsFilter.includes(k) ? <CheckOutlined /> : <span className="spacer" />}
            {k}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <section className={styles.fullContent}>
      <div className="split-view">
        <Card className="applying-student-card">
          <h2 className="f-subtitle">Applying Students:</h2>
          <div className="toolbar" ref={gradYearsMenuRef}>
            <div>
              <label>School List:</label>
              <Select value={isApplyingFilter} onChange={setIsApplyingFilter}>
                <Select.Option value="all">Any</Select.Option>
                <Select.Option value={IsApplying.Yes}>Keep</Select.Option>
                <Select.Option value={IsApplying.Maybe}>Recommended</Select.Option>
                <Select.Option value={Finalized.Finalized}>Finalized</Select.Option>
              </Select>
            </div>
            <div>
              <label>Grad Years:</label>
              <Dropdown
                getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                visible={gradYearsMenuVisible}
                overlay={gradYearsMenu}
                trigger={['click']}
              >
                <Button onClick={() => setGradYearsMenuVisible(prev => !prev)}>
                  Grad Years ({`${gradYearsFilter.length}`})
                  {gradYearsMenuVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
                </Button>
              </Dropdown>
            </div>
          </div>
          <div className="student-list">
            {filteredStudents.map(student => (
              <p key={student.pk}>
                <a href={`#/school-list/student/${student.pk}/`}>{getFullName(student)}</a>
              </p>
            ))}
          </div>
        </Card>
        <SchoolRequirementsTab university={university} />
      </div>
    </section>
  )
}
export default StudentRequirementsTab
