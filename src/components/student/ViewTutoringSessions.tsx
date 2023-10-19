// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckSquareOutlined, EditOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Col, Row, Skeleton, Statistic, Table, Tag } from 'antd'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchStudentTutoringSessions } from 'store/tutoring/tutoringThunks'
import { TutoringSessionType } from 'store/tutoring/tutoringTypes'
import { ActiveUser, UserType } from 'store/user/usersTypes'
import styles from './styles/ViewTutoringSessions.scss'

type SessionStatsProps = {
  groupMins: number
  individualTestMins: number
  individualCurrMins: number
}

const SessionStats = ({ groupMins, individualTestMins, individualCurrMins }: SessionStatsProps) => {
  return (
    <div className={styles.SessionStats}>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Group Session Total Minutes Used"
              value={groupMins}
              valueStyle={{ color: '#293b68' }}
              prefix={<UsergroupAddOutlined />}
              suffix="min"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Individual Curriculum Total Minutes Used"
              value={individualCurrMins}
              valueStyle={{ color: '#293b68' }}
              prefix={<EditOutlined />}
              suffix="min"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Individual Test Prep Total Minutes Used"
              value={individualTestMins}
              valueStyle={{ color: '#293b68' }}
              prefix={<UserOutlined />}
              suffix="min"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export const ViewTutoringSessions = () => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)

  const { student, sessions } = useSelector((state: RootState) => {
    if (state.user.activeUser?.userType === UserType.Parent) {
      return {
        student: state.user.selectedStudent,
        sessions: state.tutoring.studentTutoringSessions,
      }
    }
    const student = state.user.students[(state.user.activeUser as ActiveUser).cwUserID]
    const sessions = state.tutoring.studentTutoringSessions

    return { student, sessions }
  }, shallowEqual)

  type resourceRow = {
    key: number
    date: string
    duration: number
    sessionType: string
    note: string
    missed: boolean
  }

  const hasSessions = Boolean(Object.keys(sessions).length)
  const hasStudent = Boolean(student)
  useEffect(() => {
    if (!hasSessions || !hasStudent) setLoading(true)

    if (hasStudent) {
      dispatch(fetchStudentTutoringSessions({ student: student.pk }))
      setLoading(false)
    }
  }, [dispatch, hasSessions, hasStudent, student.pk])

  let dataRows: resourceRow[] = []
  let groupSessionCount = 0
  let individualTestCount = 0
  let individualCurriculumCount = 0

  if (sessions) {
    const activeSessions = Object.values(sessions).filter(s => s.cancelled !== true && s.missed !== true)
    activeSessions.forEach(val => {
      if (val.group_tutoring_session) {
        groupSessionCount += val.duration_minutes
      } else {
        if (val.session_type === TutoringSessionType.TestPrep) individualTestCount += val.duration_minutes
        if (val.session_type === TutoringSessionType.Curriculum) individualCurriculumCount += val.duration_minutes
      }
    })

    const getSessionType = ses => {
      if (ses.group_tutoring_session) return 'Group'
      if (ses.session_type === TutoringSessionType.TestPrep) return 'Test Prep'
      return 'Curriculum'
    }

    dataRows = activeSessions.map(r => {
      const month = new Date(r.start).getMonth() + 1
      const date = new Date(r.start).getDate()
      const year = new Date(r.start).getFullYear()
      const full_date = year > 2018 ? `${month}-${date}-${year}` : '(no date recorded)'
      const sessionType = getSessionType(r)

      return {
        key: r.pk,
        date: full_date,
        duration: r.duration_minutes,
        sessionType,
        note: r.note,
        missed: r.missed,
      }
    })
  }

  const sessionTagColor = (sessionType: string) => {
    if (sessionType === 'Group') return 'blue'
    if (sessionType === 'Test Prep') return 'purple'
    if (sessionType === 'Curriculum') return 'cyan'
    return 'green'
  }
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      sorter: (a: resourceRow, b: resourceRow): number => (a.date < b.date ? -1 : 1),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      sorter: (a: resourceRow, b: resourceRow): number => (a.duration < b.duration ? -1 : 1),
    },
    {
      title: 'Session Type',
      dataIndex: 'sessionType',
      sorter: (a: resourceRow, b: resourceRow): number => (a.sessionType < b.sessionType ? -1 : 1),
      defaultSortOrder: 'ascend',
      render: function showSessionType(sessionType: string) {
        return (
          <span>
            <Tag color={sessionTagColor(sessionType)} key={sessionType}>
              {sessionType.toUpperCase()}
            </Tag>
          </span>
        )
      },
    },
    {
      title: 'Missed',
      dataIndex: 'missed',
      sorter: (a: resourceRow, b: resourceRow): number => (a.missed < b.missed ? -1 : 1),
      defaultSortOrder: 'ascend',
      render: function isMissed(missed: boolean | string) {
        return <span>{missed ? <CheckSquareOutlined style={{ fontSize: '16px', color: 'black' }} /> : ''}</span>
      },
    },
    {
      title: 'Notes',
      dataIndex: 'note',
      key: 'note',
    },
  ]

  return loading ? (
    <Skeleton />
  ) : (
    <div className={styles.viewTutoringSessions}>
      <h1>Tutoring Session History</h1>
      <Table columns={columns} dataSource={dataRows} />
      <SessionStats
        individualTestMins={individualTestCount}
        groupMins={groupSessionCount}
        individualCurrMins={individualCurriculumCount}
      />
    </div>
  )
}

export default ViewTutoringSessions
