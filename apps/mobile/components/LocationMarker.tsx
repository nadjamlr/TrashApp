import { StyleSheet, View } from 'react-native';
import { Icon } from './navbar/Icon';
import type { LocationType } from '@/services/locationsService';

type Props = {
  type: LocationType;
  selected?: boolean;
  saved?: boolean;
};

export function LocationMarker({ type, selected = false, saved = false }: Props) {
  const isHof = type === 'wertstoffhof';
  const size = selected ? 44 : 36;
  const radius = selected ? 12 : 10;

  if (saved) {
    return (
      <View
        pointerEvents="none"
        style={[styles.pin, styles.pinSaved, { width: size, height: size, borderRadius: radius }]}
      >
        <Icon name="bookmark" size={selected ? 20 : 16} color="#21242C" />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.pin, isHof ? styles.pinHof : styles.pinInsel, selected && styles.pinSelected]}
    >
      <Icon
        name={isHof ? 'trash-2' : 'refresh-cw'}
        size={selected ? 20 : 16}
        color={selected ? '#21242C' : '#FFFFFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinInsel: {
    backgroundColor: '#38632E',
  },
  pinHof: {
    backgroundColor: '#21242C',
  },
  pinSaved: {
    backgroundColor: '#FEDA10',
  },
  pinSelected: {
    backgroundColor: '#FEDA10',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
});
