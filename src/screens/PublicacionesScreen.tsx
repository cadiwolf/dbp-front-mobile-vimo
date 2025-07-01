import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getPublicacionesPaginadas } from '../api/publications';
import CustomButton from '../components/CustomButton';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

interface Publicacion {
  id: number;
  titulo?: string;
  descripcion?: string;
  estado: 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'BORRADOR';
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  propiedadId?: number;
  usuarioId?: number;
  tipo?: 'VENTA' | 'ALQUILER';
  precio?: number;
}

type FilterState = 'TODAS' | 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'BORRADOR';
type SortField = 'fechaCreacion' | 'fechaInicio' | 'fechaFin' | 'titulo';
type SortOrder = 'asc' | 'desc';

export default function PublicacionesScreen() {
  const navigation = useNavigation();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filteredPublicaciones, setFilteredPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('TODAS');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('fechaCreacion');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const PAGE_SIZE = 10;

  const fetchPublicaciones = async (nextPage = 1, resetData = false) => {
    if (loading) return;
    setLoading(true);
    setError('');
    
    try {
      const data = await getPublicacionesPaginadas(nextPage, PAGE_SIZE);
      const newPublicaciones = data.content || [];
      
      if (resetData || nextPage === 1) {
        setPublicaciones(newPublicaciones);
      } else {
        setPublicaciones(prev => [...prev, ...newPublicaciones]);
      }
      
      setHasMore(!data.last);
      setPage(nextPage);
    } catch (e: any) {
      console.error('Error al cargar publicaciones:', e);
      setError(e.message || 'Error al cargar publicaciones');
      Alert.alert('Error', 'No se pudieron cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPublicaciones(1, true);
    setRefreshing(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchPublicaciones(page + 1);
    }
  }, [hasMore, loading, page]);

  const getEstadoColor = (estado: Publicacion['estado']) => {
    switch (estado) {
      case 'ACTIVA':
        return colors.success;
      case 'PAUSADA':
        return colors.warning;
      case 'FINALIZADA':
        return colors.error;
      case 'BORRADOR':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getEstadoIcon = (estado: Publicacion['estado']) => {
    switch (estado) {
      case 'ACTIVA':
        return 'checkmark-circle';
      case 'PAUSADA':
        return 'pause-circle';
      case 'FINALIZADA':
        return 'stop-circle';
      case 'BORRADOR':
        return 'create-outline';
      default:
        return 'help-circle';
    }
  };

  const getEstadoDisplay = (estado: Publicacion['estado']) => {
    switch (estado) {
      case 'ACTIVA':
        return 'Activa';
      case 'PAUSADA':
        return 'Pausada';
      case 'FINALIZADA':
        return 'Finalizada';
      case 'BORRADOR':
        return 'Borrador';
      default:
        return estado;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Funciones de filtrado y búsqueda
  const filterAndSortPublicaciones = useCallback(() => {
    let filtered = [...publicaciones];

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      filtered = filtered.filter(pub =>
        (pub.titulo?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        (pub.descripcion?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
        pub.id.toString().includes(searchText)
      );
    }

    // Filtrar por estado
    if (filterState !== 'TODAS') {
      filtered = filtered.filter(pub => pub.estado === filterState);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'titulo':
          aValue = a.titulo || `Publicación #${a.id}`;
          bValue = b.titulo || `Publicación #${b.id}`;
          break;
        case 'fechaCreacion':
          aValue = new Date(a.fechaCreacion);
          bValue = new Date(b.fechaCreacion);
          break;
        case 'fechaInicio':
          aValue = new Date(a.fechaInicio);
          bValue = new Date(b.fechaInicio);
          break;
        case 'fechaFin':
          aValue = new Date(a.fechaFin);
          bValue = new Date(b.fechaFin);
          break;
        default:
          aValue = a.fechaCreacion;
          bValue = b.fechaCreacion;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredPublicaciones(filtered);
  }, [publicaciones, searchText, filterState, sortField, sortOrder]);

  const getFilterCount = (estado: FilterState) => {
    if (estado === 'TODAS') return publicaciones.length;
    return publicaciones.filter(pub => pub.estado === estado).length;
  };

  const FilterChip = ({ estado, label }: { estado: FilterState; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filterState === estado && styles.filterChipActive
      ]}
      onPress={() => setFilterState(estado)}
    >
      <Text style={[
        styles.filterChipText,
        filterState === estado && styles.filterChipTextActive
      ]}>
        {label} ({getFilterCount(estado)})
      </Text>
    </TouchableOpacity>
  );

  // Effects
  useEffect(() => {
    fetchPublicaciones(1, true);
  }, []);

  useEffect(() => {
    filterAndSortPublicaciones();
  }, [filterAndSortPublicaciones]);

  const renderItem = ({ item }: { item: Publicacion }) => (
    <TouchableOpacity
      style={[globalStyles.card, styles.publicacionCard]}
      activeOpacity={0.7}
      onPress={() => {
        // TODO: Navegar a detalles de publicación
        Alert.alert('Publicación', `Ver detalles de: ${item.titulo || `Publicación #${item.id}`}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.publicacionInfo}>
          <Text style={styles.publicacionTitle}>
            {item.titulo || `Publicación #${item.id}`}
          </Text>
          {item.tipo && (
            <View style={styles.tipoContainer}>
              <Ionicons 
                name={item.tipo === 'VENTA' ? 'pricetag' : 'calendar'} 
                size={14} 
                color={colors.textSecondary} 
              />
              <Text style={styles.tipoText}>{item.tipo}</Text>
            </View>
          )}
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          <Ionicons 
            name={getEstadoIcon(item.estado) as any} 
            size={12} 
            color={colors.textLight} 
          />
          <Text style={styles.estadoText}>
            {getEstadoDisplay(item.estado)}
          </Text>
        </View>
      </View>

      {item.descripcion && (
        <Text style={styles.publicacionDescription} numberOfLines={2}>
          {item.descripcion}
        </Text>
      )}

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Inicio: {formatDate(item.fechaInicio)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Fin: {formatDate(item.fechaFin)}
          </Text>
        </View>

        {item.precio && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={colors.success} />
            <Text style={[styles.infoText, { color: colors.success, fontWeight: '600' }]}>
              {formatPrice(item.precio)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.metaText}>
          Creada: {formatDate(item.fechaCreacion)}
        </Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const FiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros y Ordenación</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Ordenación */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Ordenar por</Text>
            <View style={styles.sortOptions}>
              {([
                { field: 'fechaCreacion', label: 'Fecha de creación' },
                { field: 'fechaInicio', label: 'Fecha de inicio' },
                { field: 'fechaFin', label: 'Fecha de fin' },
                { field: 'titulo', label: 'Título' }
              ] as const).map(({ field, label }) => (
                <TouchableOpacity
                  key={field}
                  style={[
                    styles.sortOption,
                    sortField === field && styles.sortOptionActive
                  ]}
                  onPress={() => setSortField(field)}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortField === field && styles.sortOptionTextActive
                  ]}>
                    {label}
                  </Text>
                  {sortField === field && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sortOrderContainer}>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  sortOrder === 'desc' && styles.sortOrderButtonActive
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Ionicons name="arrow-down" size={16} color={sortOrder === 'desc' ? colors.textLight : colors.textSecondary} />
                <Text style={[
                  styles.sortOrderText,
                  sortOrder === 'desc' && styles.sortOrderTextActive
                ]}>
                  Descendente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  sortOrder === 'asc' && styles.sortOrderButtonActive
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Ionicons name="arrow-up" size={16} color={sortOrder === 'asc' ? colors.textLight : colors.textSecondary} />
                <Text style={[
                  styles.sortOrderText,
                  sortOrder === 'asc' && styles.sortOrderTextActive
                ]}>
                  Ascendente
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <CustomButton
            title="Aplicar Filtros"
            variant="primary"
            size="large"
            onPress={() => setShowFilters(false)}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading && publicaciones.length === 0) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.bodyTextSecondary, styles.loadingText]}>
          Cargando publicaciones...
        </Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, globalStyles.safeArea]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.title}>Publicaciones</Text>
          <Text style={globalStyles.subtitle}>
            Gestiona todas las publicaciones del sistema
          </Text>
        </View>
        <CustomButton
          title="Nueva"
          variant="primary"
          size="medium"
          onPress={() => {
            // TODO: Navegar a crear publicación
            Alert.alert('Próximamente', 'Función de crear publicación en desarrollo');
          }}
        />
      </View>

      {/* Búsqueda y filtros */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar publicaciones..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.textTertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chips de filtrado por estado */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            <FilterChip estado="TODAS" label="Todas" />
            <FilterChip estado="ACTIVA" label="Activas" />
            <FilterChip estado="PAUSADA" label="Pausadas" />
            <FilterChip estado="FINALIZADA" label="Finalizadas" />
            <FilterChip estado="BORRADOR" label="Borradores" />
          </View>
        </ScrollView>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredPublicaciones.length} de {publicaciones.length} publicaciones
        </Text>
        {loading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      {/* Lista de publicaciones */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton
            title="Reintentar"
            variant="secondary"
            size="medium"
            onPress={() => fetchPublicaciones(1, true)}
          />
        </View>
      ) : filteredPublicaciones.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
          <Text style={globalStyles.emptyState}>
            {searchText || filterState !== 'TODAS' 
              ? 'No se encontraron publicaciones' 
              : 'No hay publicaciones aún'
            }
          </Text>
          <Text style={globalStyles.bodyTextSecondary}>
            {searchText || filterState !== 'TODAS'
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Crea tu primera publicación para comenzar'
            }
          </Text>
          {!searchText && filterState === 'TODAS' && (
            <CustomButton
              title="Crear Primera Publicación"
              variant="primary"
              size="large"
              onPress={() => {
                Alert.alert('Próximamente', 'Función de crear publicación en desarrollo');
              }}
              style={styles.emptyButton}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPublicaciones}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            loading && publicaciones.length > 0 ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingFooterText}>Cargando más...</Text>
              </View>
            ) : !hasMore && publicaciones.length > 0 ? (
              <Text style={styles.endText}>No hay más publicaciones</Text>
            ) : null
          }
        />
      )}

      <FiltersModal />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  publicacionCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  publicacionInfo: {
    flex: 1,
    marginRight: 12,
  },
  publicacionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tipoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  publicacionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  actionButton: {
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    marginTop: 24,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingFooterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  endText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textTertiary,
    paddingVertical: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sortOptions: {
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  sortOrderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortOrderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortOrderTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
