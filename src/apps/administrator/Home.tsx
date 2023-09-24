// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Row, Table } from 'antd'
import { TableProps } from 'antd/es/table'
import { createColumns } from 'components/administrator'
import { kebabCase, remove, startCase, values } from 'lodash'
import React from 'react'
import { Link } from 'react-router-dom'
import { TutoringType } from 'store/tutoring/tutoringTypes'
import { UserType } from 'store/user/usersTypes'
import styles from './styles/Home.scss'

const user = remove(values(UserType), type => type !== UserType.Administrator).map(name => ({ name: `${name}s` }))
const tutoring = values(TutoringType).map(name => ({ name }))
const session = ['studentTutoringSessions', 'groupTutoringSessions'].map(name => ({ name }))
const diagnostic = ['diagnosticsAndRecommendations'].map(name => ({ name }))
const message = ['chatConversations'].map(name => ({ name }))

// Capitalizes each word of name field and renders Link as kebab-cased, relative-path
const renderLink = (text: string) => <Link to={`/user/platform/administrator/${kebabCase(text)}/`}>{startCase(text)}</Link>

const columnsUser = createColumns([['Users', 'name', renderLink]])
const columnsTutoring = createColumns([['Tutoring', 'name', renderLink]])
const columnsSession = createColumns([['Sessions', 'name', renderLink]])
const columnsDiagnostic = createColumns([['Diagnostics', 'name', renderLink]])
const columnsMessage = createColumns([['Messages', 'name', renderLink]])

const defaultTableProps: TableProps<{ name: string }> = {
  pagination: false,
  rowKey: 'name',
  className: styles.tableWrapper,
  bordered: true,
}

const AdminHome = () => {
  return (
    <section className={styles.homeContainer}>
      <h1>UMS Admin</h1>
      <Row>
        <Table {...defaultTableProps} dataSource={user} columns={columnsUser} />
        <Table {...defaultTableProps} dataSource={tutoring} columns={columnsTutoring} />
        <div className={styles.flexColumn}>
          <Table {...defaultTableProps} dataSource={session} columns={columnsSession} />
          <Table {...defaultTableProps} dataSource={message} columns={columnsMessage} />
        </div>
        <Table {...defaultTableProps} dataSource={diagnostic} columns={columnsDiagnostic} />
      </Row>
    </section>
  )
}

export default AdminHome
