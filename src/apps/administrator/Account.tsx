// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { NotificationList } from 'components/common'
import { AdministratorNotifications } from 'store/notification/notificationsTypes'
import { SettingOutlined, MessageOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import { UserType } from 'store/user/usersTypes'
import { useSelector } from 'react-redux'
import { selectAdministrator, selectAdministrators, selectCWUserID } from 'store/user/usersSelector'

const AdminAccount = () => {
  const cwUserID = useSelector(selectCWUserID)
  const administrator = useSelector(selectAdministrator(cwUserID))
  const accountTab = (
    <span>
      <SettingOutlined />
      Account Info
    </span>
  )
  const notificationsTab = (
    <span>
      <MessageOutlined />
      Notifications
    </span>
  )

  return (
    <Tabs defaultActiveKey="account">
      <Tabs.TabPane tab={accountTab} key="account">
        <h1>Account Details</h1>
      </Tabs.TabPane>
      <Tabs.TabPane tab={notificationsTab} key="notifications">
        <h1>Notifications</h1>
        {administrator && (
          <NotificationList
            notificationRecipientID={administrator.notification_recipient}
            userType={UserType.Administrator}
            notifications={AdministratorNotifications}
          />
        )}
      </Tabs.TabPane>
    </Tabs>
  )
}

export default AdminAccount
