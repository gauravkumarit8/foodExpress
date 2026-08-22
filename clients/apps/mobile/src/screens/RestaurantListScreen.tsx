import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Restaurant } from '@foodexpress/api-client';
import type { HomeStackParamList } from '../navigation/types';
import { api } from '../lib/api';
import { getCurrentPosition, type Coords } from '../lib/geolocation';
import { RestaurantCard } from '../components/RestaurantCard';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'RestaurantList'>;

export function RestaurantListScreen({ navigation }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPosition().then((c) => {
      setCoords(c);
      setLocating(false);
    });
  }, []);

  useEffect(() => {
    if (locating) return;
    setLoading(true);
    setError(null);
    api.restaurants
      .browse({ lat: coords?.lat, lng: coords?.lng, page, limit: 20 })
      .then((result) => {
        setRestaurants((prev) => (page === 1 ? result.data : [...prev, ...result.data]));
        setTotalPages(result.totalPages);
      })
      .catch(() => setError('Could not load restaurants. Pull to refresh and try again.'))
      .finally(() => setLoading(false));
  }, [locating, coords, page]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurants near you</Text>
        {!coords && !locating && <Text style={styles.hint}>Showing all open restaurants</Text>}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
          />
        )}
        onEndReached={() => {
          if (page < totalPages && !loading) setPage((p) => p + 1);
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No restaurants found nearby yet.</Text>
          ) : (
            <Text style={styles.empty}>Loading restaurants…</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.ink + '66', marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.ink + '80', textAlign: 'center', marginTop: 48 },
  errorBanner: { marginHorizontal: 20, backgroundColor: colors.ticket[50], borderRadius: 4, padding: 12, marginBottom: 8 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.ticket[700] },
});
