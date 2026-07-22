export const chartWidth = 540;
export const chartMarginTop = 10;
export const chartMarginRight = 20;
export const chartMarginBottom = 32;
export const chartMarginLeft = 72;

export const yearChartHeight = 260;
export const stackedChartHeight = 300;

export const yearInnerWidth = chartWidth - chartMarginLeft - chartMarginRight;
export const yearInnerHeight = yearChartHeight - chartMarginTop - chartMarginBottom;
export const stackedInnerHeight = stackedChartHeight - chartMarginTop - chartMarginBottom;

// AMR profile chart uses a wider viewBox because it sits in a full-width row
// (not the 3-column metadata grid) and can contain many antibiotic labels.
// The larger bottom margin accommodates -45° rotated x-axis labels that extend
// roughly label_px_width × sin(45°) below the baseline.
export const amrChartWidth = 920;
export const amrInnerWidth = amrChartWidth - chartMarginLeft - chartMarginRight;
export const amrChartHeight = 228;
export const amrMarginBottom = 90;
export const amrInnerHeight = amrChartHeight - chartMarginTop - amrMarginBottom;
