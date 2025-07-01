import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  validationErrors?: { [key: string]: string };
  onDismiss: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorModal({
  visible,
  title,
  message,
  validationErrors,
  onDismiss,
  type = 'error'
}: ErrorModalProps) {
  const getIconAndColor = () => {
    switch (type) {
      case 'error':
        return { icon: '❌', color: '#dc3545' };
      case 'warning':
        return { icon: '⚠️', color: '#ffc107' };
      case 'info':
        return { icon: 'ℹ️', color: '#17a2b8' };
      default:
        return { icon: '❌', color: '#dc3545' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.header, { backgroundColor: color }]}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            
            {validationErrors && (
              <View style={styles.validationContainer}>
                <Text style={styles.validationTitle}>Errores de validación:</Text>
                {Object.entries(validationErrors).map(([field, error]) => (
                  <View key={field} style={styles.validationItem}>
                    <Text style={styles.validationField}>{field}:</Text>
                    <Text style={styles.validationError}>{error}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: color }]}
              onPress={onDismiss}
            >
              <Text style={styles.buttonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  validationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  validationItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  validationField: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginRight: 8,
    minWidth: 80,
  },
  validationError: {
    fontSize: 14,
    color: '#dc3545',
    flex: 1,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
