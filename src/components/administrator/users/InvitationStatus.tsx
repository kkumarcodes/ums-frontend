// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckOutlined, LinkOutlined, ReloadOutlined, UserAddOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Input, message } from 'antd'
import styles from 'components/administrator/styles/InvitationStatus.scss'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsTutor } from 'store/user/usersSelector'
import { fetchUser, inviteUser } from 'store/user/usersThunks'
import { UserType } from 'store/user/usersTypes'

type Props = {
  userID: number
  userType: UserType
}

const InvitationStatus = ({ userID, userType }: Props) => {
  const dispatch = useReduxDispatch()

  const isTutor = useSelector(selectIsTutor)
  const [loaded, setLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const copyInput = useRef<Input>()

  const user = useSelector((state: RootState) => {
    switch (userType) {
      case UserType.Student:
        return state.user.students[userID]
      case UserType.Tutor:
        return state.user.tutors[userID]
      case UserType.Counselor:
        return state.user.counselors[userID]
      case UserType.Parent:
        return state.user.parents[userID]
      default:
        return null
    }
  }, shallowEqual)

  const userExists = Boolean(user)

  useEffect(() => {
    if (!userExists && !loaded) {
      dispatch(fetchUser(userType, userID))
      setLoaded(true)
    }
  }, [dispatch, loaded, userExists, userID, userType])

  /**
   * Dispatch thunk to send invite to user. Will only work if user exists
   * and their account is not yet created
   */
  const sendInvite = async () => {
    if (!user) {
      throw new Error('Cannot invite user who does not exist')
    }
    setSending(true)
    try {
      await dispatch(inviteUser(user.slug, userType))
    } catch (err) {
      message.error('Failed to send invite :(')
    }

    setSending(false)
  }

  /**
   * Copy the content of our copyInput ref (to clipboard), which is an input containing
   * invitation link
   */
  const copyInviteLink = () => {
    if (copyInput.current) {
      copyInput.current.select()
      document.execCommand('copy')
      message.success('Copied link to your clipboard!')
    }
  }

  let className = 'error'
  if (userExists || !loaded) {
    className = user?.account_is_created ? 'success' : 'warning'
  }

  // Appears before input
  const copyInviteButton = (
    <Button type="link" onClick={copyInviteLink}>
      <LinkOutlined /> Copy Link
    </Button>
  )

  const inviteContent = (
    <div className="inviteContent">
      <p>
        <WarningOutlined />
        &nbsp;
        <strong>{user?.first_name} has not created their account yet.</strong>
      </p>
      {/* Hide Send Invite prompt if activeUser is a Tutor (only Admins can send invite) */}
      {!isTutor && (
        <p>
          Last invite sent:&nbsp;{user?.last_invited ? moment(user?.last_invited).format('MMM Do h:mma') : 'Never!'}
          &nbsp;
          <Button disabled={sending} type="default" onClick={sendInvite}>
            {user?.last_invited && (
              <>
                <ReloadOutlined spin={sending} />
                &nbsp; Resend
              </>
            )}
            {!user?.last_invited && (
              <>
                <UserAddOutlined spin={sending} />
                &nbsp; Send
              </>
            )}
          </Button>
        </p>
      )}
      <p>
        {user?.first_name} can register via this link:
        <Input ref={copyInput} addonBefore={copyInviteButton} readOnly={true} value={user?.accept_invite_url} />
      </p>
    </div>
  )

  return (
    <div className={`${styles.invitationStatus} ${className}`}>
      {!userExists && !loaded && <p>Loading...</p>}
      {!userExists && loaded && <p>Server error...</p>}
      {user?.account_is_created && (
        <p>
          <CheckOutlined />
          Account is created
        </p>
      )}
      {userExists && !user?.account_is_created && inviteContent}
    </div>
  )
}

export default InvitationStatus
