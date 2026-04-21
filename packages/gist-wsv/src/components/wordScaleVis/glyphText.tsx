import React from 'react';
import { SVG_HEIGHT, SVG_PADDING } from '../constants';
import { ChartProps, DataSpec } from '../types';
import { Tooltip } from 'antd';

const MAX_DASHES = 10;
const DASH_WIDTH = 10;
const DASH_STROKE_WIDTH = 2;
const DASH_V_SPACING = 3;
const DASH_H_SPACING = 4;
const SVG_WIDTH = SVG_PADDING * 2 + DASH_WIDTH * 2 + DASH_H_SPACING;

const GlyphText: React.FC<ChartProps> = ({ gistvisSpec, colorScale, selectedEntity, setSelectedEntity }) => {
  const dataSpec = gistvisSpec.dataSpec ?? [];

  // Function to generate tooltip content
  const getToolTipContent = (value: number, category: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (
      <div
        style={{
          lineHeight: 1.1,
          fontSize: '14px',
          color: colorScale(category),
          fontWeight: 'bold',
        }}
      >
        The value of {category} is {formatter.format(value)}
      </div>
    );
  };

  const getVisElement = (currentValue: number, currentEntity: string) => {
    const hoverStyle = {
      opacity: currentEntity === selectedEntity ? 1 : 0.5,
      transition: 'opacity 0.3s',
    };

    // Dynamically calculate scaledValue
    let scaledValue: number;
    const absValue = Math.abs(currentValue);

    if (absValue === 0) {
      scaledValue = 0;
    } else if (absValue < 1) {
      scaledValue = absValue;
    } else {
      const divisor = Math.pow(10, Math.floor(Math.log10(absValue)));
      scaledValue = absValue / divisor;
    }

    scaledValue = Math.min(MAX_DASHES, Math.max(0, scaledValue));

    const numFullDashes = Math.floor(scaledValue);
    const lastDashFraction = scaledValue - numFullDashes;
    const numTotalDashes = Math.ceil(scaledValue);

    const dashes = [];
    for (let i = 0; i < numTotalDashes; i++) {
      // Calculate row and column index (bottom to top, left to right)
      const rowIndex = i % 5;
      const colIndex = i < 5 ? 0 : 1;

      const y = SVG_HEIGHT - SVG_PADDING - rowIndex * DASH_V_SPACING - DASH_STROKE_WIDTH / 2;
      const x1 = SVG_PADDING + colIndex * (DASH_WIDTH + DASH_H_SPACING);

      let currentDashWidth = DASH_WIDTH;
      // If it's the last dash and needs to be scaled
      if (i === numFullDashes && lastDashFraction > 0) {
        currentDashWidth = DASH_WIDTH * lastDashFraction;
      }
      // Handle cases where the loop iterates beyond the required full dashes
      else if (i >= numFullDashes) {
        if (lastDashFraction === 0 && i === numFullDashes) {
          // This is a boundary case and might not be strictly necessary due to the loop condition
        } else {
          continue; // Skip extra iterations from Math.ceil
        }
      }

      if (currentDashWidth <= 0) continue;

      const x2 = x1 + currentDashWidth;

      dashes.push(
        <line
          key={i}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={colorScale(currentEntity)}
          strokeWidth={DASH_STROKE_WIDTH}
          strokeLinecap="round"
        />
      );
    }

    // Return the SVG container with all the dashes
    return (
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        style={hoverStyle}
        onMouseOver={() => setSelectedEntity(currentEntity)}
        onMouseOut={() => setSelectedEntity('')}
      >
        {dashes}
      </svg>
    );
  };

  const mainElement = dataSpec.map((d: DataSpec, i: number) => {
    const hoverStyle = {
      opacity: d.breakdown === selectedEntity ? 1 : 0.5,
      transition: 'opacity 0.3s',
    };
    return (
      <Tooltip
        title={getToolTipContent(d.value, d.breakdown)}
        placement="bottom"
        color="#ffffff"
        key={d.breakdown || i}
      >
        {getVisElement(d.value, d.breakdown)}
      </Tooltip>
    );
  });

  return <>{mainElement}</>;
};

export default GlyphText;
