import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getChatMessagesByClientePropiedad,
  createChatMessage,
  ChatMensajeResponse,
  ChatMensajeRequest,
} from '../api/chatMessages';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

// Declarar tipo explícito para las props
export type ChatScreenProps = StackScreenProps<RootStackParamList, 'Chat'>;

function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { remitenteId, destinatarioId, agenteId, propiedadId, titulo } = route.params;
  const [mensajes, setMensajes] = useState<ChatMensajeResponse[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList<ChatMensajeResponse>>(null);

  useEffect(() => {
    navigation.setOptions({ 
      title: titulo || 'Chat',
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.textPrimary,
        fontWeight: '600',
      },
      headerTintColor: colors.textPrimary,
    });
    fetchMensajes();
  }, [propiedadId, remitenteId, destinatarioId]);

  const fetchMensajes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getChatMessagesByClientePropiedad(remitenteId, propiedadId);
      setMensajes(data);
      // Hacer scroll al final después de cargar los mensajes
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: any) {
      console.error('Error fetching messages:', e);
      setError(e.message || 'Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!mensaje.trim() || sending) return;
    
    setSending(true);
    setError('');
    
    const nuevoMensaje: ChatMensajeRequest = {
      remitenteId,
      destinatarioId,
      agenteId,
      propiedadId,
      titulo,
      mensaje: mensaje.trim(),
    };
    
    try {
      await createChatMessage(nuevoMensaje);
      setMensaje('');
      fetchMensajes();
    } catch (e: any) {
      console.error('Error sending message:', e);
      setError(e.message || 'No se pudo enviar el mensaje');
      Alert.alert('Error', e.message || 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMensajeResponse; index: number }) => {
    const isOwn = item.remitenteId === remitenteId;
    const previousMessage = index > 0 ? mensajes[index - 1] : null;
    const showTimestamp = !previousMessage || 
      (new Date(item.enviadoEn).getTime() - new Date(previousMessage.enviadoEn).getTime()) > 300000; // 5 minutos
    
    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {formatMessageTime(item.enviadoEn)}
          </Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.mensaje}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwn ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {new Date(item.enviadoEn).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            {isOwn && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.leido ? colors.success : colors.textTertiary}
                style={styles.readStatus}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>¡Inicia la conversación!</Text>
      <Text style={styles.emptySubtitle}>
        Envía un mensaje para comenzar a chatear sobre esta propiedad
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <View style={styles.messagesContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <CustomButton
                title="Reintentar"
                onPress={fetchMensajes}
                variant="secondary"
                size="small"
                leftIcon="refresh"
              />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={mensajes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMessage}
              contentContainerStyle={[
                styles.messagesList,
                mensajes.length === 0 && styles.emptyList
              ]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (mensajes.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              ListEmptyComponent={renderEmptyState}
              inverted={false}
            />
          )}
        </View>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <InputField
              value={mensaje}
              onChangeText={setMensaje}
              placeholder="Escribe un mensaje..."
              multiline
              maxLength={500}
              style={styles.messageInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!mensaje.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!mensaje.trim() || sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={mensaje.trim() ? colors.background : colors.textTertiary} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    marginVertical: 2,
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textTertiary,
    marginVertical: 16,
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 1,
  },
  ownMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    backgroundColor: colors.backgroundSecondary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: colors.background,
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: colors.textTertiary,
  },
  readStatus: {
    marginLeft: 2,
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
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
});
