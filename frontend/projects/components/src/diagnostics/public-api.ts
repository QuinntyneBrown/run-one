// The diagnostic recording's presentation (L2-178, ADR 0048), as `@telo/components/diagnostics`. It is an entry point
// of its own, and `@telo/components` exports none of it, so it is bundled only into the chunk the app imports
// dynamically when it is opened with `?diagnose` (L2-178 AC1).
export { DiagnosticMark, type DiagnosticMarkScreen } from './diagnostic-mark';
export { DiagnosticPanel, type DiagnosticStatus, NOTE_MAX_LENGTH } from './diagnostic-panel';
