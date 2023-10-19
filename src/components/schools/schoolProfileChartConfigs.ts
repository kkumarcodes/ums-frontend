// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { UniversityTestData } from 'store/university/universityTypes'

export const UNIVERSITY_TEST_DATA_ENDPOINT = (pk: number) => `/university/cw-data/${pk}/`

export const PROMPT_ESSAY_REQUIREMENTS = (iped: string) =>
  `https://editate.com/admissions/cpp/university-essays/${iped}/`

/**
 * NOTE: 1-8 is a lie ... fix later if possible ...
 * But is there actually a student using our service that scores below 9 on the ACT?!
 */
export const CONCORDANCE_MAP = {
  '0': '590',
  '1': '590',
  '2': '590',
  '3': '590',
  '4': '590',
  '5': '590',
  '6': '590',
  '7': '590',
  '8': '590',
  '9': '590',
  '10': '630',
  '11': '670',
  '12': '710',
  '13': '760',
  '14': '800',
  '15': '850',
  '16': '890',
  '17': '930',
  '18': '970',
  '20': '1040',
  '21': '1080',
  '22': '1110',
  '23': '1140',
  '24': '1180',
  '25': '1210',
  '26': '1240',
  '27': '1280',
  '29': '1340',
  '30': '1370',
  '31': '1400',
  '32': '1430',
  '33': '1460',
  '34': '1500',
  '35': '1540',
  '36': '1600',
}

export enum Dataset {
  Sat = 'SAT',
  Act = 'ACT',
  Concordance = 'SAT/ACT',
  TestOptional = 'Optional',
}

export enum DecisionResult {
  Accepted,
  NotAccepted,
  Waitlisted,
  MyScore,
}

export type DataEntry = Partial<UniversityTestData> & {
  x: string
  y: string
}

export type ScatterDatasets = {
  [key: string]: DataEntry[]
}

export type ScatterDataset = {
  SAT: ScatterDatasets
  ACT: ScatterDatasets
  [Dataset.Concordance]: ScatterDatasets
  [Dataset.TestOptional]: ScatterDatasets
}

export const initialScatterDataset: ScatterDataset = {
  SAT: {
    [DecisionResult.Accepted]: [],
    [DecisionResult.NotAccepted]: [],
    [DecisionResult.Waitlisted]: [],
    [DecisionResult.MyScore]: [],
  },
  ACT: {
    [DecisionResult.Accepted]: [],
    [DecisionResult.NotAccepted]: [],
    [DecisionResult.Waitlisted]: [],
    [DecisionResult.MyScore]: [],
  },
  [Dataset.Concordance]: {
    [DecisionResult.Accepted]: [],
    [DecisionResult.NotAccepted]: [],
    [DecisionResult.Waitlisted]: [],
    [DecisionResult.MyScore]: [],
  },
  [Dataset.TestOptional]: {
    [DecisionResult.Accepted]: [],
    [DecisionResult.NotAccepted]: [],
    [DecisionResult.Waitlisted]: [],
    [DecisionResult.MyScore]: [],
  },
}

export const initialStackedBarChartDataset = {
  submittedAndAdmittedPercent: 0,
  submittedAndNotAdmittedPercent: 0,
  notSubmittedAndAdmittedPercent: 0,
  notSubmittedAndNotAdmittedPercent: 0,
}

// Bar chart dataset style config
export const datasetOptions = {
  backgroundColor: 'rgba(41,58,104,0.7)',
  borderColor: 'rgba(41,58,104,1)',
  borderWidth: 1,
  hoverBackgroundColor: 'rgba(41,58,104,0.9)',
  hoverBorderColor: 'rgba(41,58,104,1)',
}

// Bar chart options
export const optionsBarChart = {
  maintainAspectRatio: false,
  legend: {
    labels: {
      fontStyle: 'bold',
      fontSize: 16,
    },
  },
  scales: {
    xAxes: [
      {
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
        },
      },
    ],
    yAxes: [
      {
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
        },
      },
    ],
  },
}

export const optionsStackedBarChart = {
  title: {
    display: true,
    text: 'Admission Outcome vs Test Submission',
    fontSize: 18,
    fontStyle: 'bold',
  },
  legend: {
    display: false,
  },
  maintainAspectRatio: false,
  responsive: true,
  scales: {
    xAxes: [
      {
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
        },
        stacked: true,
      },
    ],
    yAxes: [
      {
        ticks: {
          fontSize: 14,
        },
        stacked: true,
      },
    ],
  },
}

export const commonScatterDatasetStyleOptions = {
  pointBorderWidth: 1,
  pointHoverRadius: 5,
  pointHoverBorderWidth: 2,
  pointRadius: 5,
  pointHitRadius: 10,
  pointBackgroundColor: '#fff',
  pointHoverBorderColor: 'rgba(220,220,220,1)',
}

// Scatter plot option - Test Submitted Case
export const scatterOptionsTestSubmitted = {
  maintainAspectRatio: false,
  tooltips: {
    displayColors: false,
    titleFontColor: 'rgba(75,192,192,1)',
    callbacks: {},
  },
  legend: {
    labels: {
      fontStyle: 'bold',
      fontSize: 16,
    },
  },
  scales: {
    xAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: 'Test Score',
          fontSize: 16,
          fontStyle: 'bold',
        },
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
        },
      },
    ],
    yAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: 'GPA',
          fontSize: 16,
          fontStyle: 'bold',
        },
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
          precision: 1,
          stepSize: 0.1,
        },
      },
    ],
  },
}

// Scatter plot option - Test Optional Case
export const scatterOptionsTestOptional = {
  maintainAspectRatio: false,
  tooltips: {
    displayColors: false,
    titleFontColor: 'rgba(75,192,192,1)',
    callbacks: {},
  },
  legend: {
    labels: {
      fontStyle: 'bold',
      fontSize: 16,
    },
  },
  scales: {
    xAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: 'AP/IB/Coll',
          fontSize: 16,
          fontStyle: 'bold',
        },
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
        },
      },
    ],
    yAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: 'GPA',
          fontSize: 16,
          fontStyle: 'bold',
          textOrientation: 'upright',
        },
        ticks: {
          fontSize: 14,
          fontStyle: 'bold',
          precision: 1,
          stepSize: 0.1,
        },
      },
    ],
  },
}

export const dataScatter = {
  labels: ['Scatter'],
  datasets: [
    {
      ...commonScatterDatasetStyleOptions,
      label: 'Accepted',
      backgroundColor: 'rgba(75,192,75,0.4)',
      pointBorderColor: 'rgba(75,192,75,1)',
      pointHoverBackgroundColor: 'rgba(75,192,75,1)',
      pointBackgroundColor: 'transparent',
      pointStyle: 'circle',
      data: [],
    },
    {
      ...commonScatterDatasetStyleOptions,
      label: 'Not Accepted',
      backgroundColor: 'rgba(192,75,75,0.4)',
      pointBorderColor: 'rgba(192,75,75,1)',
      pointHoverBackgroundColor: 'rgba(192,75,75,1)',
      pointBackgroundColor: 'transparent',
      pointStyle: 'crossRot',
      data: [],
    },
    {
      ...commonScatterDatasetStyleOptions,
      label: 'Waitlisted',
      backgroundColor: 'rgba(75,75,192,0.4)',
      pointBorderColor: 'rgba(75,75,192,1)',
      pointHoverBackgroundColor: 'rgba(75,75,192,1)',
      pointBackgroundColor: 'transparent',
      pointStyle: 'rect',
      data: [],
    },
    {
      ...commonScatterDatasetStyleOptions,
      label: 'My Score',
      backgroundColor: 'rgba(255,165,0,0.4)',
      pointBorderColor: 'rgba(255,165,0,1)',
      pointHoverBackgroundColor: 'rgba(255,165,0,1)',
      pointStyle: 'star',
      pointBorderWidth: 8,
      data: [],
    },
  ],
}
