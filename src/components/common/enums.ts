// Enum of the endpoints that support CSV download.
export enum CSVDataTypes {
  Student = '/user/students/',
  Parent = '/user/parents/',
  Tutor = '/user/tutors/',
  Counselor = '/user/counselors/',
  Administrator = '/user/administrators/',
  Resource = '/resource/resources/',
  ResourceGroup = '/resource/resource-groups/',
  IndividualTutoringSession = '/tutoring/student-tutoring-sessions/',
  GroupTutoringSession = '/tutoring/group-tutoring-sessions/',
  TimeCard = '/tutoring/time-cards/',
  TutoringPackage = '/tutoring/tutoring-packages/',
  Courses = '/tutoring/courses/',
  DiagnosticRegistration = '/tutoring/diagnostic/registration/',
  CounselorTimeEntry = '/counseling/counselor-time-entry/',
  CounselorTimeCard = '/counseling/counselor-time-card/',
  CounselingHoursGrants = '/counseling/counseling-hours-grants/',
  StudentCounselingHours = '/counseling/student-counseling-hours/',
  CounselorTimeCardBreakdown = '/counseling/counselor-time-card/csv-by-payrate/',
}
