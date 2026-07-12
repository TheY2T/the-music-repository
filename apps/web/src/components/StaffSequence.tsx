// StaffSequence now lives in the shared design system (@TheY2T/tmr-ui/music). Re-exported here so
// existing `@/components/StaffSequence` imports keep working; prefer importing from the package.
export {
  type StaffNoteDatum,
  StaffSequence as default,
  type StaffSequenceProps,
} from '@TheY2T/tmr-ui/music';
