// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Input } from 'antd'
import { AddUserForm, SearchProvider, UserTable } from 'components/administrator'
import styles from 'components/administrator/styles/Page.scss'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import { startCase } from 'lodash'
import React, { useEffect, useState } from 'react'
import { UserType } from 'store/user/usersTypes'

type Props = {
  userType: UserType
  refresh?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const CSVMap = {
  [UserType.Student]: CSVDataTypes.Student,
  [UserType.Parent]: CSVDataTypes.Parent,
  [UserType.Counselor]: CSVDataTypes.Counselor,
  [UserType.Tutor]: CSVDataTypes.Tutor,
  [UserType.Administrator]: CSVDataTypes.Administrator,
}

/**
 * Component renders a user page of type @param userType
 * Page contains an AddUserButton modal and User Table
 */
export const UserPage = ({ userType }: Props) => {
  const { Search } = Input
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    setSearchText('')
  }, [userType])

  return (
    <section className={styles.userPage}>
      <h1>{startCase(userType)} Table</h1>
      <SearchProvider value={{ searchText, setSearchText }}>
        <div className={styles.addButtonWrapper}>
          <Search
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by name or email"
            value={searchText}
            allowClear
          />
          <DownloadCSVButton dataType={CSVMap[userType]} />
          <AddUserForm userType={userType} />
        </div>
        <UserTable userType={userType} />
      </SearchProvider>
    </section>
  )
}
export default UserPage
