import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getVerificationRequestsByUser, SolicitudVerificacionResponse, EstadoSolicitud } from '../api/verificationRequests';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

export default function VerificationRequestsListScreen() {
  const navigation = useNavigation();
  const [solicitudes, setSolicitudes] = useState<SolicitudVerificacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [filter, setFilter] = useState<'TODOS' | EstadoSolicitud>('TODOS');

  useEffect(() => {
    loadUserAndRequests();
  }, []);

  const loadUserAndRequests = async () => {
    try {
      // Obtener perfil del usuario
      const userProfile = await getUserProfile();
      setUserId(userProfile.id);
      
      // Cargar solicitudes del usuario
      const requests = await getVerificationRequestsByUser(userProfile.id);
      setSolicitudes(requests);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserAndRequests();
    setRefreshing(false);
  };

  const getStatusColor = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE':
        return colors.warning;
      case 'APROBADA':
        return colors.success;
      case 'RECHAZADA':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusIcon = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'time-outline';
      case 'APROBADA':
        return 'checkmark-circle';
      case 'RECHAZADA':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusDisplay = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'En revisión';
      case 'APROBADA':
        return 'Aprobada';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return estado;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterData = () => {
    if (filter === 'TODOS') return solicitudes;
    return solicitudes.filter(solicitud => solicitud.estado === filter);
  };

  const getFilterCount = (status: 'TODOS' | EstadoSolicitud) => {
    if (status === 'TODOS') return solicitudes.length;
    return solicitudes.filter(s => s.estado === status).length;
  };

  const FilterChip = ({ label, value, count }: { label: string; value: 'TODOS' | EstadoSolicitud; count: number }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filter === value && styles.filterChipActive
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        filter === value && styles.filterChipTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: SolicitudVerificacionResponse }) => (
    <View style={[globalStyles.card, styles.requestCard]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.requestId}>Solicitud #{item.id}</Text>
          <Text style={styles.requestDate}>{formatDate(item.fechaSolicitud)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Ionicons 
            name={getStatusIcon(item.estado) as any} 
            size={16} 
            color={colors.textLight} 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {getStatusDisplay(item.estado)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {item.fechaAprobacion && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha de procesamiento</Text>
              <Text style={styles.infoValue}>{formatDate(item.fechaAprobacion)}</Text>
            </View>
          </View>
        )}

        {item.comentarios && (
          <View style={styles.infoRow}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Comentarios</Text>
              <Text style={styles.infoValue}>{item.comentarios}</Text>
            </View>
          </View>
        )}

        {item.adminAprobadorId && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Procesado por</Text>
              <Text style={styles.infoValue}>Admin #{item.adminAprobadorId}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.bodyTextSecondary, styles.loadingText]}>
          Cargando solicitudes...
        </Text>
      </View>
    );
  }

  const filteredSolicitudes = filterData();

  return (
    <View style={[globalStyles.container, globalStyles.safeArea]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.title}>Mis Solicitudes</Text>
          <Text style={globalStyles.subtitle}>
            Gestiona tus solicitudes de verificación
          </Text>
        </View>
        <CustomButton
          title="Nueva"
          variant="primary"
          size="medium"
          onPress={() => navigation.navigate('RequestVerification' as never)}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FilterChip label="Todas" value="TODOS" count={getFilterCount('TODOS')} />
        <FilterChip label="En revisión" value="PENDIENTE" count={getFilterCount('PENDIENTE')} />
        <FilterChip label="Aprobadas" value="APROBADA" count={getFilterCount('APROBADA')} />
        <FilterChip label="Rechazadas" value="RECHAZADA" count={getFilterCount('RECHAZADA')} />
      </View>

      {/* Lista o Estado Vacío */}
      {filteredSolicitudes.length === 0 ? (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons 
            name="document-text-outline" 
            size={64} 
            color={colors.textTertiary} 
            style={styles.emptyIcon}
          />
          <Text style={globalStyles.emptyState}>
            {filter === 'TODOS' ? 'No tienes solicitudes' : `No hay solicitudes ${getStatusDisplay(filter as EstadoSolicitud).toLowerCase()}`}
          </Text>
          <Text style={globalStyles.bodyTextSecondary}>
            {filter === 'TODOS' 
              ? 'Crea una nueva solicitud para verificar tu cuenta'
              : 'Ajusta los filtros para ver más solicitudes'
            }
          </Text>
          {filter === 'TODOS' && (
            <CustomButton
              title="Crear Primera Solicitud"
              variant="primary"
              size="large"
              onPress={() => navigation.navigate('RequestVerification' as never)}
              style={styles.emptyButton}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSolicitudes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestId: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 24,
  },
});
