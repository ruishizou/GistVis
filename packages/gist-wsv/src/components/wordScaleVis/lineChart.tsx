import React, { useState, useRef } from 'react';
import * as d3 from 'd3';
import { SVG_HEIGHT, SVG_PADDING, SVG_UNIT_WIDTH, SVG_INTERVAL } from '../constants';
import { DataPoint, LineChartProps } from '../types';
import { Tooltip } from 'antd';
import { capitalizeFirstLetter } from '../../utils/utils';

interface LineChartTooltipProps {
  x: number;
  y: number;
  value: number;
}

const DATA_PARAM_COLOR = '#003366'; // Color for auxiliary text (Trend indicator/word/connectors/descriptions)
// Trend/category color (currentLineColor) will be used for breakdown/feature/value/difference

const Line: React.FC<LineChartProps> = ({
  gistvisSpec,
  visualizeData,
  type,
  colorScale,
  selectedEntity,
  setSelectedEntity,
}: LineChartProps) => {
  const dataSpec = gistvisSpec.dataSpec ?? [];
  const dataset = visualizeData;

  const svgRef = React.useRef<SVGSVGElement>(null);

  const lineChartWidth = type === 'start-end' ? SVG_UNIT_WIDTH * dataset.length * 2 : SVG_UNIT_WIDTH * dataset.length;
  const lineChartHeight = SVG_HEIGHT;
  const dataPosX = dataset[dataset.length - 1]?.x ?? 0;
  const differenceLineDataset: DataPoint[] =
    dataset.length > 0
      ? [
          { x: dataPosX, y: dataset[0].y },
          { x: dataPosX, y: dataset[dataset.length - 1].y },
        ]
      : [];
  const xScale = d3
    .scaleLinear()
    .domain((d3.extent(dataset, (d) => d.x) as [number, number]) || [0, 1])
    .range([SVG_PADDING, lineChartWidth - SVG_PADDING]);
  const yScale = d3
    .scaleLinear()
    .domain((d3.extent(dataset, (d) => d.y) as [number, number]) || [0, 1])
    .range([lineChartHeight - SVG_PADDING, SVG_PADDING]);
  const lineGenerator = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(gistvisSpec.unitSegmentSpec.attribute === 'invariable' ? d3.curveMonotoneX : d3.curveLinear);
  const lineGeneratorDifference = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x) + SVG_INTERVAL)
    .y((d) => yScale(d.y));
  const areaGenerator = d3
    .area<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y1((d) => yScale(d.y))
    .y0(yScale(0));

  const [tooltip, setTooltip] = useState<LineChartTooltipProps | null>(null);

  const getTooltipContnet = (selectionVal: number | null) => {
    const currentLineColor =
      type === 'nominal' || type === 'trending' || type === 'start-end'
        ? gistvisSpec.unitSegmentSpec.attribute === 'positive'
          ? 'green'
          : gistvisSpec.unitSegmentSpec.attribute === 'negative'
            ? 'red'
            : 'grey'
        : colorScale(dataSpec[0]?.breakdown ?? 'defaultCategory');

    const baseStyle = {
      lineHeight: 1.1,
      fontSize: '14px',
      fontWeight: 'bold',
      color: DATA_PARAM_COLOR,
    };

    if (type === 'nominal') {
      const attribute = gistvisSpec.unitSegmentSpec.attribute;
      let trendIndicator = '';
      let trendWord = '';
      switch (attribute) {
        case 'positive':
          trendIndicator = '↗';
          trendWord = 'increasing';
          break;
        case 'negative':
          trendIndicator = '↘';
          trendWord = 'decreasing';
          break;
        default:
          trendIndicator = '→';
          trendWord = 'stable';
          break;
      }

      let featureText: string | null = null;
      let breakdownText: string | null = null;
      let connectorText: string | null = null;
      let needsSpaceBeforeBreakdown = false;
      let needsSpaceBeforeFeature = false;

      if (dataSpec && dataSpec.length > 0) {
        const firstDataPoint = dataSpec[0];
        const feature = firstDataPoint.feature || '';
        const breakdown = firstDataPoint.breakdown || '';
        if (feature && breakdown) {
          featureText = feature.replace(/^the\s/i, '');
          breakdownText = capitalizeFirstLetter(breakdown);
          connectorText = `'s `;
          needsSpaceBeforeBreakdown = true;
          needsSpaceBeforeFeature = false;
        } else if (feature) {
          featureText = feature.replace(/^the\s/i, '');
          connectorText = ` for `;
          needsSpaceBeforeBreakdown = false;
          needsSpaceBeforeFeature = false;
        } else if (breakdown) {
          breakdownText = capitalizeFirstLetter(breakdown);
          connectorText = ` related to `;
          needsSpaceBeforeBreakdown = false;
          needsSpaceBeforeFeature = false;
        }
      }

      return (
        <div style={baseStyle}>
          <span>
            {trendIndicator} {capitalizeFirstLetter(trendWord)}
          </span>
          {connectorText && connectorText !== `'s ` && <span>{connectorText}</span>}
          {breakdownText && (
            <span style={{ color: currentLineColor }}>
              {needsSpaceBeforeBreakdown ? ' ' : ''}[{breakdownText}]
            </span>
          )}
          {breakdownText && featureText && connectorText === `'s ` && <span>{connectorText}</span>}
          {featureText && (
            <span style={{ color: currentLineColor }}>
              {' '}
              {needsSpaceBeforeFeature ? ' ' : ''}[{featureText}]
            </span>
          )}
        </div>
      );
    } else if (type === 'trending') {
      if (!dataSpec || dataSpec.length === 0) return null;

      const trendText = gistvisSpec.unitSegmentSpec.attribute === 'positive' ? '↗ increased' : '↘ decreased';
      const value = dataSpec[0]?.value;

      return (
        <div style={baseStyle}>
          <span>{trendText}</span>
          {value != null && <span style={{ color: currentLineColor }}> [{value}]</span>}
        </div>
      );
    } else if (type === 'start-end') {
      if (!dataSpec || dataSpec.length < 2 || selectionVal === null) return null;

      const startPoint = dataSpec[0];
      const endPoint = dataSpec[1];
      const feature = startPoint.feature ? capitalizeFirstLetter(startPoint.feature) : '';
      const selectedBreakdown = dataSpec.find((d) => d.value === selectionVal)?.breakdown ?? startPoint.breakdown ?? '';

      let description = '';
      let differenceText: number | string | null = null;

      if (gistvisSpec.unitSegmentSpec.attribute === 'invariable') {
        description = '. The value remains stable.';
      } else {
        const difference = Math.abs(endPoint.value - startPoint.value);
        const trendWord = gistvisSpec.unitSegmentSpec.attribute === 'positive' ? 'increase' : 'decrease';
        description = `. The ${trendWord} is `;
        differenceText = `[${difference}]`;
      }

      return (
        <div style={baseStyle}>
          {feature && <span style={{ color: currentLineColor }}>[{feature}]</span>}

          {feature && selectedBreakdown && <span> of </span>}

          {selectedBreakdown && <span style={{ color: currentLineColor }}>[{selectedBreakdown}]</span>}

          <span>: </span>
          <span style={{ color: currentLineColor }}>[{selectionVal}]</span>
          <span>{description}</span>
          {differenceText !== null && <span style={{ color: currentLineColor }}>{differenceText}</span>}

          {differenceText !== null && <span>.</span>}
        </div>
      );
    } else {
      if (!dataSpec || dataSpec.length === 0 || selectionVal === null) return null;

      const feature = dataSpec[0].feature ? capitalizeFirstLetter(dataSpec[0].feature) : '';
      const selectedDatapoint = dataSpec.find((d) => d.value === selectionVal);
      const selectedBreakdown = selectedDatapoint?.breakdown ?? '';

      return (
        <div style={baseStyle}>
          {feature && <span style={{ color: currentLineColor }}>]{feature}]</span>}
          {feature && selectedBreakdown && <span> of </span>}
          {selectedBreakdown && <span style={{ color: currentLineColor }}>[{selectedBreakdown}]</span>}
          <span>: </span>
          <span style={{ color: currentLineColor }}>[{selectionVal}]</span>
          <span>.</span>
        </div>
      );
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const bisect = d3.bisector((d: DataPoint) => xScale(d.x)).center;
    const index = bisect(dataset, x);
    if (index >= 0 && index < dataset.length) {
      const closestPoint = dataset[index];
      setTooltip({
        x: xScale(closestPoint.x),
        y: yScale(closestPoint.y),
        value: closestPoint.y,
      } as LineChartTooltipProps);
    } else {
      setTooltip(null);
    }
  };
  const handleMouseOut = () => {
    setTooltip(null);
  };

  const finalLineColor =
    type === 'nominal' || type === 'trending' || type === 'start-end'
      ? gistvisSpec.unitSegmentSpec.attribute === 'positive'
        ? 'green'
        : gistvisSpec.unitSegmentSpec.attribute === 'negative'
          ? 'red'
          : 'grey'
      : colorScale(dataSpec[0]?.breakdown ?? 'defaultCategory');
  const uid =
    gistvisSpec.unitSegmentSpec.insightType + '-' + gistvisSpec.unitSegmentSpec.attribute + '-' + gistvisSpec.id;

  return (
    <Tooltip title={tooltip != null ? getTooltipContnet(tooltip.value) : ''} placement="bottom" color="#ffffff">
      <svg
        ref={svgRef}
        width={lineChartWidth + SVG_INTERVAL}
        height={SVG_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
      >
        <defs>
          <linearGradient id={`${uid}-areaGradient`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={finalLineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={finalLineColor} stopOpacity="0.2" />
          </linearGradient>
          <marker
            id={`arrow-end-${finalLineColor}`}
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,4 L4,2 z" fill={finalLineColor} />
          </marker>
          <marker
            id={`arrow-start-${finalLineColor}`}
            markerWidth="4"
            markerHeight="4"
            refX="1"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M4,0 L4,4 L0,2 z" fill={finalLineColor} />
          </marker>
        </defs>
        <path d={areaGenerator(dataset) || undefined} fill={`url(#${uid}-areaGradient`} />
        <path d={lineGenerator(dataset) || undefined} fill="none" strokeWidth={1.5} />
        {gistvisSpec.unitSegmentSpec.attribute === 'invariable' && (
          <g>
            <line
              x1={SVG_PADDING}
              y1={lineChartHeight / 2}
              x2={lineChartWidth - SVG_PADDING}
              y2={lineChartHeight / 2}
              stroke="grey"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          </g>
        )}
        {type === 'trending' && differenceLineDataset.length === 2 && (
          <path
            d={lineGeneratorDifference(differenceLineDataset) || undefined}
            fill="none"
            stroke={finalLineColor}
            strokeWidth={1}
            markerStart={`url(#arrow-start-${finalLineColor})`}
            markerEnd={`url(#arrow-end-${finalLineColor})`}
          />
        )}
        <path d={lineGenerator(dataset) || undefined} fill="none" stroke={finalLineColor} strokeWidth={1} />
        {tooltip && <circle cx={tooltip.x} cy={tooltip.y} r={2} fill="black" opacity={0.9} />}
      </svg>
    </Tooltip>
  );
};

export default Line;
