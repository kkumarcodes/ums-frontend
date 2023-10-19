// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Empty, Tabs } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { selectUniversityByIPED } from 'store/university/universitySelectors'
import { getUserState } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'
import SchoolProfileTab from './SchoolProfileTab'
import StudentRequirementsTab from './StudentRequirementsTab'
import styles from './styles/SchoolMainPage.scss'

const { TabPane } = Tabs

const SchoolProfilePage = () => {
  const { iped } = useParams<{ iped: string }>()
  const activeUser = useSelector(getUserState)
  const activeUserType = activeUser.activeUser?.userType
  const university = useSelector(selectUniversityByIPED(iped))

  const url = `https://airtable.com/shrIB2XNBN8v5DAZF?prefill_School+ID=${university?.pk}&prefill_College=${university?.name}`

  const userRender = () => {
    if (!university) {
      return <Empty description="There is no data available for this university" />
    }
    if (activeUserType === UserType.Counselor) {
      return (
        <div className={styles.mainSchoolPage}>
          <div className="school-name-and-button">
            <h1>{university.name}</h1>
            <Button target="_blank" rel="noopener noreferrer" href={url}>
              🤔&nbsp;Request Change
            </Button>
          </div>

          <Tabs defaultActiveKey="1">
            <TabPane tab="School Profile" key="1">
              <SchoolProfileTab university={university} />
            </TabPane>
            <TabPane tab="Students/Requirements" key="2">
              <StudentRequirementsTab university={university} />
            </TabPane>
          </Tabs>
        </div>
      )
    }
    return <SchoolProfileTab university={university} />
  }

  return <>{userRender()}</>
}

export default SchoolProfilePage
