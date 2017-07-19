//@flow

export const ReaderStateOptions = {
  initializing: 'READER_STATE_INITIALIZING', // i.e. waiting to determine if we have permissions
  awaitingPermissions: 'READER_STATE_AWAITING_PERMISSIONS',
  permissionsBlocked: 'READER_STATE_PERMISSIONS_BLOCKED',
  awaitingStart: 'READER_STATE_AWAITING_START',
  countdownToStart: 'READER_STATE_COUNTDOWN_TO_START',
  inProgress: 'READER_STATE_IN_PROGRESS',
  paused: 'READER_STATE_PAUSED',
  done: 'READER_STATE_DONE',
  doneDisplayingPlayback: 'READER_STATE_PLAYBACK',
  submitted: 'READER_STATE_SUBMITTED',
}
export type ReaderState = Keys<typeof ReaderStateTypes>;


export const MicPermissionsStatusOptions = {
	granted: 'MIC_PERMISSIONS_STATUS_GRANTED',
	awaiting: 'MIC_PERMISSIONS_STATUS_AWAITING',
	blocked: 'MIC_PERMISSIONS_STATUS_BLOCKED',
}
export type MicPermissionsStatus = Keys<typeof MicPermissionsStatusOptions>;