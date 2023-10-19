// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import _, { sortBy, values } from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import { AutoComplete, Input } from 'antd'
import {history} from 'App'
import { selectIsCounselor } from 'store/user/usersSelector'
import { getFullName } from 'components/administrator'
import styles from './styles/Search.scss'

const Search = () => {
  const [search, setSearch] = useState('')
  const isCounselor = useSelector(selectIsCounselor)
  const students = useSelector((state: RootState) =>
    isCounselor ? sortBy(values(state.user.students), 'last_name') : [],
  )
  const universities = useSelector((state: RootState) => sortBy(values(state.university.universities), 'name'))

  const options = [
    ...students.map(s => ({ label: getFullName(s), value: `/profile/student/${s.pk}/` })),
    ...universities.map(u => ({ label: u.name, value: `/school/${u.iped}/` })),
  ]

  const optionFilter = (val: string, option: { label: string; value: string }) =>
    option.label.toLowerCase().includes(val.toLowerCase())

  const onSelect = (path: string) => {
    History.push(path)
    setSearch('') // Don't display selected value
    return false
  }

  return (
    <div className={styles.search}>
      <AutoComplete
        options={options}
        filterOption={optionFilter}
        onSelect={onSelect}
        showSearch={true}
        defaultActiveFirstOption={true}
        value={search}
        onSearch={setSearch}
      >
        <Input.Search placeholder={`Search for ${isCounselor && 'student or'} university`} />
      </AutoComplete>
    </div>
  )
}
export default Search
