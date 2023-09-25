// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { InfoCircleTwoTone } from '@ant-design/icons'
import { Button, Card, Form, Input, message, Radio, Steps, Select } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { RadioChangeEvent } from 'antd/lib/radio/interface'
import moment from 'moment'
import { handleError, PROGRAM_ADVISORS } from 'components/administrator'
import { WrappedTextInput, WrappedTimezoneSelect } from 'components/common/FormItems'

import React, { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { render } from 'react-dom'
import API from 'store/api'
import { DiagnosticRegistration, DiagnosticRegistrationType } from 'store/diagnostic/diagnosticTypes'
import { Counselor } from 'store/user/usersTypes'
import { GroupTutoringSession, Location } from 'store/tutoring/tutoringTypes'
import 'style/common/global.scss'
import styles from './Diagnostic.scss'
import SelfAssignDiagnostic from './SelfAssignDiagnostic'

declare const student_slug: string



type PostDiagnosticRegistration = Partial<DiagnosticRegistration> & { student_slug?: string }
type GroupTutoringSessionsWLocationDetails = Omit<GroupTutoringSession, 'location'> & { location: Location }
const DIAGNOSTIC_GTS_ENDPOINT = '/tutoring/diagnostic-group-tutoring-sessions/'
const DIAGNOSTIC_REGISTRATION_ENDPOINT = '/tutoring/diagnostic/registration/'
const COUNSELOR_ENDPOINT = '/tutoring/active-counselors/'

/**
 * App for Diagnostics GTS Landing page
 */
export const DiagnosticRegistrationPage = () => {
  const [form] = Form.useForm()
  const steps = ['Student', 'Parent', 'Academics', 'Register']
  const initialStep = student_slug ? 2 : 0
  const [currentStep, setCurrentStep] = useState(initialStep)
  // Disables counselor name question if user answers no to "Do you have a Collegewise counselor question"
  const [disableCounselor, setDisableCounselor] = useState(true)
  const [disableProgramAdvisor, setDisableProgramAdvisor] = useState(true)
  // Captures disability response from input field if user selected "other" radio group option
  const [otherDisabilityInput, setOtherDisabilityInput] = useState('')
  const [showSatDiagnostics, setShowSatDiagnostics] = useState(false)
  const [showActDiagnostics, setShowActDiagnostics] = useState(false)
  const [showSuccessPage, setShowSuccessPage] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [satDiagnostics, setSatDiagnostics] = useState<GroupTutoringSession[]>([])
  const [actDiagnostics, setActDiagnostics] = useState<GroupTutoringSession[]>([])
  const [registeredDiagnostics, setRegisteredDiagnostics] = useState<GroupTutoringSessionsWLocationDetails[]>([])
  const [hasSubmissionError, setHasSubmissionError] = useState(false)
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [showSelfAssign, setShowSelfAssign] = useState(false)
  const [selfAssignDiag, setSelfAssignDiag] = useState<number[]>([])

  useEffect(() => {
    API.get(DIAGNOSTIC_GTS_ENDPOINT)
      .then(({ data }: { data: GroupTutoringSession[] }) => {
        const incomingSatDiagnostics: GroupTutoringSession[] = []
        const incomingActDiagnostics: GroupTutoringSession[] = []
        data.forEach(gts => {
          if (gts.title.toLowerCase().includes('sat')) {
            incomingSatDiagnostics.push(gts)
          }
          if (gts.title.toLowerCase().includes('act')) {
            incomingActDiagnostics.push(gts)
          }
          setSatDiagnostics(
            incomingSatDiagnostics.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf()),
          )
          setActDiagnostics(
            incomingActDiagnostics.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf()),
          )
        })
      })
      .catch(err => handleError('Failed to retrieve diagnostics'))
  }, [])

  useEffect(() => {
    API.get(COUNSELOR_ENDPOINT)
      .then(data => {
        setCounselors(data.data)
      })
      .catch(err => handleError('Failed to fetch counselors'))
  }, [])

  const nextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Before we advance form, check that current step fields have valid input
  const handleNextClick = () => {
    if (currentStep === 0) {
      form
        .validateFields([
          'student_name',
          'student_email',
          'student_high_school',
          'student_graduation_year',
          'student_timezone',
        ])
        .then(() => nextStep())
        .catch(() => message.error('Fields incomplete.'))
    }
    if (currentStep === 1) {
      form
        .validateFields([
          'parent_name',
          'parent_email',
          'parent_phone_number',
          'parent_timezone',
          'hasCounselor',
          'counselor_pk',
          'program_advisor',
        ])
        .then(() => nextStep())
        .catch(() => message.error('Fields incomplete.'))
    }
    if (currentStep === 2) {
      // reset (in case user backtracks to this step)
      setShowSatDiagnostics(false)
      setShowActDiagnostics(false)
      setShowSelfAssign(false)

      const registrationTypeSelection = form.getFieldValue('registration_type')
      if (
        registrationTypeSelection === DiagnosticRegistrationType.SAT ||
        registrationTypeSelection === DiagnosticRegistrationType.BOTH
      ) {
        setShowSatDiagnostics(true)
      }
      if (
        registrationTypeSelection === DiagnosticRegistrationType.ACT ||
        registrationTypeSelection === DiagnosticRegistrationType.BOTH
      ) {
        setShowActDiagnostics(true)
      }
      form
        .validateFields([
          'sat_results',
          'act_results',
          'math_current',
          'math_grade11',
          'english_current',
          'disability',
          'accommodations',
          'registration_type',
        ])
        .then(() => nextStep())
        .catch(() => message.error('Fields incomplete.'))
    }
  }

  const handleFinish = (values: Store) => {
    const {
      student_name,
      student_email,
      parent_name,
      parent_email,
      registration_type,
      act_diagnostic,
      sat_diagnostic,
      ...remainingValues
    } = values

    const group_tutoring_sessions: number[] = []
    if (sat_diagnostic) {
      group_tutoring_sessions.push(sat_diagnostic)
    }
    if (act_diagnostic) {
      group_tutoring_sessions.push(act_diagnostic)
    }
    // Shape registration_data from remainingValues
    // If user doesn't have a counselor, set counselor name to empty string instead of undefined
    if (!remainingValues.hasCounselor) {
      remainingValues.counselor_pk = null
    }
    if (!remainingValues.hasProgramAdvisor) {
      remainingValues.hasProgramAdvisor = null
    }
    if (remainingValues.disability === 'other') {
      // On disability question, user selected "other" radio button, grab "other" Input value
      remainingValues.disability = otherDisabilityInput
    }
    const registration_data = remainingValues
    const payload: PostDiagnosticRegistration = {
      student_name,
      student_email,
      parent_name,
      parent_email,
      registration_type,
      student_slug,
      group_tutoring_sessions,
      registration_data,
      self_assigned_diagnostics: selfAssignDiag,
    }
    if (!(payload.self_assigned_diagnostics.length || payload.group_tutoring_sessions.length)) {
      message.error('Please select a diagnostic session')
      return
    }
    setSubmitting(true)
    API.post(DIAGNOSTIC_REGISTRATION_ENDPOINT, payload)
      .then(({ data }: { data: DiagnosticRegistration }) => {
        const { group_tutoring_sessions } = data
        const registeredDiagnostics: GroupTutoringSessionsWLocationDetails[] = []
        satDiagnostics.forEach(d => {
          if (group_tutoring_sessions.includes(d.pk)) {
            registeredDiagnostics.push(d)
          }
        })
        actDiagnostics.forEach(d => {
          if (group_tutoring_sessions.includes(d.pk)) {
            registeredDiagnostics.push(d)
          }
        })
        setRegisteredDiagnostics(registeredDiagnostics)
        setShowSuccessPage(true)
        setShowConfetti(true)
        message.success('Registration successful!')
        setTimeout(() => {
          setShowConfetti(false)
        }, 5000)
      })
      .catch(err => {
        setHasSubmissionError(true)
        setSubmitting(false)
      })
  }

  const studParentRequired = !student_slug
  return (
    <div className={`${styles.diagnosticPageContainer} app-white-container`}>
      {!showSuccessPage && (
        <div className="survey-header-container">
          <h2 className="survey-header rokkitt">SAT/ACT Diagnostic Registration</h2>
          <p className="survey-instructions">
            <InfoCircleTwoTone />
            &nbsp; If you have official scores from the PSAT, Pre-ACT, SAT, and/or ACT --- please email them to{' '}
            <a className="email-scores" href="mailto:albertd@collegewise.com">
              albertd@collegewise.com
            </a>
          </p>
        </div>
      )}
      {!showSuccessPage && (
        <Steps className="steps-block" size="small" current={currentStep}>
          {steps.map(title => (
            <Steps.Step key={title} title={<span className="step-title">{title}</span>} />
          ))}
        </Steps>
      )}
      {!showSuccessPage && (
        <Form
          onValuesChange={(changedValues, values) => {}}
          onFinish={handleFinish}
          size="large"
          layout="vertical"
          form={form}
        >
          <div className={`student-form-items ${currentStep === 0 ? '' : 'hidden'}`}>
            <WrappedTextInput
              name="student_name"
              label={<span className="form-label">Full Name</span>}
              isRequired={studParentRequired}
              placeholder="Enter student's full name"
            />
            <WrappedTextInput
              name="student_email"
              label={<span className="form-label">Email</span>}
              isRequired={studParentRequired}
              validateOnBlur={true}
              rules={[
                {
                  type: 'email',
                  message: 'Please enter a valid email',
                },
              ]}
              placeholder="Enter student's email"
            />
            <WrappedTextInput
              name="student_high_school"
              label={<span className="form-label">High School Name</span>}
              isRequired={studParentRequired}
              placeholder="Enter student's high school name"
            />
            <WrappedTextInput
              name="student_graduation_year"
              label={<span className="form-label">Graduation Year</span>}
              isRequired
              placeholder="Enter student's graduation year (e.g. 2022)"
              rules={[{ required: studParentRequired, message: 'Please enter a grad year' }]}
            />
            <WrappedTimezoneSelect
              name="student_timezone"
              placeholder="Select student's timezone"
              label={<span className="form-label">Timezone</span>}
              rules={[{ required: studParentRequired, message: 'Please make a selection' }]}
            />
          </div>
          <div className={`parent-form-items ${currentStep === 1 ? '' : 'hidden'}`}>
            <WrappedTextInput
              name="parent_name"
              label={<span className="form-label">Full Name</span>}
              isRequired={studParentRequired}
              placeholder="Enter parent's full name"
            />
            <WrappedTextInput
              name="parent_email"
              label={<span className="form-label">Email</span>}
              isRequired={studParentRequired}
              placeholder="Enter parent's email"
            />
            <WrappedTextInput
              name="parent_phone_number"
              label={<span className="form-label">Phone Number</span>}
              isRequired={studParentRequired}
              placeholder="Enter parent's phone number (e.g. 555-555-5555)"
            />
            <WrappedTimezoneSelect
              name="parent_timezone"
              placeholder="Select parent's timezone"
              label={<span className="form-label">Timezone</span>}
              rules={[{ required: studParentRequired, message: 'Please make a selection' }]}
            />
            <Form.Item
              name="hasCounselor"
              label={<span className="form-label">Are you working with a Collegewise counselor?</span>}
              rules={[{ required: studParentRequired, message: 'Please make a selection' }]}
            >
              <Radio.Group
                onChange={(e: RadioChangeEvent) => {
                  setDisableCounselor(!e.target.value)
                }}
              >
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Form.Item>
            {!disableCounselor && (
              <Form.Item name="counselor_pk">
                <Select placeholder="Select your counselor" className="counselor-dropdown">
                  {counselors.map(counselor => (
                    <Select.Option key={counselor.slug} value={counselor.pk}>
                      {counselor.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item
              name="hasProgramAdvisor"
              label={
                <span className="form-label">
                  Have you been working with one of our program advisors about your academic needs?
                </span>
              }
            >
              <Radio.Group
                onChange={(e: RadioChangeEvent) => {
                  setDisableProgramAdvisor(!e.target.value)
                }}
              >
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Form.Item>
            {!disableProgramAdvisor && (
              <Form.Item name="program_advisor">
                <Select placeholder="Select your advisor" className="counselor-dropdown">
                  {PROGRAM_ADVISORS.map(pm => (
                    <Select.Option key={pm} value={pm}>
                      {pm}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </div>
          <div className={`academic-form-items ${currentStep === 2 ? '' : 'hidden'}`}>
            <WrappedTextInput
              name="sat_results"
              label={
                <span className="form-label">
                  Has your student taken a PSAT or SAT? When was the test taken and what were his/her PSAT scores for
                  Reading (EBRW) and Math in the 160-760 score range for PSAT (200-800 for official SAT)? If no scores
                  are available, please put N/A.
                </span>
              }
              placeholder="Enter response"
              rules={[{ required: true, message: 'Please enter a response' }]}
            />
            <WrappedTextInput
              name="act_results"
              label={
                <span className="form-label">
                  Has your student taken a PreACT or ACT? When was the test taken and what were his/her scores for
                  English, Math, Reading, Science, and Composite? If no scores are available, please put N/A.
                </span>
              }
              rules={[{ required: true, message: 'Please enter a response' }]}
              placeholder="Enter response"
            />
            <WrappedTextInput
              name="math_current"
              label={
                <span className="form-label">
                  What level of math is your student currently in (Alg 2, Geometry, PreCalculus, Statistics, AP, Honors,
                  etc.) and what is their grade in the class?
                </span>
              }
              rules={[{ required: true, message: 'Please enter a response' }]}
              placeholder="Enter response"
            />
            <WrappedTextInput
              name="math_grade11"
              label={<span className="form-label">What level of math class are they enrolled in for 11th grade?</span>}
              rules={[{ required: true, message: 'Please enter a response' }]}
              placeholder="Enter response"
            />
            <WrappedTextInput
              name="english_current"
              label={
                <span className="form-label">
                  What level of English is your student currently in (English 2, Honors English 3, AP Language, etc.)
                  and what is their grade in the class?
                </span>
              }
              rules={[{ required: true, message: 'Please enter a response' }]}
              placeholder="Enter response"
            />
            <Form.Item
              name="disability"
              label={
                <span className="form-label">
                  Does your student have a documented learning difference and receive accommodations?
                </span>
              }
              rules={[{ required: true, message: 'Please make a selection' }]}
            >
              <Radio.Group className="disability-radio-group">
                <Radio className="disability-radio" value="yes">
                  Yes
                </Radio>
                <Radio className="disability-radio" value="no">
                  No
                </Radio>
                <Radio className="disability-radio" value="other">
                  <Input
                    onChange={e => {
                      if (e.target.value) {
                        form.setFieldsValue({ disability: 'other' })
                      }
                      setOtherDisabilityInput(e.target.value)
                    }}
                    placeholder="Other"
                  />
                </Radio>
              </Radio.Group>
            </Form.Item>
            <WrappedTextInput
              name="accommodations"
              label={
                <span className="form-label">
                  If applicable, what kind of accommodations does your student receive?
                </span>
              }
              placeholder="Enter response"
            />
            <Form.Item
              name="registration_type"
              label={
                <span className="form-label">
                  Do you plan on taking both the full-length PRACTICE ACT and SAT? (Please note, for the most
                  comprehensive test prep recommendations, we encourage students to take a full-length practice test of
                  both exam formats.)
                </span>
              }
              rules={[{ required: true, message: 'Please make a selection' }]}
            >
              <Radio.Group className="registration-type-radio-group">
                <Radio className="registration-type-radio" value="act">
                  ACT Only
                </Radio>
                <Radio className="registration-type-radio" value="sat">
                  SAT Only
                </Radio>
                <Radio className="registration-type-radio" value="both">
                  Both ACT and SAT
                </Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          <div className={`register-form-items ${currentStep === 3 ? '' : 'hidden'}`}>
            {showSatDiagnostics && (
              <Form.Item
                name="sat_diagnostic"
                label={<span className="form-label">Please select a SAT Diagnostic Test:</span>}
                rules={[{ required: !showSelfAssign }]}
              >
                <Radio.Group className="sat-diagnostic-radio-group">
                  {satDiagnostics.map(d => (
                    <Radio key={d.pk} className="sat-diagnostic-radio" value={d.pk}>
                      {`${moment(d.start).format('dddd, MMMM Do')} at ${moment(d.start).format('h:mm a')}-${moment(
                        d.end,
                      ).format('h:mm a')}`}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}
            {showActDiagnostics && (
              <Form.Item
                name="act_diagnostic"
                label={<span className="form-label">Please select a ACT Diagnostic Test:</span>}
                rules={[{ required: !showSelfAssign }]}
              >
                <Radio.Group className="act-diagnostic-radio-group">
                  {actDiagnostics.map(d => (
                    <Radio key={d.pk} className="act-diagnostic-radio" value={d.pk}>
                      {`${moment(d.start).format('dddd, MMMM Do')} at ${moment(d.start).format('h:mm a')}-${moment(
                        d.end,
                      ).format('h:mm a')}`}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}
            {!showSelfAssign && (
              <Button type="link" onClick={() => setShowSelfAssign(true)}>
                These times don&apos;t work for me...
              </Button>
            )}
            {showSelfAssign && <SelfAssignDiagnostic value={selfAssignDiag} onChange={setSelfAssignDiag} />}
          </div>
          {hasSubmissionError && (
            <div className="submission-error-wrapper">
              <div className="error-message">student/parent email address is invalid</div>
              <div className="error-button-wrapper">
                <Button
                  className="error-button"
                  type="primary"
                  onClick={() => {
                    setCurrentStep(0)
                    setHasSubmissionError(false)
                  }}
                >
                  Go Back and Enter New Email Addresses
                </Button>
              </div>
            </div>
          )}
          {!hasSubmissionError && (
            <div className="steps-action">
              {currentStep < steps.length - 1 && (
                <Button size="large" type="primary" className="btn btn-next" onClick={handleNextClick}>
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button size="large" type="primary" className="btn btn-submit" htmlType="submit" loading={submitting}>
                  Submit
                </Button>
              )}
              {currentStep > initialStep && (
                <Button size="large" style={{ margin: '0 8px' }} className="btn btn-previous" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
          )}
        </Form>
      )}
      {showSuccessPage && (
        <>
          {showConfetti && <Confetti />}
          <div className="success-page-header">
            <h2 className="rokkitt">Diagnostic Registration Summary</h2>
          </div>
          <div className="success-confirmation">
            Congratulations you have successfully registered! Please check your email for further details.
          </div>
          <div>
            {registeredDiagnostics.map(d => (
              <Card key={d.pk} title={<span className="card-title">{d.title}</span>} className="diagnostic-card">
                <div className="card-row">
                  <span className="card-row-label">Date:</span>
                  <span className="card-row-value">{moment(d.start).format('dddd, MMMM Do')}</span>
                </div>
                <div className="card-row">
                  <span className="card-row-label">Start Time:</span>
                  <span className="card-row-value">{moment(d.start).format('h:mm a')}</span>
                </div>
                <div className="card-row">
                  <span className="card-row-label">End Time:</span>
                  <span className="card-row-value">{moment(d.end).format('h:mm a')}</span>
                </div>
                {d.location.is_remote && (
                  <>
                    <div className="card-row">
                      <span className="card-row-label">Location</span>
                      <span className="card-row-value">Remote Session</span>
                    </div>
                    <div className="card-row">
                      <span className="card-row-label">Zoom Link:</span>
                      <span className="card-row-value">
                        <a href={d.zoom_url}>{d.zoom_url}</a>
                      </span>
                    </div>
                  </>
                )}
                {d.resources.length > 0 && (
                  <div className="card-row">
                    <span className="card-row-label">Resources</span>
                    <span className="card-row-value">
                      {d.resources.map(r => (
                        <span key={r.pk}>
                          <a key={r.pk} href={r.url}>
                            {r.title}
                          </a>
                          &nbsp;&nbsp;&nbsp;
                        </span>
                      ))}

                      <br />
                      <span className="help">Don&apos;t look at your test before the scheduled diagnostic session</span>
                    </span>
                  </div>
                )}
                {!d.location.is_remote && (
                  <>
                    <div className="card-row">
                      <span className="card-row-label">Center:</span>
                      <span className="card-row-value">{d.location.name}</span>
                    </div>
                    {d.location.address && (
                      <div className="card-row">
                        <span className="card-row-label">Address:</span>
                        <span className="card-row-value">
                          {d.location.address}
                          {d.location.address_line_two ? `, ${d.location.address_line_two}` : ''}
                        </span>
                      </div>
                    )}
                    {d.location.city && (
                      <div className="card-row">
                        <span className="card-row-label">City</span>
                        <span className="card-row-value">{d.location.city}</span>
                      </div>
                    )}
                    {d.location.state && (
                      <div className="card-row">
                        <span className="card-row-label">State</span>
                        <span className="card-row-value">{d.location.state}</span>
                      </div>
                    )}
                    {d.location.zip_code && (
                      <div className="card-row">
                        <span className="card-row-label">Zip Code</span>
                        <span className="card-row-value">{d.location.zip_code.padStart(5, '0')}</span>
                      </div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default DiagnosticRegistrationPage;
