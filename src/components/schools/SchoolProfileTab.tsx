// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  BarChartOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  CheckOutlined,
  FacebookOutlined,
  HomeOutlined,
  InstagramOutlined,
  LoginOutlined,
  LogoutOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  TwitterOutlined,
  YoutubeOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Dropdown, Empty, Menu, Select, Skeleton, Tabs, Tooltip } from 'antd'
import {
  CONCORDANCE_MAP,
  DataEntry,
  dataScatter,
  Dataset,
  datasetOptions,
  DecisionResult,
  initialScatterDataset,
  optionsBarChart,
  optionsStackedBarChart,
  PROMPT_ESSAY_REQUIREMENTS,
  ScatterDataset,
  scatterOptionsTestOptional,
  scatterOptionsTestSubmitted,
  UNIVERSITY_TEST_DATA_ENDPOINT,
} from 'components/schools/schoolProfileChartConfigs'
import SUDCard from 'components/schools/StudentUniversityDecisioncard'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { calculateACTSuperscore, calculateSATSuperscore } from 'libs'
import useActiveStudent from 'libs/useActiveStudent'
import { clone, cloneDeep, isEmpty, map, range, startCase, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { Bar, HorizontalBar, Scatter } from 'react-chartjs-2'
import { useSelector } from 'react-redux'
import { Route } from 'react-router-dom'
import API from 'store/api'
import { selectTestResults } from 'store/diagnostic/diagnosticSelectors'
import { fetchTestResults } from 'store/diagnostic/diagnosticThunks'
import { TestType } from 'store/diagnostic/diagnosticTypes'
import { useReduxDispatch } from 'store/store'
import { selectSUDPKByUniStudent } from 'store/university/universitySelectors'
import { fetchDeadlines, fetchStudentUniversityDecisions, fetchUniversities } from 'store/university/universityThunks'
import {
  AdmissionDecision,
  ScorecardData,
  University,
  UniversityTestData,
  UniversityTestDataKeys,
} from 'store/university/universityTypes'
import CampusReel from './CampusReel'
import { initialStackedBarChartDataset } from './schoolProfileChartConfigs'
import styles from './styles/SchoolProfilePage.scss'

const ACCEPTED = AdmissionDecision.Accepted.toLowerCase()
const NOT_ACCEPTED = AdmissionDecision.NotAccepted.toLowerCase()
const WAITLISTED = AdmissionDecision.Waitlisted.toLowerCase()

const selectOptions = values(Dataset).map(value => ({ label: value, value }))

const TestOptional = {
  Yes: true,
  No: false,
}

enum InStateOptions {
  'In State',
  'Out of State',
}

enum DecisionOptions {
  EA = 'EA',
  ED = 'ED',
  RD = '',
  REA = 'REA',
}

const DEBRIEF_YEARS = range(2015, moment().year() + 1)

type Props = {
  university: University
}

const SchoolProfileTab = ({ university }: Props) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(true)
  const activeStudent = useActiveStudent()
  const activeStudentPK = activeStudent?.pk
  const SUDPK = useSelector(selectSUDPKByUniStudent(activeStudent?.pk, university?.pk))
  const testResults = useSelector(selectTestResults).filter(tr => tr.student === activeStudentPK)

  const studentGPA = activeStudent?.cw_gpa
  const studentSAT = calculateSATSuperscore(testResults.filter(test => test.test_type === TestType.SAT))
  const studentACT = calculateACTSuperscore(testResults.filter(test => test.test_type === TestType.ACT))

  // Used in programatically updating scatter plot
  const scatterRef = useRef(null)
  // Used to store stacked bar chart data across renders
  const stackedBarChartDataRef = useRef(initialStackedBarChartDataset)

  // We use a ref to store scatter plot data across renders because chartjs handles rerendering chart data
  const scatterDataSource = useRef(cloneDeep(initialScatterDataset))
  // RAW universityTestData is stored in a ref
  const universityTestDataRef = useRef<{ dataEntries: UniversityTestData[] }>({
    dataEntries: [],
  })
  const [showScattergram, setShowScattergram] = useState(true)
  const [dataStackedBarChart, setDataStackedBarChart] = useState({})
  // Currently active scatter plot data
  const [selectedDataset, setSelectedDataset] = useState<Dataset>()
  const [selectedInState, setSelectedInState] = useState<InStateOptions[]>([
    InStateOptions['In State'],
    InStateOptions['Out of State'],
  ])
  const [selectedDecisions, setSelectedDecisions] = useState<DecisionOptions[]>([
    DecisionOptions.EA,
    DecisionOptions.ED,
    DecisionOptions.RD,
    DecisionOptions.REA,
  ])
  const yearsMenuRef = useRef<HTMLDivElement>(null)
  const [selectedYears, setSelectedYears] = useState<number[]>(DEBRIEF_YEARS)
  const [yearsVisible, setYearsVisible] = useState(false)
  useOnClickOutside(yearsMenuRef, () => setYearsVisible(false))

  // Helper functions to set state variables
  const setInState = (val: InStateOptions) => {
    if (selectedInState.includes(val)) setSelectedInState(selectedInState.filter(v => v !== val))
    else setSelectedInState([...selectedInState, val])
  }
  const setDecisions = (val: DecisionOptions) => {
    if (selectedDecisions.includes(val)) setSelectedDecisions(selectedDecisions.filter(v => v !== val))
    else setSelectedDecisions([...selectedDecisions, val])
  }

  // Make scatter plot data available to ChartJS
  // Note: We spread to clone the dataSource
  // otherwise we run into a mutation bug because of assigning by reference

  // Helper function to filter data entries based on In State/Out of State, ED/RD/EA, Grad Year
  const filterScatterDataPoints = (entries: DataEntry[]) =>
    clone(
      entries.filter(e => {
        const isInState = e[UniversityTestDataKeys.HomeState] === university?.state
        if (
          (isInState && !selectedInState.includes(InStateOptions['In State'])) ||
          (!isInState && !selectedInState.includes(InStateOptions['Out of State']))
        ) {
          return false
        }
        if (!selectedDecisions.includes(e[UniversityTestDataKeys.AppDeadline] as DecisionOptions)) return false
        if (!(e[UniversityTestDataKeys.ClassOf] && selectedYears.includes(Number(e[UniversityTestDataKeys.ClassOf]))))
          return false
        return true
      }),
    )

  if (selectedDataset) {
    dataScatter.datasets[DecisionResult.Accepted].data = filterScatterDataPoints(
      scatterDataSource.current[selectedDataset][DecisionResult.Accepted],
    )
    dataScatter.datasets[DecisionResult.NotAccepted].data = filterScatterDataPoints(
      scatterDataSource.current[selectedDataset][DecisionResult.NotAccepted],
    )
    dataScatter.datasets[DecisionResult.Waitlisted].data = filterScatterDataPoints(
      scatterDataSource.current[selectedDataset][DecisionResult.Waitlisted],
    )
    dataScatter.datasets[DecisionResult.MyScore].data = clone(
      scatterDataSource.current[selectedDataset][DecisionResult.MyScore],
    )
  }

  // Add tooltip callbacks to scatter plot options prop
  scatterOptionsTestSubmitted.tooltips.callbacks = {
    beforeLabel: (item, data) => renderBeforeLabel(item),
    label: (items, data) => {
      const datum: DataEntry = data.datasets[items.datasetIndex].data[items.index]
      return [
        `Honors: ${datum.Honors || 'NA'}`,
        `AP/IB/Coll: ${datum[UniversityTestDataKeys.AP_IB_Coll] || 'NA'}`,
        `Major: ${datum.Major ? datum.Major : 'NA'} `,
        `Deadline: ${datum[UniversityTestDataKeys.AppDeadline] ? datum[UniversityTestDataKeys.AppDeadline] : 'NA'} `,
        '',
      ]
    },
  }

  // Add tooltip callbacks to Test Optional scatter plot options prop
  scatterOptionsTestOptional.tooltips.callbacks = {
    beforeLabel: (item, data) => renderBeforeLabelForTestOptional(item),
    label: (items, data) => {
      const datum: DataEntry = data.datasets[items.datasetIndex].data[items.index]
      return [
        `Major: ${datum.Major ? datum.Major : 'NA'} `,
        `Deadline: ${datum[UniversityTestDataKeys.AppDeadline] ? datum[UniversityTestDataKeys.AppDeadline] : 'NA'} `,
        '',
      ]
    },
  }

  const scorecard_data = university?.scorecard_data
  const needLoadUniversity = !university

  const hasScore = {
    satReading: scorecard_data?.SATVR25 !== 'NULL' && scorecard_data?.SATVR75 !== 'NULL',
    satMath: scorecard_data?.SATMT25 !== 'NULL' && scorecard_data?.SATMT75 !== 'NULL',
    actComposite: scorecard_data?.ACTCM25 !== 'NULL' && scorecard_data?.ACTCM75 !== 'NULL',
    actMath: scorecard_data?.ACTMT25 !== 'NULL' && scorecard_data?.ACTMT75 !== 'NULL',
    actReading: scorecard_data?.ACTEN25 !== 'NULL' && scorecard_data?.ACTEN75 !== 'NULL',
  }
  const hasAnyTestScore = values(hasScore).reduce((acc, cur) => acc || cur, false)

  const satTestScoreData = {
    labels: generateLabels(Dataset.Sat, hasScore),
    datasets: [
      {
        label: Dataset.Sat,
        ...datasetOptions,
        data: generateTestScoreData(Dataset.Sat, hasScore, scorecard_data),
      },
    ],
  }

  const actTestScoreData = {
    labels: generateLabels(Dataset.Act, hasScore),
    datasets: [
      {
        label: Dataset.Act,
        ...datasetOptions,
        data: generateTestScoreData(Dataset.Act, hasScore, scorecard_data),
      },
    ],
  }

  useEffect(() => {
    const promises: Promise<any>[] = []
    if (needLoadUniversity) {
      promises.push(dispatch(fetchUniversities()))
    }
    if (!SUDPK) {
      promises.push(dispatch(fetchStudentUniversityDecisions()))
    }

    setLoading(true)
    Promise.all(promises).finally(() => setLoading(false))
  }, [SUDPK, dispatch, needLoadUniversity])

  // Fetch Deadline and TestResults (for ScatterPlot) whenever activeStudent changes
  useEffect(() => {
    if (activeStudentPK) {
      Promise.all([dispatch(fetchDeadlines({ student: activeStudentPK })), dispatch(fetchTestResults())])
    }
  }, [activeStudentPK, dispatch])

  // Fetch universityTestData once we have university
  const universityPK = university?.pk

  /** Helper to process and filter Test Optional stacked bar chart data */
  const processAndFilterStackedBarChartDataEntries = (dateEntries: UniversityTestData[]) => {
    // Reset stackedBarChartDataRef
    stackedBarChartDataRef.current = { ...initialStackedBarChartDataset }
    // Process universityTestData to create stackedBarChartData
    filterScatterDataPoints(dateEntries).forEach(dataEntry => {
      const admissionDecision = dataEntry[UniversityTestDataKeys.AdmissionDecision]?.toLowerCase() ?? ''
      // Case 1: Applied Test Optional === true
      if (dataEntry[UniversityTestDataKeys.AppliedTestOptional] === TestOptional.Yes) {
        // NOTE: Order matters, we must first test for 'not accepted' decisions
        // (see universityTypes.AcceptanceStatus for possible values of 'Admission Decission')
        if (admissionDecision.includes(NOT_ACCEPTED)) {
          stackedBarChartDataRef.current.notSubmittedAndNotAdmittedPercent += 1
        } else if (admissionDecision.includes(ACCEPTED)) {
          stackedBarChartDataRef.current.notSubmittedAndAdmittedPercent += 1
        }
      }
      // Case 2: Applied Test Optional === false
      if (dataEntry[UniversityTestDataKeys.AppliedTestOptional] === TestOptional.No) {
        if (admissionDecision.includes(NOT_ACCEPTED)) {
          stackedBarChartDataRef.current.submittedAndNotAdmittedPercent += 1
        } else if (admissionDecision.includes(ACCEPTED)) {
          stackedBarChartDataRef.current.submittedAndAdmittedPercent += 1
        }
      }
      // Case 3: Implicit Applied Test Optional === true - based on dataEntry lacking test assessment data
      if (
        dataEntry[UniversityTestDataKeys.AppliedTestOptional] === null &&
        !dataEntry.ACT &&
        !dataEntry[UniversityTestDataKeys.SATSingle]
      ) {
        if (admissionDecision.includes(NOT_ACCEPTED)) {
          stackedBarChartDataRef.current.notSubmittedAndNotAdmittedPercent += 1
        } else if (admissionDecision.includes(ACCEPTED)) {
          stackedBarChartDataRef.current.notSubmittedAndAdmittedPercent += 1
        }
      }
      // Case 4: Implicit Applied Test Optional === false - based on dataEntry containing some test assessment data
      if (
        dataEntry[UniversityTestDataKeys.AppliedTestOptional] === null &&
        (dataEntry.ACT || dataEntry[UniversityTestDataKeys.SATSingle])
      ) {
        if (admissionDecision.includes(NOT_ACCEPTED)) {
          stackedBarChartDataRef.current.submittedAndNotAdmittedPercent += 1
        } else if (admissionDecision.includes(ACCEPTED)) {
          stackedBarChartDataRef.current.submittedAndAdmittedPercent += 1
        }
      }
    })
    const totalSubmittedCount = Math.max(
      stackedBarChartDataRef.current.submittedAndAdmittedPercent +
        stackedBarChartDataRef.current.submittedAndNotAdmittedPercent,
      1,
    )
    const totalNotSubmittedCount = Math.max(
      stackedBarChartDataRef.current.notSubmittedAndAdmittedPercent +
        stackedBarChartDataRef.current.notSubmittedAndNotAdmittedPercent,
      1,
    )
    const submittedAndAdmittedPercent = Math.round(
      (stackedBarChartDataRef.current.submittedAndAdmittedPercent / totalSubmittedCount) * 100,
    )
    const notSubmittedAndAdmittedPercent = Math.round(
      (stackedBarChartDataRef.current.notSubmittedAndAdmittedPercent / totalNotSubmittedCount) * 100,
    )
    const submittedAndNotAdmittedPercent = 100 - submittedAndAdmittedPercent
    const notSubmittedAndNotAdmittedPercent = 100 - notSubmittedAndAdmittedPercent

    // Stacked bar chart data state variable
    setDataStackedBarChart({
      labels: ['Submitted', 'Not Submitted'],
      datasets: [
        {
          stack: 'arbitraryKeyThatTellsBarsToStack',
          label: '% Admitted',
          backgroundColor: 'rgba(54, 162, 235, 1)',
          data: [submittedAndAdmittedPercent, notSubmittedAndAdmittedPercent],
        },
        {
          stack: 'arbitraryKeyThatTellsBarsToStack',
          label: ' % Not Admitted',
          backgroundColor: 'rgba(255, 99, 132, 1)',
          data: [submittedAndNotAdmittedPercent, notSubmittedAndNotAdmittedPercent],
        },
      ],
    })
  }

  useEffect(() => {
    if (universityPK) {
      API.get(UNIVERSITY_TEST_DATA_ENDPOINT(universityPK))
        .then(({ data: universityTestDataEntries }: { data: UniversityTestData[] }) => {
          // store raw universityTestData
          universityTestDataRef.current.dataEntries = clone(universityTestDataEntries)
          // Initialize process and filtering of stacked bar chart data
          setShowScattergram(true)
          processAndFilterStackedBarChartDataEntries(universityTestDataEntries)

          // Process scatter chart data
          // Below we sort each dataEntry by SAT or ACT, and then further group by DecisionResult
          scatterDataSource.current = cloneDeep(initialScatterDataset)

          // process scatter chart dataSource
          universityTestDataEntries.forEach(dataEntry => {
            // If no GPA data, nothing to do (bad data point)
            if (!dataEntry.GPA) {
              return
            }
            const admissionDecision = dataEntry[UniversityTestDataKeys.AdmissionDecision].toLowerCase()
            // SAT CASE:
            if (dataEntry[UniversityTestDataKeys.SATSingle]) {
              // SAT - Accepted
              if (admissionDecision.includes(ACCEPTED) && !admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Sat, DecisionResult.Accepted, dataEntry)
                // SAT - Not Accepted
              } else if (admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Sat, DecisionResult.NotAccepted, dataEntry)
                // SAT - Waitlisted
              } else if (admissionDecision.includes(WAITLISTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Sat, DecisionResult.Waitlisted, dataEntry)
              }
            }

            // ACT CASE:
            if (dataEntry.ACT) {
              // SAT - Accepted
              if (admissionDecision.includes(ACCEPTED) && !admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Act, DecisionResult.Accepted, dataEntry)
                // SAT - Not Accepted
              } else if (admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Act, DecisionResult.NotAccepted, dataEntry)
                // SAT - Waitlisted
              } else if (admissionDecision.includes(WAITLISTED)) {
                formatAndStoreDataEntry(scatterDataSource.current, Dataset.Act, DecisionResult.Waitlisted, dataEntry)
              }
            }

            // Test Optional Case (explicit): (scatter chart dataset for GPA vs AP/IB/Coll)
            if (dataEntry[UniversityTestDataKeys.AppliedTestOptional] === TestOptional.Yes) {
              // Accepted
              if (admissionDecision.includes(ACCEPTED) && !admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.Accepted,
                  dataEntry,
                )

                // Not Accepted
              } else if (admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.NotAccepted,
                  dataEntry,
                )

                // Waitlisted
              } else if (admissionDecision.includes(WAITLISTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.Waitlisted,
                  dataEntry,
                )
              }
            }
            // Test Optional Case (implicit): (scatter chart dataset for GPA vs AP/IB/Coll)
            if (
              dataEntry[UniversityTestDataKeys.AppliedTestOptional] === null &&
              !dataEntry.ACT &&
              !dataEntry[UniversityTestDataKeys.SATSingle]
            ) {
              // Accepted
              if (admissionDecision.includes(ACCEPTED) && !admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.Accepted,
                  dataEntry,
                )

                // Not Accepted
              } else if (admissionDecision.includes(NOT_ACCEPTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.NotAccepted,
                  dataEntry,
                )

                // Waitlisted
              } else if (admissionDecision.includes(WAITLISTED)) {
                formatAndStoreDataEntry(
                  scatterDataSource.current,
                  Dataset.TestOptional,
                  DecisionResult.Waitlisted,
                  dataEntry,
                )
              }
            }
          })

          // Now, let's insert student's MyScore entry if it exists
          if (studentGPA && studentSAT) {
            formatAndStoreDataEntry(scatterDataSource.current, Dataset.Sat, DecisionResult.MyScore, {
              [UniversityTestDataKeys.SATSingle]: String(studentSAT),
              GPA: String(studentGPA),
            })
          }
          if (studentGPA && studentACT) {
            formatAndStoreDataEntry(scatterDataSource.current, Dataset.Act, DecisionResult.MyScore, {
              ACT: String(studentACT),
              GPA: String(studentGPA),
            })
          }
        })
        .catch(err => {
          // School has no scattergram data. Reset scatterDataSource.
          scatterDataSource.current = cloneDeep(initialScatterDataset)
          setShowScattergram(false)
        })
        // Okay. Dataset ready to go! Let's display SAT scatter plot by default
        .finally(() => {
          // This is a hack to get `myScore` to render on mount.
          setSelectedDataset(Dataset.Act)
          setSelectedDataset(Dataset.Sat)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentACT, studentGPA, studentSAT, universityPK])

  // Effect that processes and filters stacked barchart data based on scatter toolbar selections
  useEffect(() => {
    processAndFilterStackedBarChartDataEntries(universityTestDataRef.current.dataEntries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYears.length, selectedInState.length, selectedDecisions.length])

  // Ensures scatter plot updates whenever dataset changes (via select dropdown)
  if (scatterRef.current) {
    scatterRef.current.chartInstance.update()
  }

  const handleYearSelection = (year: number) => {
    if (selectedYears.includes(year)) setSelectedYears(selectedYears.filter(y => y !== year))
    else setSelectedYears([...selectedYears, year])
  }
  const yearsMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={p => handleYearSelection(Number(p.key))}
      onDeselect={p => handleYearSelection(Number(p.key))}
      selectedKeys={selectedYears}
    >
      {map(DEBRIEF_YEARS, k => (
        <Menu.Item key={k} className="wisernet-ddown-item">
          <span>
            {selectedYears.includes(k) ? <CheckOutlined /> : <span className="spacer" />}
            {k}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  if (!university) {
    return <Skeleton />
  }

  return (
    <div className={styles.SchoolProfilePage}>
      {loading && <div>Loading...</div>}
      {!loading && (
        <>
          <h2 className="school-header">{scorecard_data?.INSTNM || university?.name}</h2>
          <div className="school-profile-container">
            <div className="school-details-container">
              <div className="school-information">
                <h3 className="header">School Information</h3>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <HomeOutlined />
                  </span>
                  <span className="info-value">{`${university?.city}, ${university?.state}`}</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <TeamOutlined />
                  </span>
                  <span className="info-value">{numberWithCommas(scorecard_data?.UGDS) || 'N/A'}</span>
                  <span className="info-label">undergrads</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <LoginOutlined />
                  </span>
                  <span className="info-value">
                    {scorecard_data?.TUITIONFEE_IN ? `$${numberWithCommas(scorecard_data?.TUITIONFEE_IN)}` : 'N/A'}
                  </span>
                  <span className="info-label">In-state tuition</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <LogoutOutlined />
                  </span>
                  <span className="info-value">
                    {scorecard_data?.TUITIONFEE_OUT ? `$${numberWithCommas(scorecard_data?.TUITIONFEE_OUT)}` : 'N/A'}
                  </span>
                  <span className="info-label">Out-of-state tuition</span>
                </div>
                <div className="link-row school-website-link flex">
                  <a
                    className="school-link"
                    href={university.url || addScheme(scorecard_data?.INSTURL)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    School Website
                  </a>
                </div>
              </div>
              <div className="school-cost">
                <h3 className="header">School Selectivity</h3>
                <div className="info-wrapper">
                  <span className="school-selectivity">{`${getQualitativeSelectivity(scorecard_data?.ADM_RATE)}`}</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <BarChartOutlined />
                  </span>
                  <span className="info-value">
                    {scorecard_data?.ADM_RATE ? `${Math.round(scorecard_data?.ADM_RATE * 100)}%` : 'N/A'}
                  </span>
                  <span className="info-label">acceptance rate</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <StarOutlined />
                  </span>
                  <span className="info-value">
                    {scorecard_data?.PCTPELL ? `${Math.round(scorecard_data.PCTPELL * 100)}%` : 'N/A'}
                  </span>
                  <span className="info-label">of students receive Pell Grant</span>
                </div>
                <div className="info-wrapper">
                  <span className="info-icon">
                    <TagOutlined />
                  </span>
                  <span className="info-value">
                    {scorecard_data?.PCTFLOAN ? `${Math.round(scorecard_data.PCTFLOAN * 100)}%` : 'N/A'}
                  </span>
                  <span className="info-label">of students receive Fed Loan</span>
                </div>

                <div className="link-row net-price">
                  <a
                    className="school-link "
                    href={addScheme(scorecard_data?.NPCURL)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Net Price Calculator
                  </a>
                </div>
              </div>
            </div>
            {SUDPK && (
              <Route
                path="/school/:iped/student/:studentID/"
                render={() => (
                  <div className="card-wrapper">
                    <SUDCard
                      studentUniversityDecisionPK={SUDPK}
                      displayCounselorControls={true}
                      displayIsApplying={false}
                      fetchOwnCollegeResearch={true}
                    />
                  </div>
                )}
              />
            )}
          </div>
          <div className="campus-reel-and-school-links-container">
            <CampusReel iped={university.iped} />
            <div className="school-research-links">
              <h3 className="header">School Research</h3>
              <div className="social-container flex">
                <Tooltip title={university.facebook_url ? 'Facebook' : 'No Facebook URL Available'}>
                  <Button
                    href={university.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!university.facebook_url}
                    type="primary"
                    shape="circle"
                    icon={<FacebookOutlined />}
                  />
                </Tooltip>
                <Tooltip title={university.twitter_url ? 'Twitter' : 'No Twitter URL Available'}>
                  <Button
                    href={university.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!university.twitter_url}
                    type="primary"
                    shape="circle"
                    icon={<TwitterOutlined />}
                  />
                </Tooltip>
                <Tooltip title={university.instagram_url ? 'Instagram' : 'No Instagram URL Available'}>
                  <Button
                    href={university.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!university.instagram_url}
                    type="primary"
                    shape="circle"
                    icon={<InstagramOutlined />}
                  />
                </Tooltip>
                <Tooltip title={university.youtube_url ? 'Youtube' : 'No Youtube URL Available'}>
                  <Button
                    href={university.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!university.youtube_url}
                    type="primary"
                    shape="circle"
                    icon={<YoutubeOutlined />}
                  />
                </Tooltip>
              </div>
              <div className="research-links">
                <Button
                  disabled={!university.unigo_url}
                  className="school-link"
                  href={addScheme(university.unigo_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unigo
                </Button>
                <Button
                  disabled={!university.niche_url}
                  className="school-link"
                  href={addScheme(university.niche_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Niche
                </Button>
                <Button
                  disabled={!university.tpr_url}
                  className="school-link"
                  href={addScheme(university.tpr_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Princeton Review
                </Button>
                <Button
                  disabled={!university.college_board_url}
                  className="school-link"
                  href={addScheme(university.college_board_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  College Board
                </Button>
              </div>
            </div>
          </div>

          <div className="scatter-and-stacked-outer-container">
            <h3 className="header">Admission Decision</h3>
            {showScattergram ? (
              <div className="scatter-and-stacked-inner-container">
                <div className="test-stats-container">
                  <div className="wisernet-toolbar">
                    <div className="wisernet-toolbar-group vertical">
                      <label className="f-subtitle-2">Test</label>
                      <Select
                        className="scatter-select"
                        value={selectedDataset}
                        onChange={setSelectedDataset}
                        options={selectOptions}
                      />
                    </div>
                    <div className="wisernet-toolbar-group vertical" ref={yearsMenuRef}>
                      <label className="f-subtitle-2">Years</label>
                      <Dropdown
                        getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
                        visible={yearsVisible}
                        overlay={yearsMenu}
                        trigger={['click']}
                      >
                        <Button onClick={() => setYearsVisible(!yearsVisible)}>
                          Years ({selectedYears.length})&nbsp;
                          {yearsVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
                        </Button>
                      </Dropdown>
                    </div>
                    <div className="wisernet-toolbar-group in-state vertical left">
                      <label className="f-subtitle-2">Residence</label>
                      <Checkbox
                        checked={selectedInState.includes(InStateOptions['In State'])}
                        onChange={() => setInState(InStateOptions['In State'])}
                      >
                        In State
                      </Checkbox>
                      <Checkbox
                        checked={selectedInState.includes(InStateOptions['Out of State'])}
                        onChange={() => setInState(InStateOptions['Out of State'])}
                      >
                        Out of State
                      </Checkbox>
                    </div>
                    <div className="wisernet-toolbar-group deadline vertical">
                      <label className="f-subtitle-2">Application Deadline</label>
                      <div className="flex">
                        <Checkbox
                          checked={selectedDecisions.includes(DecisionOptions.EA)}
                          onChange={() => setDecisions(DecisionOptions.EA)}
                        >
                          EA
                        </Checkbox>
                        <Checkbox
                          checked={selectedDecisions.includes(DecisionOptions.ED)}
                          onChange={() => setDecisions(DecisionOptions.ED)}
                        >
                          ED
                        </Checkbox>
                        <Checkbox
                          checked={selectedDecisions.includes(DecisionOptions.RD)}
                          onChange={() => setDecisions(DecisionOptions.RD)}
                        >
                          RD
                        </Checkbox>
                        <Checkbox
                          checked={selectedDecisions.includes(DecisionOptions.REA)}
                          onChange={() => setDecisions(DecisionOptions.REA)}
                        >
                          REA
                        </Checkbox>
                      </div>
                    </div>
                  </div>
                  <div className="scatter">
                    <Scatter
                      ref={scatterRef}
                      data={dataScatter}
                      options={
                        selectedDataset === Dataset.TestOptional
                          ? scatterOptionsTestOptional
                          : scatterOptionsTestSubmitted
                      }
                    />
                  </div>
                </div>
                <div className="stacked-chart">
                  <Bar data={dataStackedBarChart} options={optionsStackedBarChart} />
                </div>
              </div>
            ) : (
              <div className="scatter-container-empty">
                <Empty description={<div className="header">No Admission Data Available</div>} />
              </div>
            )}
          </div>
          {hasAnyTestScore && !isEmpty(scorecard_data) && (
            <>
              <div className="test-scores-container">
                <h3 className="header">Test Stats</h3>
                <div className="test-stats-container">
                  {(hasScore.satMath || hasScore.satReading) && (
                    <div className="chart sat-chart">
                      <HorizontalBar type="horizontalBar" data={satTestScoreData} options={optionsBarChart} />
                      <div className="test-stats-copy">25th to 75th percentile scores</div>
                    </div>
                  )}
                  {(hasScore.actComposite || hasScore.actMath || hasScore.actReading) && (
                    <div className="chart act-chart">
                      <HorizontalBar type="horizontalBar" data={actTestScoreData} options={optionsBarChart} />
                      <div className="test-stats-copy">25th to 75th percentile scores</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="tabbed-details-container">
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="Essay Requirements" key="1">
                {university.iped && university.iped !== '-1' && (
                  <iframe
                    src={PROMPT_ESSAY_REQUIREMENTS(university.iped)}
                    className="essay-requirements-frame"
                    title="Essay Requirements"
                  />
                )}
                {(!university.iped || university.iped === '-1') && <Empty>No essay requirements available</Empty>}
              </Tabs.TabPane>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}

export default SchoolProfileTab

/**
 * Helper function that adds thousands "," (comma) seperater to numbers
 */
function numberWithCommas(x: number) {
  return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Helper function that ensures address has a scheme or if undefined return emptry string
 */
function addScheme(address: string) {
  if (!address) {
    return ''
  }
  if (address?.includes('http://') || address?.includes('https://')) {
    return address
  }
  return `https://${address}`
}

/**
 * Helper function to determine a school's qualitative selectivity designation
 */
function getQualitativeSelectivity(selectivity: number) {
  if (selectivity <= 0.15) {
    return 'Most Selective'
  }
  if (selectivity > 0.15 && selectivity <= 0.3) {
    return 'Highly Selective'
  }
  if (selectivity > 0.3 && selectivity <= 0.5) {
    return 'Very Selective'
  }
  if (selectivity > 0.5 && selectivity <= 0.75) {
    return 'Selective'
  }
  // default case
  return 'Non-Select'
}

/**
 * Helper function that renders the tooltip label for each datapoint
 */
function renderBeforeLabel(item) {
  return [startCase(DecisionResult[item.datasetIndex]), `Score: ${item.xLabel}`, `GPA: ${item.yLabel}`]
}

/**
 * Helper function that renders the tooltip label for each datapoint
 */
function renderBeforeLabelForTestOptional(item) {
  return [startCase(DecisionResult[item.datasetIndex]), `AP/IB/Coll: ${item.xLabel}`, `GPA: ${item.yLabel}`]
}

/**
 * Helper function that generates chart labels
 */
function generateLabels(dataset: Dataset, hasScore: { [key: string]: boolean }) {
  const labels = []
  switch (dataset) {
    case Dataset.Sat:
      if (hasScore.satReading) {
        labels.push('Reading')
      }
      if (hasScore.satMath) {
        labels.push('Math')
      }
      return labels
    case Dataset.Act:
      if (hasScore.actComposite) {
        labels.push('Composite')
      }
      if (hasScore.actMath) {
        labels.push('Math')
      }
      if (hasScore.actReading) {
        labels.push('Reading')
      }
      return labels
    default:
      return labels
  }
}

/**
 * Helper function that generates test score range data if present for university
 */
function generateTestScoreData(dataset: Dataset, hasScore: { [key: string]: boolean }, scorecard_data: ScorecardData) {
  const data = []
  switch (dataset) {
    case Dataset.Sat:
      if (hasScore.satReading) {
        data.push([scorecard_data?.SATVR25, scorecard_data?.SATVR75])
      }
      if (hasScore.satMath) {
        data.push([scorecard_data?.SATMT25, scorecard_data?.SATMT75])
      }
      return data
    case Dataset.Act:
      if (hasScore.actComposite) {
        data.push([scorecard_data?.ACTCM25, scorecard_data?.ACTCM75])
      }
      if (hasScore.actMath) {
        data.push([scorecard_data?.ACTMT25, scorecard_data?.ACTMT75])
      }
      if (hasScore.actReading) {
        data.push([scorecard_data?.ACTEN25, scorecard_data?.ACTEN75])
      }
      return data
    default:
      return data
  }
}

/**
 * Helper function that formats each data entry and stores it in our React data source ref
 *
 * This method also generates concordance scaling and inserts student's SAT/ACT score
 */
function formatAndStoreDataEntry(
  scatterDataset: ScatterDataset,
  dataset: Dataset,
  decisionResult: DecisionResult,
  dataEntry: UniversityTestData,
) {
  const DATASET_TO_X_VALUE_MAP = {
    SAT: dataEntry[UniversityTestDataKeys.SATSingle],
    ACT: dataEntry.ACT,
    [Dataset.Concordance]: CONCORDANCE_MAP[dataEntry.ACT],
    [Dataset.TestOptional]: dataEntry[UniversityTestDataKeys.AP_IB_Coll],
  }
  scatterDataset[dataset][decisionResult].push({ x: DATASET_TO_X_VALUE_MAP[dataset], y: dataEntry.GPA, ...dataEntry })
  // Also push to Concordance dataset
  if (dataset === Dataset.Sat) {
    scatterDataset[Dataset.Concordance][decisionResult].push({
      x: DATASET_TO_X_VALUE_MAP[dataset],
      y: dataEntry.GPA,
      ...dataEntry,
    })
    // Only ACT dataset needs to be converted since we are using SAT scale for comparison
  } else if (dataset === Dataset.Act) {
    scatterDataset[Dataset.Concordance][decisionResult].push({
      x: DATASET_TO_X_VALUE_MAP[Dataset.Concordance],
      y: dataEntry.GPA,
      ...dataEntry,
    })
  }
}
