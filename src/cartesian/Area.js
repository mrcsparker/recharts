/**
 * @fileOverview Area
 */
import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import Curve from '../shape/Curve';
import Dot from '../shape/Dot';
import Layer from '../container/Layer';
import Animate from 'react-smooth';
import pureRender from '../util/PureRender';
import { PRESENTATION_ATTRIBUTES, getPresentationAttributes } from '../util/ReactUtils';

@pureRender
class Area extends Component {

  static displayName = 'Area';

  static propTypes = {
    ...PRESENTATION_ATTRIBUTES,
    className: PropTypes.string,
    type: PropTypes.oneOf(['linear', 'monotone', 'step', 'stepBefore', 'stepAfter']),
    unit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dataKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    yAxisId: PropTypes.number,
    xAxisId: PropTypes.number,
    stackId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    legendType: PropTypes.string,
    formatter: PropTypes.func,
    // dot configuration
    dot: PropTypes.oneOfType([PropTypes.element, PropTypes.object, PropTypes.bool]),
    label: PropTypes.oneOfType([PropTypes.element, PropTypes.object, PropTypes.bool]),
    // have curve configuration
    curve: PropTypes.bool,
    layout: PropTypes.oneOf(['horizontal', 'vertical']),
    baseLine: PropTypes.oneOfType([
      PropTypes.number, PropTypes.array,
    ]),
    points: PropTypes.arrayOf(PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      value: PropTypes.value,
    })),
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onClick: PropTypes.func,

    isAnimationActive: PropTypes.bool,
    animationBegin: PropTypes.number,
    animationDuration: PropTypes.number,
    animationEasing: PropTypes.oneOf(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear']),
  };

  static defaultProps = {
    strokeWidth: 1,
    stroke: '#3182bd',
    fill: '#3182bd',
    fillOpacity: 0.6,
    xAxisId: 0,
    yAxisId: 0,
    legendType: 'line',
    // points of area
    points: [],
    dot: false,
    label: false,
    curve: true,
    onClick() {},
    onMouseEnter() {},
    onMouseLeave() {},

    isAnimationActive: true,
    animationBegin: 0,
    animationDuration: 1500,
    animationEasing: 'ease',
  };

  renderCurve(points, opacity) {
    const { layout, type, curve } = this.props;
    let animProps = {
      points: this.props.points,
    };

    if (points) {
      animProps = {
        points,
        opacity,
      };
    }

    return (
      <g>
        {
          curve &&
          <Curve {...getPresentationAttributes(this.props)}
            className="recharts-area-curve"
            layout={layout}
            type={type}
            fill="none"
            { ...animProps }
          />
        }
        <Curve { ...this.props }
          stroke="none"
          className="recharts-area-area"
          { ...animProps }
        />
      </g>
    );
  }

  renderAreaCurve() {
    const { points, ...rest } = this.props;
    const {
      type,
      layout,
      baseLine,
      curve,
      isAnimationActive,
      animationBegin,
      animationDuration,
      animationEasing,
    } = this.props;

    if (points.length === 1) {
      return null;
    }

    const animationProps = {
      isActive: isAnimationActive,
      begin: animationBegin,
      easing: animationEasing,
      duration: animationDuration,
    };

    if (!baseLine || !baseLine.length) {
      const transformOrigin = layout === 'vertical' ? 'left center' : 'center bottom';
      const scaleType = layout === 'vertical' ? 'scaleX' : 'scaleY';

      return (
        <Animate attributeName="transform"
          from={`${scaleType}(0)`}
          to={`${scaleType}(1)`}
          { ...animationProps }
        >
          <g style={{ transformOrigin }}>
            { this.renderCurve() }
          </g>
        </Animate>
      );
    }

    return (
      <Animate from={{ alpha: 0 }}
        to={{ alpha: 1 }}
        { ...animationProps }
      >
      {
        ({ alpha }) => this.renderCurve(
          points.map(
            ({ x, y }, i) => ({
              x,
              y: (y - baseLine[i].y) * alpha + baseLine[i].y,
            })
          ),
          +(alpha > 0),
        )
      }
      </Animate>
    );
  }

  renderDots() {
    const { dot, points } = this.props;
    const areaProps = getPresentationAttributes(this.props);
    const customDotProps = getPresentationAttributes(dot);
    const isDotElement = React.isValidElement(dot);

    const dots = points.map((entry, i) => {
      const dotProps = {
        key: `dot-${i}`,
        r: 3,
        ...areaProps,
        ...customDotProps,
        cx: entry.x,
        cy: entry.y,
        index: i,
        playload: entry,
      };

      return isDotElement ?
        React.cloneElement(dot, dotProps) :
        <Dot {...dotProps} className="recharts-area-dot" />;
    });

    return <Layer className="recharts-area-dots">{dots}</Layer>;
  }

  renderLabels() {
    const { points, label } = this.props;
    const areaProps = getPresentationAttributes(this.props);
    const customLabelProps = getPresentationAttributes(label);
    const isLabelElement = React.isValidElement(label);

    const labels = points.map((entry, i) => {
      const labelProps = {
        textAnchor: 'middle',
        ...entry,
        ...areaProps,
        ...customLabelProps,
        index: i,
        key: `label-${i}`,
        payload: entry,
      };

      return isLabelElement ?
        React.cloneElement(label, labelProps) :
        (<text {...labelProps} className="recharts-area-label">{entry.value}</text>);
    });

    return <Layer className="recharts-area-labels">{labels}</Layer>;
  }

  render() {
    const {
      dot,
      curve,
      label,
      points,
      className,
      layout,
      ...other,
    } = this.props;

    if (!points || !points.length) { return null; }

    const hasSinglePoint = points.length === 1;
    const layerClass = classNames('recharts-area', className);

    return (
      <Layer className={layerClass}>
        { this.renderAreaCurve() }
        {(dot || hasSinglePoint) && this.renderDots()}
        {label && this.renderLabels()}
      </Layer>
    );
  }
}

export default Area;
