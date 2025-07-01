import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProperties, PropertyResponse } from '../api/properties';
import { getUserFavorites, addFavorite, removeFavorite } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

const propertyTypes = [
  { label: 'Todos', value: '', icon: 'grid-outline' },
  { label: 'Casa', value: 'casa', icon: 'home-outline' },
  { label: 'Departamento', value: 'departamento', icon: 'business-outline' },
  { label: 'Oficina', value: 'oficina', icon: 'briefcase-outline' },
  { label: 'Local', value: 'local', icon: 'storefront-outline' },
];

export default function PropertiesListScreen({ navigation, route }: any) {
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProperties = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const filters: any = {};
      if (search.trim()) filters.search = search.trim();
      if (type) filters.type = type;
      if (location.trim()) filters.location = location.trim();
      
      const data = await getProperties(filters);
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      if (showLoadingIndicator) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const favs = await getUserFavorites();
      setFavorites(favs.map((f: any) => f.id?.toString()));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties(false);
    fetchFavorites();
  };

  const toggleFavorite = async (propertyId: string) => {
    try {
      if (favorites.includes(propertyId)) {
        await removeFavorite(propertyId);
        setFavorites(favorites.filter(f => f !== propertyId));
      } else {
        await addFavorite(propertyId);
        setFavorites([...favorites, propertyId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setLocation('');
    fetchProperties();
  };

  const formatPrice = (price: number | string) => {
    if (!price) return 'Precio no disponible';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const renderPropertyCard = ({ item }: { item: PropertyResponse }) => {
    const isFavorite = favorites.includes(item.id?.toString());
    
    return (
      <TouchableOpacity 
        style={styles.propertyCard}
        onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {item.titulo || 'Propiedad sin título'}
            </Text>
            
            <View style={styles.propertyDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.direccion || 'Dirección no disponible'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.priceText}>
                  {formatPrice(item.precio)}
                </Text>
              </View>
              
              {item.tipo && (
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id?.toString());
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando propiedades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Propiedades</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons 
                name={showFilters ? 'filter' : 'filter-outline'} 
                size={24} 
                color={showFilters ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <InputField
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar propiedades..."
            leftIcon="search-outline"
            onSubmitEditing={() => fetchProperties()}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersContent}>
            {/* Property Types */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tipo de Propiedad</Text>
              <View style={styles.typeFilters}>
                {propertyTypes.map((propertyType) => (
                  <TouchableOpacity
                    key={propertyType.value}
                    style={[
                      styles.typeChip,
                      type === propertyType.value && styles.typeChipActive
                    ]}
                    onPress={() => setType(type === propertyType.value ? '' : propertyType.value)}
                  >
                    <Ionicons
                      name={propertyType.icon as any}
                      size={14}
                      color={type === propertyType.value ? colors.background : colors.textSecondary}
                    />
                    <Text style={[
                      styles.typeChipText,
                      type === propertyType.value && styles.typeChipTextActive
                    ]}>
                      {propertyType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Ubicación</Text>
              <InputField
                value={location}
                onChangeText={setLocation}
                placeholder="Buscar por ubicación..."
                leftIcon="location-outline"
                style={styles.locationInput}
              />
            </View>

            {/* Actions */}
            <View style={styles.filterActions}>
              <CustomButton
                title="Aplicar"
                onPress={() => fetchProperties()}
                leftIcon="search"
                style={styles.applyButton}
                size="small"
              />
              <CustomButton
                title="Limpiar"
                onPress={clearFilters}
                variant="outline"
                leftIcon="refresh"
                style={styles.clearButton}
                size="small"
              />
            </View>
          </View>
        </View>
      )}

      {/* Properties List */}
      <View style={styles.listContainer}>
        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No se encontraron propiedades</Text>
            <Text style={styles.emptySubtitle}>
              Intenta ajustar los filtros de búsqueda
            </Text>
          </View>
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderPropertyCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 8,
  },
  filtersContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  locationInput: {
    marginBottom: 0,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  applyButton: {
    flex: 2,
  },
  clearButton: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  propertyCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyInfo: {
    flex: 1,
    marginRight: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 24,
  },
  propertyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
