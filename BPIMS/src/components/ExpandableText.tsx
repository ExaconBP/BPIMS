import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string | null;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 20,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <Text
        className={`text-black text-sm ${className ?? ''}`}
        numberOfLines={expanded ? 0 : 1}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default ExpandableText;
