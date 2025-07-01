import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getAllProperties, PropertyResponse } from '../api/properties';
import { UbicacionGeografica, hasValidCoordinates } from '../api/locations';
import LocationPicker from '../components/LocationPicker';
import LocationDisplay from '../components/LocationDisplay';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type LocationSearchNavigationProp = StackNavigationProp<RootStackParamList>;

interface PropertyWithDistance extends PropertyResponse {
  distance?: number;
}

export default function LocationSearchScreen() {
  const navigation = useNavigation<LocationSearchNavigationProp>();
  const { showError } = useToast();
  
  const [selectedLocation, setSelectedLocation] = useState<UbicacionGeografica | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(true);
  const [properties, setProperties] = useState<PropertyWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5); // km

  useEffect(() => {
    if (selectedLocation && hasValidCoordinates(selectedLocation)) {
      searchNearbyProperties();
    }
  }, [selectedLocation, searchRadius]);

  const handleLocationSelect = (location: UbicacionGeografica) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchNearbyProperties = async () => {
    if (!selectedLocation || !hasValidCoordinates(selectedLocation)) return;

    setLoading(true);
    try {
      const allProperties = await getAllProperties();
      
      // Filtrar propiedades por ubicación (simulado - en un caso real esto sería del backend)
      const filteredProperties: PropertyWithDistance[] = [];
      
      for (const property of allProperties) {
        // Aquí asumimos que las propiedades tendrán coordenadas en el futuro
        // Por ahora, filtramos por texto de dirección y asignamos distancias simuladas
        const matchesLocation = property.direccion.toLowerCase().includes(
          selectedLocation.distrito?.toLowerCase() || ''
        ) || property.direccion.toLowerCase().includes(
          selectedLocation.provincia?.toLowerCase() || ''
        ) || property.direccion.toLowerCase().includes(
          selectedLocation.region?.toLowerCase() || ''
        );

        if (matchesLocation) {
          // Distancia simulada entre 0.5 y 10 km
          const distance = Math.random() * 9.5 + 0.5;
          if (distance <= searchRadius) {
            filteredProperties.push({ ...property, distance });
          }
        }
      }

      // Ordenar por distancia
      filteredProperties.sort((a, b) => a.distance! - b.distance!);
      setProperties(filteredProperties);
    } catch (error) {
      showError('No se pudieron cargar las propiedades');
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderProperty = ({ item }: { item: PropertyWithDistance }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.propertyHeader}>
        <View style={styles.propertyIcon}>
          <Ionicons name="home" size={20} color={colors.primary} />
        </View>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.propertyAddress} numberOfLines={1}>{item.direccion}</Text>
        </View>
        {item.distance && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color={colors.primary} />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.propertyDetails}>
        <View style={styles.propertySpecs}>
          <View style={styles.specItem}>
            <Ionicons name="resize" size={14} color={colors.textSecondary} />
            <Text style={styles.specText}>{item.metrosCuadrados}m²</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="business" size={14} color={colors.textSecondary} />
            <Text style={styles.specText}>{item.tipo}</Text>
          </View>
        </View>
        <Text style={styles.propertyPrice}>{formatPrice(item.precio)}</Text>
      </View>
      
      <View style={styles.propertyFooter}>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.estado === 'DISPONIBLE' ? colors.successLight : colors.warningLight 
        }]}>
          <Text style={[styles.statusText, { 
            color: item.estado === 'DISPONIBLE' ? colors.success : colors.warning 
          }]}>
            {item.estado}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderRadiusChip = (radius: number) => (
    <TouchableOpacity
      key={radius}
      style={[
        styles.radiusChip,
        searchRadius === radius && styles.radiusChipActive
      ]}
      onPress={() => setSearchRadius(radius)}
    >
      <Text style={[
        styles.radiusChipText,
        searchRadius === radius && styles.radiusChipTextActive
      ]}>
        {radius}km
      </Text>
    </TouchableOpacity>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Ionicons name="search" size={48} color={colors.primary} />
      </View>
      <Text style={styles.loadingText}>Buscando propiedades...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No hay propiedades</Text>
      <Text style={styles.emptySubtitle}>
        No se encontraron propiedades en esta zona.{'\n'}
        Intenta ampliar el radio de búsqueda.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar por Ubicación</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Location Selection */}
        <View style={styles.locationCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Ubicación de búsqueda</Text>
          </View>
          
          {showLocationPicker ? (
            <View style={styles.locationPickerContainer}>
              <Text style={styles.sectionDescription}>
                Selecciona una ubicación para buscar propiedades cercanas
              </Text>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                placeholder="Buscar ubicación en Perú..."
                style={styles.locationPicker}
              />
            </View>
          ) : (
            <View style={styles.selectedLocationContainer}>
              {selectedLocation && (
                <LocationDisplay
                  location={selectedLocation}
                  showDetails={false}
                  style={styles.selectedLocation}
                />
              )}
              <CustomButton
                title="Cambiar ubicación"
                onPress={() => setShowLocationPicker(true)}
                variant="outline"
                size="small"
                leftIcon="location"
                style={styles.changeLocationButton}
              />
            </View>
          )}
        </View>

        {/* Search Radius */}
        {selectedLocation && !showLocationPicker && (
          <View style={styles.radiusCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="radio-button-on" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Radio de búsqueda</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Selecciona el área de búsqueda alrededor de la ubicación
            </Text>
            <View style={styles.radiusChips}>
              {[1, 3, 5, 10, 20].map(renderRadiusChip)}
            </View>
          </View>
        )}

        {/* Results */}
        {selectedLocation && !showLocationPicker && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <View style={styles.cardHeader}>
                <Ionicons name="home" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>
                  Propiedades encontradas ({properties.length})
                </Text>
              </View>
              {loading && (
                <View style={styles.loadingIndicator}>
                  <Ionicons name="refresh" size={16} color={colors.primary} />
                </View>
              )}
            </View>

            {loading ? (
              renderLoadingState()
            ) : properties.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={properties}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProperty}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        )}

        {/* Instructions */}
        {!selectedLocation && (
          <View style={styles.instructionsCard}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Selecciona ubicación</Text>
                <Text style={styles.instructionDescription}>
                  Elige el lugar donde quieres buscar propiedades
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="radio-button-on" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Define el radio</Text>
                <Text style={styles.instructionDescription}>
                  Ajusta el área de búsqueda según tu preferencia
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <Ionicons name="search" size={24} color={colors.primary} />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Explora resultados</Text>
                <Text style={styles.instructionDescription}>
                  Revisa las propiedades ordenadas por distancia
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  locationCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  locationPickerContainer: {
    gap: 0,
  },
  locationPicker: {
    marginBottom: 0,
  },
  selectedLocationContainer: {
    gap: 12,
  },
  selectedLocation: {
    marginBottom: 0,
  },
  changeLocationButton: {
    alignSelf: 'flex-start',
  },
  radiusCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radiusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  radiusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  radiusChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  propertyCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertySpecs: {
    flexDirection: 'row',
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryLight,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
