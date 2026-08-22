import { StyleSheet, Text, View } from 'react-native';
import { ORDER_STATUS_LABEL, ORDER_STATUS_SEQUENCE, OrderStatus, type Order } from '@foodexpress/api-client';
import { colors, fonts, radius } from '../theme';

const KITCHEN_STEPS = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY];
const DELIVERY_STEPS = [OrderStatus.PICKED_UP, OrderStatus.DELIVERED];

function StatusRow({ status, state }: { status: OrderStatus; state: 'done' | 'current' | 'upcoming' }) {
  return (
    <View style={rowStyles.row}>
      <View
        style={[
          rowStyles.dot,
          state === 'done' && rowStyles.dotDone,
          state === 'current' && rowStyles.dotCurrent,
          state === 'upcoming' && rowStyles.dotUpcoming,
        ]}
      >
        {state === 'done' && <Text style={rowStyles.checkmark}>✓</Text>}
      </View>
      <Text
        style={[
          rowStyles.label,
          state === 'upcoming' && rowStyles.labelUpcoming,
          state === 'current' && rowStyles.labelCurrent,
        ]}
      >
        {ORDER_STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

export function OrderTicketRail({ order }: { order: Order }) {
  if (order.status === OrderStatus.CANCELLED) {
    return (
      <View style={styles.voidCard}>
        <Text style={styles.voidText}>VOID</Text>
        <Text style={styles.voidSubtext}>This order was cancelled.</Text>
      </View>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status);
  const stateFor = (status: OrderStatus): 'done' | 'current' | 'upcoming' => {
    const idx = ORDER_STATUS_SEQUENCE.indexOf(status);
    if (idx < currentIndex) return 'done';
    if (idx === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.placedAt}>Placed {new Date(order.placedAt).toLocaleString()}</Text>
      </View>
      <View style={styles.section}>
        {KITCHEN_STEPS.map((status) => (
          <StatusRow key={status} status={status} state={stateFor(status)} />
        ))}
      </View>
      <View style={styles.tear} />
      <View style={styles.section}>
        {DELIVERY_STEPS.map((status) => (
          <StatusRow key={status} status={status} state={stateFor(status)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  orderId: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.ink + '80', textTransform: 'uppercase' },
  placedAt: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink + '66', marginTop: 2 },
  section: { paddingHorizontal: 20, paddingVertical: 8 },
  // Approximates the web app's radial-gradient perforation with a dashed
  // rule — React Native has no radial-gradient without an extra native lib.
  tear: {
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderTopColor: colors.line,
    marginHorizontal: 12,
  },
  voidCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.ticket[500],
    borderRadius: radius.ticket,
    backgroundColor: colors.white,
    padding: 24,
    alignItems: 'center',
  },
  voidText: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 4, color: colors.ticket[500] },
  voidSubtext: { fontFamily: fonts.body, fontSize: 13, color: colors.ink + '99', marginTop: 4 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { borderColor: colors.ink, backgroundColor: colors.ink },
  dotCurrent: { borderColor: colors.ticket[500], backgroundColor: colors.ticket[500] },
  dotUpcoming: { borderColor: colors.line },
  checkmark: { color: colors.paper, fontFamily: fonts.mono, fontSize: 12 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  labelUpcoming: { color: colors.ink + '4D' },
  labelCurrent: { color: colors.ticket[500] },
});
