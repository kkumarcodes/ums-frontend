// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect } from 'react'
import ReactQuill from 'react-quill'
// Imported in global.scss
// import '~react-quill/dist/quill.snow.css'

const modules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }, { font: [] }],
    [{ size: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
  clipboard: {
    // toggle to add extra line breaks when pasting HTML:
    matchVisual: false,
  },
}

const condensedModules = {
  toolbar: [
    [{ header: '1' }],
    [{ size: [] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
  clipboard: {
    // toggle to add extra line breaks when pasting HTML:
    matchVisual: false,
  },
}

const formats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'bullet',
  'indent',
  'link',
  'image',
  'video',
]

interface Props {
  placeholder?: string
  initialHtml?: string
  shouldFocusOnMount?: boolean
  condensed?: boolean
}

const TempEditor = (
  { placeholder, initialHtml, shouldFocusOnMount = true, condensed = false, ...quillProps }: Props,
  ref: React.RefObject<ReactQuill>,
) => {
  useEffect(() => {
    if (shouldFocusOnMount) {
      ref?.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ReactQuill
      modules={condensed ? condensedModules : modules}
      formats={formats}
      ref={ref}
      placeholder={placeholder}
      defaultValue={initialHtml}
      {...quillProps}
    />
  )
}

export const RichTextEditor = React.forwardRef(TempEditor)
