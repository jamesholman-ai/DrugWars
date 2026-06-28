import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radius } from '../../theme/theme';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

function SparklineInner({ values, width = 72, height = 28, color = palette.neon }: SparklineProps) {
  if (values.length < 2) {
    return <View style={[styles.empty, { width, height }]} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  return (
    <View style={[styles.wrap, { width, height }]}>
      {points.slice(1).map((p, i) => {
        const prev = points[i];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              {
                width: length,
                left: prev.x,
                top: prev.y,
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export const Sparkline = memo(SparklineInner);

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: palette.bg,
  },
  empty: {
    backgroundColor: palette.bg,
    borderRadius: radius.sm,
    opacity: 0.5,
  },
  segment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
});
