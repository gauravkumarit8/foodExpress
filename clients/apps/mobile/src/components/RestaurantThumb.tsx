import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius } from '../theme';

function PlateGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7.5" stroke={colors.ink} strokeOpacity={0.25} strokeWidth={1.4} />
      <Circle cx="12" cy="12" r="3.2" stroke={colors.ink} strokeOpacity={0.25} strokeWidth={1.4} />
    </Svg>
  );
}

export function RestaurantThumb({ src, size = 64 }: { src?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {showImage ? (
        <Image source={{ uri: src }} style={styles.img} onError={() => setFailed(true)} />
      ) : (
        <PlateGlyph size={Math.round(size * 0.4)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.ticket,
    backgroundColor: colors.paperDark,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
});
