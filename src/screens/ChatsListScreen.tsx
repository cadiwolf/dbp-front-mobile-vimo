import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

interface ChatItem {
  id: number;
  titulo: string;
  remitenteId: number;
  destinatarioId: number;
  agenteId: number;
  propiedadId: number;
  ultimoMensaje?: string;
  fechaUltimoMensaje?: string;
  noLeidos?: number;
  estado?: 'activo' | 'archivado';
}

export default function ChatsListScreen({ navigation }: any) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Datos de ejemplo - en producción esto vendría de una API
  const dummyChats: ChatItem[] = [
    {
      id: 1,
      titulo: 'Casa en Zona Norte',
      remitenteId: 2,
      destinatarioId: 3,
      agenteId: 3,
      propiedadId: 10,
      ultimoMensaje: 'Perfecto, podemos coordinar la visita para mañana por la tarde.',
      fechaUltimoMensaje: new Date().toISOString(),
      noLeidos: 2,
      estado: 'activo',
    },
    {
      id: 2,
      titulo: 'Apartamento Centro',
      remitenteId: 2,
      destinatarioId: 4,
      agenteId: 4,
      propiedadId: 15,
      ultimoMensaje: 'Gracias por su interés. ¿Tiene alguna pregunta específica?',
      fechaUltimoMensaje: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      noLeidos: 0,
      estado: 'activo',
    },
    {
      id: 3,
      titulo: 'Oficina Zona Comercial',
      remitenteId: 2,
      destinatarioId: 5,
      agenteId: 5,
      propiedadId: 22,
      ultimoMensaje: 'El precio incluye servicios públicos y administración.',
      fechaUltimoMensaje: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
      noLeidos: 0,
      estado: 'activo',
    },
  ];

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      // Simular carga de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChats(dummyChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // menos de una semana
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const navigateToChat = (chat: ChatItem) => {
    navigation.navigate('Chat', {
      remitenteId: chat.remitenteId,
      destinatarioId: chat.destinatarioId,
      agenteId: chat.agenteId,
      propiedadId: chat.propiedadId,
      titulo: chat.titulo,
    });
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigateToChat(item)}
      activeOpacity={0.8}
    >
      <View style={styles.chatContent}>
        <View style={styles.avatarContainer}>
          <Ionicons name="home" size={24} color={colors.primary} />
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.fechaUltimoMensaje || '')}
            </Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.ultimoMensaje || 'Conversación iniciada'}
            </Text>
            {item.noLeidos && item.noLeidos > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.noLeidos > 9 ? '9+' : item.noLeidos}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.chatActions}>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No tienes conversaciones</Text>
      <Text style={styles.emptySubtitle}>
        Cuando contactes a un agente sobre una propiedad, aparecerán aquí tus chats
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Chats</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        contentContainerStyle={[
          styles.listContainer,
          chats.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  chatCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  chatActions: {
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
