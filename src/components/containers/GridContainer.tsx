'use client';

import React, { useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/gridContainer.css';

type WidgetData = {
    id: string;
    name: string;
    w?: number;
    h?: number;
    columns?: Record<string, string>; // e.g. { genome_name: "Genome", strain: "Strain" }
    data?: Array<Record<string, any>>; // e.g. [{ genome_name: "E. coli", strain: "K12" }]
    content?: React.ReactNode;
  };

  type GridContainerProps = {
    cols?: number;
    rowHeight?: number;
    width?: number;
    widgets: WidgetData[];
  };

const GridContainer: React.FC<GridContainerProps> = ({
  cols = 12,
  rowHeight = 90,
  width = 1200,
  widgets, }) => {
  const defaultLayout = widgets.map((widget, index) => ({
    i: widget.id,
    x: (index * 2) % cols,
    y: Infinity,
    w: widget.w || 2,
    h: widget.h || 2,
  }));

  const [layout, setLayout] = useState(defaultLayout);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  console.log(widgets);

  return (
    <div className="h-screen w-screen mx-auto overflow-auto outline">
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={50}
        width={window.innerWidth * 0.8}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-header"
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget">
            <div className="widget-header">{widget.name}</div>
            <div className="widget-body">
              {widget.columns && widget.data ? (
              
                <table className="data-table">
                  <thead>
                    <tr>
                    {Object.entries(widget.columns).map(([field, label], idx) => (
                        <th key={idx}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(widget.data?.[0]?.fullData) && widget.data[0].fullData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.keys(widget.columns ?? {}).map((field, cellIdx) => (
                          <td key={cellIdx}>{row[field]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                widget.content || <p>No content</p>
              )}
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
};

export default GridContainer;
