// Types shared by every dashboard page.

// One KPI measured over two periods, so the page can show the change.
export interface PeriodValue {
  current: number; // the selected period, e.g. the last 28 days
  previous: number; // the same length of time just before it, e.g. the 28 days before that
}
