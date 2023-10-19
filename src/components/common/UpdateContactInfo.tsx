// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Input, message, Select, Tag } from 'antd'
import useActiveStudent from 'libs/useActiveStudent'
import _ from 'lodash'
import moment from 'moment'
import { userInfo } from 'os'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { ALL_STATES, ALL_TIMEZONES, COMMON_TIMEZONES } from 'store/common/commonTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { fetchLocations } from 'store/tutoring/tutoringThunks'
import { getStudents, selectActiveUser } from 'store/user/usersSelector'
import { updateStudent, updateTutor } from 'store/user/usersThunks'
import {
  ActiveUser,
  Administrator,
  Counselor,
  Parent,
  Student,
  StudentUpdate,
  Tutor,
  UserType,
} from 'store/user/usersTypes'
import styles from './styles/UpdateContactInfo.scss'

const UpdateContactInfo = () => {
  const dispatch = useReduxDispatch()
  const activeStudent = useActiveStudent()
  const activeUser = useSelector(selectActiveUser)

  const userInfo: Student | Parent | Counselor | Tutor | Administrator = useSelector((state: RootState) => {
    if (activeUser?.userType === UserType.Parent) return activeStudent
    return state.user[`${activeUser?.userType}s`][activeUser?.cwUserID]
  })
  const locations = useSelector(selectLocations)

  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  const [first_name, setFirstName] = useState(userInfo?.first_name)
  const [last_name, setLastName] = useState(userInfo?.last_name)
  const [pronouns, setPronouns] = useState(activeStudent?.pronouns)
  const [email, setEmail] = useState(userInfo?.email)
  const [timezone, setTimeZone] = useState(userInfo?.timezone)
  const [high_school, setHighSchool] = useState((userInfo as StudentUpdate).high_school || '')
  const [previousHighSchool, setPreviousHighSchool] = useState('')
  const [high_schools, setHighSchools] = useState((userInfo as StudentUpdate).high_schools)
  const [graduation_year, setGraduationYear] = useState(
    (userInfo as StudentUpdate).graduation_year || moment().year() + 1,
  )
  const [location, setUserLocation] = useState(userInfo?.location ?? undefined)
  const [address, setAddress] = useState(userInfo?.address)
  const [address_line_two, setAddress_line_two] = useState(userInfo?.address_line_two)
  const [city, setCity] = useState(userInfo?.city)
  const [zip_code, setZip_code] = useState(userInfo?.zip_code)
  const [state, setState] = useState(userInfo?.state)
  const [country, setCountry] = useState(userInfo?.country)

  const resetData = () => {
    setFirstName(userInfo?.first_name)
    setLastName(userInfo?.last_name)
    setEmail(userInfo?.email)
    setTimeZone(userInfo?.set_timezone)

    if (userInfo.user_type === UserType.Student) {
      setHighSchool((userInfo as StudentUpdate).high_school)
      setHighSchools((userInfo as StudentUpdate).high_schools)
      setGraduationYear((userInfo as StudentUpdate).graduation_year)
      setUserLocation((userInfo as StudentUpdate).location)
      setPronouns((userInfo as StudentUpdate).pronouns)
    }

    if (userInfo.user_type === UserType.Student) {
      setAddress(userInfo?.address)
      setAddress_line_two(userInfo?.address_line_two)
      setCity(userInfo?.city)
      setZip_code(userInfo?.zip_code)
      setState(userInfo?.state)
      setCountry(userInfo?.country)
    }
  }

  useEffect(() => {
    resetData()
  }, [userInfo.pk, userInfo.user_type]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = () => {
    const actionThunkMap = {
      updateStudent: updateStudent(userInfo?.pk, {
        first_name,
        last_name,
        pronouns,
        set_timezone: timezone,
        high_school,
        high_schools,
        graduation_year,
        location_id: location as number,
        address,
        address_line_two,
        city,
        zip_code,
        state,
        country,
      }),
      updateTutor: updateTutor(userInfo?.pk, { first_name, last_name, email, set_timezone: timezone }),
    }
    if (userInfo.user_type === UserType.Student) {
      const res = dispatch(actionThunkMap.updateStudent)
      res.then(() => message.success('Your information has been updated'))
    } else if (userInfo.user_type === UserType.Tutor) {
      const res = dispatch(actionThunkMap.updateTutor)
      res.then(() => message.success('Your information has been updated'))
    } else {
      message.error('uh-oh, something went wrong. Your info has not been updated. :( ')
      throw new Error("Unsupported user type'")
    }
  }
  // }

  const studentHighSchool = () => {
    return (
      <>
        <label htmlFor="highSchool">Current High School:</label>
        <Input
          className={styles.Input}
          type="text"
          id="highSchool"
          name="highSchool"
          value={high_school}
          onChange={e => setHighSchool(e.target.value)}
          placeholder="Enter the name of your High School"
        />
      </>
    )
  }

  const studentHighSchools = () => {
    return (
      <>
        <label htmlFor="highSchools">Previous Schools:</label>
        <div className={styles.Input}>
          <Input
            type="text"
            id="highSchools"
            value={previousHighSchool}
            onChange={e => setPreviousHighSchool(e.target.value)}
            onPressEnter={e => {
              setHighSchools(prev => prev.concat(previousHighSchool))
              setPreviousHighSchool('')
            }}
            placeholder="Enter a school"
          />
          <div className="ant-form-item-explain">
            <small>Type a name and then hit enter to add</small>
          </div>
        </div>
        {!!high_schools.length && (
          <div className={styles.Tags}>
            <span>Previous Schools:&nbsp;&nbsp;</span>
            {high_schools.map(hs => (
              <Tag
                key={hs}
                closable
                onClose={(e: any) => {
                  e.preventDefault()
                  setHighSchools(prev => prev.filter(_hs => _hs !== hs))
                }}
              >
                {hs}
              </Tag>
            ))}
          </div>
        )}
      </>
    )
  }

  const { Option } = Select

  const studentGradYear = () => {
    const currentYear = moment().year()
    const grad_years = _.range(currentYear - 3, currentYear + 10)

    return (
      <>
        <label htmlFor="graduation_year"> Graduation Year:</label>
        <Select
          className={styles.Input}
          onChange={setGraduationYear}
          value={graduation_year}
          placeholder="Choose your graduation year"
          showSearch
        >
          {grad_years.map(year => (
            <Option value={year} key={year}>
              {year}
            </Option>
          ))}
        </Select>
      </>
    )
  }

  const studentLocationSelection = () => {
    const locationArray = Object.values(locations).sort((a, b) =>
      a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1,
    )
    return (
      <>
        <label htmlFor="location"> Location:</label>
        <Select
          className={styles.Input}
          onChange={setUserLocation}
          value={location as number}
          placeholder="select your location"
          allowClear
        >
          {locationArray.map(loc => (
            <Option value={loc.pk} key={loc.name}>
              {loc.name}
            </Option>
          ))}
        </Select>
      </>
    )
  }

  const studentAddress = () => {
    return (
      <>
        <label htmlFor="address">Address</label>
        <Input
          className={styles.Input}
          type="text"
          id="address"
          name="address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter your address"
        />
        <label htmlFor="address2" />
        <Input
          className={styles.Input}
          type="text"
          id="address2"
          name="address2"
          value={address_line_two}
          onChange={e => setAddress_line_two(e.target.value)}
          placeholder="(address line 2)"
        />

        <label htmlFor="city" />
        <Input
          className={styles.Input}
          type="text"
          id="city"
          name="city"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="City"
        />
        <label htmlFor="state" />
        <Select
          className={styles.Input}
          onChange={setState}
          value={state}
          // placeholder="select your location"
          allowClear
        >
          {ALL_STATES.map(state => (
            <Option value={state} key={state}>
              {state}
            </Option>
          ))}
        </Select>
        <label htmlFor="zipcode" />
        <Input
          className={styles.Input}
          type="text"
          id="zipcode"
          name="zipcode"
          value={zip_code}
          onChange={e => setZip_code(e.target.value)}
          placeholder="ZipCode"
        />
      </>
    )
  }

  const studentPronouns = () => {
    if (activeUser?.userType !== UserType.Parent) {
      return (
        <>
          <label htmlFor="pronouns">Pronouns:</label>
          <Input
            className={styles.Input}
            type="text"
            id="pronouns"
            name="pronouns"
            value={pronouns}
            onChange={e => setPronouns(e.target.value)}
          />
        </>
      )
    }
  }

  return (
    <div>
      <div className="vertical-form-container">
        <div className="formGroup">
          <label htmlFor="firstName">First name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="firstName"
            name="firstName"
            value={first_name}
            onChange={e => setFirstName(e.target.value)}
          />
          <label htmlFor="lastName">Last name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="lastName"
            name="lastName"
            value={last_name}
            onChange={e => setLastName(e.target.value)}
          />
          {studentPronouns()}
          <label htmlFor="email">Email:</label>
          <Input
            className={styles.Input}
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label htmlFor="timezone">Time Zone:</label>
          <Select className={styles.Input} onChange={e => setTimeZone(e)} defaultValue={timezone}>
            <Select.OptGroup label="Common">
              {COMMON_TIMEZONES.map(t => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select.OptGroup>
            <Select.OptGroup label="All">
              {ALL_TIMEZONES.map(t => (
                <Select.Option key={t} value={t}>
                  {t}
                </Select.Option>
              ))}
            </Select.OptGroup>
          </Select>

          {userInfo.user_type === UserType.Student && studentHighSchool()}
          {userInfo.user_type === UserType.Student && studentHighSchools()}
          {userInfo.user_type === UserType.Student && studentGradYear()}
          {userInfo.user_type === UserType.Student && studentAddress()}
          {userInfo.user_type === UserType.Student && studentLocationSelection()}

          <div className="actionsContainer">
            <Button onClick={handleUpdate} type="primary">
              Update
            </Button>
            &nbsp;&nbsp;
            <Button onClick={resetData}>Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateContactInfo
