import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PendingIcon = ({ size = 24 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 12 8"
    fill="none"
  >
    <Path
      fill="white"
      d="M2.5 0L1 1.5L3.5 4L1 6.5L2.5 8l4-4z"
    />
    <Path
      fill="white"
      d="M7 0L5.5 1.5L8 4L5.5 6.5L7 8l4-4z"
    />
  </Svg>
);

export default PendingIcon;
