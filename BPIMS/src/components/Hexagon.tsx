import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Polygon, Text as SvgText } from 'react-native-svg';

type HexagonProps = {
    rewardName?: string;
    orderId?: number;
    size?: number;
    hasItem?: boolean | null;
    isDone?: boolean;
    dateDone?: string | null;
    itemName?: string;
    itemRewardId: number
};

const Hexagon: React.FC<HexagonProps> = ({
    rewardName,
    orderId,
    size = 100,
    hasItem,
    isDone = false,
    dateDone,
    itemName,
    itemRewardId
}) => {
    const height = size * 0.866;
    const strokeWidth = size * 0.02;

    const colors = {
        fill: isDone ? '#fe6500' : 'white',
        text: isDone ? 'white' : '#fe6500',
        stroke: hasItem ? 'red' : isDone ? '#fe6500' : '#fe6500'
    };

    const getDisplayText = () => {
        if (itemRewardId === 1 && itemName) return itemName;
        if (rewardName) return rewardName;
        if (orderId) return `${orderId}`;
        return '';
    };

    const displayText = getDisplayText();

    const splitText = (text: string) => {
        const words = text.split(' ');
        if (words.length <= 3) return [text];

        const mid = Math.ceil(words.length / 2);
        return [
            words.slice(0, mid).join(' '),
            words.slice(mid).join(' ')
        ];
    };

    const textLines = splitText(displayText);
    const isMultiline = textLines.length > 1;

    const textSize = isMultiline ? size * 0.07 : size * 0.2;
    const lineHeight = textSize * 1.2;

    const getHexagonPoints = () => {
        const points = [
            [size / 2, 0],
            [size, height * 0.25],
            [size, height * 0.75],
            [size / 2, height],
            [0, height * 0.75],
            [0, height * 0.25]
        ];
        return points.map(p => p.join(',')).join(' ');
    };

    return (
        <View style={[styles.container, { width: size, height: height }]}>
            <Svg width="100%" height={height} viewBox={`0 0 ${size} ${height}`}>
                <Polygon
                    points={getHexagonPoints()}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                />
                <G>
                    {textLines.map((line, index) => (
                        <SvgText
                            key={index}
                            x="50%"
                            y={isMultiline ? `40%` : '50%'}
                            dy={`${index * lineHeight + 8}px`}
                            textAnchor="middle"
                            fill={colors.text}
                            fontSize={textSize}
                            fontWeight="bold"
                            fontFamily="sans-serif"
                        >
                            {line}
                        </SvgText>
                    ))}
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        margin: 4
    }
});

export default Hexagon;