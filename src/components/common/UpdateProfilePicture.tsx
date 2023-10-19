// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Upload } from 'antd'
import { UploadChangeParam } from 'antd/lib/upload'
import { UploadFile } from 'antd/lib/upload/interface'
import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectCWUser } from 'store/user/usersSelector'
import { updateCounselor, updateStudent, updateTutor } from 'store/user/usersThunks'
import { Counselor, UserType } from 'store/user/usersTypes'
import styles from './styles/UpdateProfilePicture.scss'

type Props = {
  cwUserID: number
  userType: UserType
}

const UPLOAD_ACTION = '/cw/upload/'
const ACCEPT_IMAGES = 'image/png, image/jpeg'

// Map from user type to our update user thunk
const UPDATE_THUNK_MAP = {
  [UserType.Counselor]: updateCounselor,
  [UserType.Tutor]: updateTutor,
  [UserType.Student]: updateStudent,
}

const UpdateProfilePicture = ({ cwUserID, userType }: Props) => {
  const cwUser = useSelector(selectCWUser(cwUserID, userType))
  const [saving, setSaving] = useState(false)
  const dispatch = useReduxDispatch()

  const doUpdateUser = useCallback(
    async (updateData: Partial<Counselor>) => {
      const updateFunction = UPDATE_THUNK_MAP[userType]
      if (!updateFunction) throw new Error(`Cannot set profile picture of user type ${userType}`)
      setSaving(true)
      await dispatch(updateFunction(cwUserID, updateData))
      setSaving(false)
    },
    [cwUserID, dispatch, userType],
  )

  // Helper for uploading a new profile picture. We update Counselor immediately
  const uploadProfilePicture = async (changeParams: UploadChangeParam<UploadFile<any>>) => {
    if (changeParams.file?.response?.slug) {
      doUpdateUser({ update_profile_picture: changeParams.file.response.slug })
    }
  }

  return (
    <div className={styles.updateProfilePicture}>
      <div className="settings-section profile-picture">
        <div className="flex">
          <div className="profile-picture-form">
            <h2>Profile Picture</h2>
            <p className="help">
              Upload a profile picture to replace your avatar.
              <br />
              Recommended: Upload a square picture.
            </p>
            <Upload
              accept={ACCEPT_IMAGES}
              name="file"
              action={UPLOAD_ACTION}
              showUploadList={false}
              onChange={uploadProfilePicture}
            >
              <Button loading={saving} type="default">
                Select a file...
              </Button>
            </Upload>
          </div>
          <div className="profile-picture-preview">
            {cwUser?.profile_picture ? (
              <Avatar size="large" src={cwUser.profile_picture} />
            ) : (
              <Avatar size="large" icon={<UserOutlined />} />
            )}
            {cwUser?.profile_picture && (
              <Button
                loading={saving}
                type="default"
                size="small"
                onClick={() => doUpdateUser({ update_profile_picture: null })}
              >
                <DeleteOutlined />
                &nbsp;Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default UpdateProfilePicture
