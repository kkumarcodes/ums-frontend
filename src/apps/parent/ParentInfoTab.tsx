// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Input, message, Select, Tag } from 'antd'
import { getFullName } from 'components/administrator/utils'
import { NotificationList } from 'components/common'
import styles from 'components/common/styles/UpdateContactInfo.scss'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ALL_STATES, ALL_TIMEZONES, COMMON_TIMEZONES } from 'store/common/commonTypes'
import { useReduxDispatch } from 'store/store'
import { fetchLocations } from 'store/tutoring/tutoringThunks'
import { getStudents, selectActiveUser, selectCWUser } from 'store/user/usersSelector'
import { updateParent } from 'store/user/usersThunks'
import { Parent, UserType } from 'store/user/usersTypes'

const ParentInfoTab = () => {
  const dispatch = useReduxDispatch()
  const activeUser = useSelector(selectActiveUser)

  const activeParent = useSelector(
    selectCWUser(activeUser?.cwUserID as number, activeUser?.userType as UserType),
  ) as Parent

  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  const [parentState, setParentState] = useState(activeParent)
  const studentDict = useSelector(getStudents)

  const handleUpdate = async () => {
    try {
      await dispatch(updateParent(activeParent.pk, parentState))
      message.success('Your information has been updated')
    } catch (error) {
      message.error('uh-oh, something went wrong. Your info has not been updated. :( ')
    }
  }

  const updateParentState = (e: any) => {
    e.persist()
    setParentState(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const parentAddress = () => {
    return (
      <>
        <span>
          <label htmlFor="address">Address</label>
          <Input
            className={styles.Input}
            type="text"
            id="address"
            name="address"
            value={parentState.address}
            onChange={updateParentState}
            placeholder="Enter your address"
          />
          <label htmlFor="address_line_two" />
          <Input
            className={styles.Input}
            type="text"
            id="address_line_two"
            name="address_line_two"
            value={parentState.address_line_two}
            onChange={updateParentState}
            placeholder="(address line 2)"
          />
        </span>
        <span>
          <label htmlFor="city" />
          <Input
            className={styles.Input}
            type="text"
            id="city"
            name="city"
            value={parentState.city}
            onChange={updateParentState}
            placeholder="City"
          />
          <label htmlFor="state" />
          <Select
            className={styles.Input}
            onChange={value => setParentState(prev => ({ ...prev, state: value }))}
            value={parentState.state}
            placeholder="select your state"
            allowClear
          >
            {ALL_STATES.map(state => (
              <Select.Option value={state} key={state}>
                {state}
              </Select.Option>
            ))}
          </Select>
          <label htmlFor="zip_code" />
          <Input
            className={styles.Input}
            type="text"
            id="zip_code"
            name="zip_code"
            value={parentState.zip_code}
            onChange={updateParentState}
            placeholder="ZipCode"
          />
        </span>
      </>
    )
  }

  return (
    <div>
      <NotificationList
        notificationRecipientID={activeParent.notification_recipient}
        userType={UserType.Parent}
        notifications={[]}
      />

      <div className="vertical-form-container">
        <div className="formGroup">
          <label htmlFor="first_name">First Name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="first_name"
            name="first_name"
            value={parentState.first_name}
            onChange={updateParentState}
          />
          <label htmlFor="last_name">Last Name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="last_name"
            name="last_name"
            value={parentState.last_name}
            onChange={updateParentState}
          />
          <label htmlFor="email">Email:</label>
          <Input
            className={styles.Input}
            type="email"
            id="email"
            name="email"
            value={parentState.email}
            onChange={updateParentState}
          />
          <label htmlFor="secondary_parent_first_name">Secondary Parent First Name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="secondary_parent_first_name"
            name="secondary_parent_first_name"
            value={parentState.secondary_parent_first_name}
            onChange={updateParentState}
          />
          <label htmlFor="secondary_parent_last_name">Secondary Parent Last Name:</label>
          <Input
            className={styles.Input}
            type="text"
            id="secondary_parent_last_name"
            name="secondary_parent_last_name"
            value={parentState.secondary_parent_last_name}
            onChange={updateParentState}
          />
          <label htmlFor="secondary_parent_phone_number">Secondary Parent Phone Number:</label>
          <Input
            className={styles.Input}
            type="text"
            id="secondary_parent_phone_number"
            name="secondary_parent_phone_number"
            value={parentState.secondary_parent_phone_number}
            onChange={updateParentState}
          />
          <label htmlFor="students">Students:</label>
          <div className={styles.Input}>
            {activeParent.students.map(stu => (
              <Tag key={stu}>{getFullName(studentDict[stu])}</Tag>
            ))}
          </div>
          <label htmlFor="set_timezone">Time Zone:</label>
          <Select
            className={styles.Input}
            onChange={value => setParentState(prev => ({ ...prev, set_timezone: value }))}
            defaultValue={parentState.timezone}
          >
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

          {activeParent.user_type === UserType.Parent && parentAddress()}

          <div className="actionsContainer">
            <Button onClick={handleUpdate} type="primary">
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParentInfoTab
