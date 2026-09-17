import React from 'react';

interface ClayIconProps {
  children: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  shadowColor?: string;
  highlightColor?: string;
  className?: string;
}

export const ClayIcon: React.FC<ClayIconProps> = ({ 
  shadowColor = 'rgba(0,0,0,0.6)',
  highlightColor = 'rgba(255,255,255,0.4)', 
  children,
  className = ''
}) => {
  const filterId = React.useId().replace(/:/g, '');

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id={`clay-${filterId}`} x="-50%" y="-50%" width="200%" height="200%">
            {/* Outer highlight (Top-Left) */}
            <feDropShadow dx="-2" dy="-2" stdDeviation="2.5" floodColor={highlightColor} result="outer-light" />
            
            {/* Outer shadow (Bottom-Right) */}
            <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor={shadowColor} result="outer-dark" />

            {/* Inner shadow (Bottom-Right) */}
            <feOffset dx="2" dy="2" in="SourceAlpha" />
            <feGaussianBlur stdDeviation="1.5" result="inner-shadow-blur" />
            <feComposite operator="out" in="SourceAlpha" in2="inner-shadow-blur" result="inverse-inner-shadow" />
            <feFlood floodColor={shadowColor} result="inner-shadow-color" />
            <feComposite operator="in" in="inner-shadow-color" in2="inverse-inner-shadow" result="inner-shadow-final" />

            {/* Inner highlight (Top-Left) */}
            <feOffset dx="-2" dy="-2" in="SourceAlpha" />
            <feGaussianBlur stdDeviation="1.5" result="inner-light-blur" />
            <feComposite operator="out" in="SourceAlpha" in2="inner-light-blur" result="inverse-inner-light" />
            <feFlood floodColor={highlightColor} result="inner-light-color" />
            <feComposite operator="in" in="inner-light-color" in2="inverse-inner-light" result="inner-light-final" />

            {/* Merge inner shadows over original graphic */}
            <feComposite operator="over" in="inner-shadow-final" in2="SourceGraphic" result="with-inner-shadow" />
            <feComposite operator="over" in="inner-light-final" in2="with-inner-shadow" result="final-graphic" />

            {/* Combine outer shadows with the final graphic */}
            <feMerge>
              <feMergeNode in="outer-light" />
              <feMergeNode in="outer-dark" />
              <feMergeNode in="final-graphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {React.cloneElement(children, {
        className: `${children.props.className || ''} ${className}`,
        style: { ...children.props.style, overflow: 'visible', filter: `url(#clay-${filterId})` }
      })}
    </>
  );
};
