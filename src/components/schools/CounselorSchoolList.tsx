// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { BuildFilled, FileOutlined } from '@ant-design/icons'
import { Empty, Select, Tabs } from 'antd'
import {
  ApplicationTrackerContextProvider,
  useCreateApplicationTrackerCtx,
} from 'components/applicationPlan/ApplicationTrackerContext'
import { ApplicationTrackerTable } from 'components/applicationPlan/ApplicationTrackerTable'
import CounselorNotesAndFilesSummary from 'components/counselor/CounselorNotesAndFilesSummary'
import { useShallowSelector } from 'libs'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { CounselingUploadFileTags, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { RootState } from 'store/rootReducer'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { IsApplying, StudentUniversityDecisionExtended } from 'store/university/universityTypes'
import StudentSchoolList from './StudentSchoolList'
import styles from './styles/CounselorSchoolList.scss'

const { TabPane } = Tabs
const CounselorSchoolList = () => {
  const activeStudent = useActiveStudent()
  const history = useHistory()
  const deadlines = useShallowSelector((state: RootState) => state.university.deadlines)
  const trackerContext = useCreateApplicationTrackerCtx()
  const SUDs: StudentUniversityDecisionExtended[] = useSelector(selectSUDsForStudent(activeStudent?.pk))
    .filter(s => s.is_applying === IsApplying.Yes)
    .map(d => ({
      ...d,
      deadline_type: deadlines[d.deadline]?.type_of_name,
      deadline_enddate: deadlines[d.deadline]?.enddate,
    }))

  // We filter out universities that don't have an IPED set (int'l universities)
  const universities = useSelector((state: RootState) =>
    Object.values(state.university.universities).filter(u => u.iped && Number(u.iped) > 0),
  )
  return (
    <div className={styles.counselorSchoolList}>
      {!activeStudent && (
        <div className="school-search right">
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
      )}
      {activeStudent && <StudentSchoolList />}
      {activeStudent && (
        <Tabs>
          <TabPane
            key="tracker"
            tab={
              <span>
                <BuildFilled />
                Tracker
              </span>
            }
          >
            <div className="tracker-container">
              <ApplicationTrackerContextProvider value={trackerContext}>
                {SUDs.length > 0 && (
                  <ApplicationTrackerTable sudBatch={SUDs} studentID={activeStudent.pk} allowCollapse={false} />
                )}
              </ApplicationTrackerContextProvider>
            </div>
          </TabPane>
          <TabPane
            key="notes-and-files"
            tab={
              <span>
                <FileOutlined />
                Notes &amp; Files
              </span>
            }
          >
            <CounselorNotesAndFilesSummary
              studentID={activeStudent.pk}
              fileTags={[CounselingUploadFileTags.Colleges]}
              notesCategories={[CounselorNoteCategory.Colleges, CounselorNoteCategory.Majors]}
            />
          </TabPane>
        </Tabs>
      )}
      {!activeStudent && (
        <Empty>
          Soon you will be able to create your own school lists here, tagging schools however you want. But we&apos;re
          not
          <em>quite</em> there yet. Please select a student via the sidebar on the left to alter their school list
        </Empty>
      )}
    </div>
  )
}

export default CounselorSchoolList
