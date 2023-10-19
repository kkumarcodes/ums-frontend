// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Tag, Tooltip } from 'antd'
import { AutocompleteCustomValue } from 'components/common/FormItems/AutocompleteCustomValue'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAllUniqueStudentTags, selectStudent } from 'store/user/usersSelector'

/**Short hand logging, to be removed */

const maxTagLength = 20

type Props = {
  tags: string[]
  setTags: React.Dispatch<React.SetStateAction<string[] | undefined>>
  // studentPK: number
}

const EditableTagGroup = ({ tags, setTags }: Props) => {
  const existingTags = useSelector(selectAllUniqueStudentTags)
  // const student = useSelector(selectStudent(studentPK))
  const [inputVisible, setInputVisible] = useState(false)

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter(value => value !== removedTag)

    setTags(newTags)
  }

  const showInput = () => {
    setInputVisible(true)
  }

  const handleInputConfirm = (newTag: string) => {
    if (!tags.includes(newTag)) {
      setTags(prev => [...prev, newTag])
      setInputVisible(false)
    }
  }

  return (
    <div>
      {tags?.map(tag => {
        const isLongTag = tag.length > maxTagLength
        const tagElem = (
          <Tag
            key={tag}
            closable
            onClose={() => {
              handleClose(tag)
            }}
          >
            {tag.slice(0, maxTagLength)}
          </Tag>
        )
        return isLongTag ? (
          <Tooltip title={tag} key={tag}>
            {tagElem}
          </Tooltip>
        ) : (
          tagElem
        )
      })}
      {inputVisible && (
        <AutocompleteCustomValue
          options={existingTags.map(tag => ({ label: tag, value: tag }))}
          onSelectCustomValue={handleInputConfirm}
          onSelect={handleInputConfirm}
          style={{ width: '100%' }}
        />
      )}
      {!inputVisible && (
        <Button size="small" type="dashed" onClick={showInput}>
          + New Tag
        </Button>
      )}
      <br />
    </div>
  )
}

export default EditableTagGroup
