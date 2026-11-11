// Every colour used inside charts, named by the job it does.
//
// Recharts draws charts as SVG and takes colours as props (fill="…", stroke="…"),
// not as Tailwind classes, so they live here as plain hex values. The greys match
// Tailwind's gray scale, so charts sit comfortably next to the rest of the page.
//
// `as const` tells TypeScript these values never change, so a typo like
// chartColors.serise is caught as an error.
export const chartColors = {
  series: "#2a78d6", // the data itself: the line and the bars (first colour of the validated chart palette)
  seriesHover: "#4a8fe0", // a hovered bar: slightly lighter, so it visibly responds
  surface: "#ffffff", // the card background; also the ring around the hovered dot on the line
  grid: "#e5e7eb", // gray-200: gridlines and axis lines
  axisText: "#6b7280", // gray-500: axis labels (dates, numbers, channel names)
  valueText: "#374151", // gray-700: values printed on the chart, e.g. at the end of each bar
  crosshair: "#9ca3af", // gray-400: the vertical line that follows the mouse
  hoverBand: "#f3f4f6", // gray-100: the row highlight behind a hovered bar
} as const;
