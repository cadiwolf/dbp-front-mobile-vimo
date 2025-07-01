import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createVerificationRequest, SolicitudVerificacionRequest } from '../api/verificationRequests';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';

export default function RequestVerificationScreen() {
  const navigation = useNavigation();
  const { showError, showSuccess } = useToast();
  
  const [form, setForm] = useState<SolicitudVerificacionRequest>({
    usuarioId: 0,
    documentoAdjunto: '',
    comentarios: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      const userProfile = await getUserProfile();
      setForm(prev => ({ ...prev, usuarioId: userProfile.id }));
    } catch (error) {
      showError('No se pudo cargar el perfil del usuario');
      navigation.goBack();
    } finally {
      setLoadingUser(false);
    }
  };

  const validateForm = () => {
    if (!form.documentoAdjunto.trim()) {
      showError('Debe proporcionar un documento adjunto');
      return false;
    }

    // Validar formato de URL básico
    const urlPattern = /^(https?:\/\/)|(www\.)/;
    if (!urlPattern.test(form.documentoAdjunto)) {
      showError('El documento debe ser una URL válida');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createVerificationRequest(form);
      showSuccess('Solicitud enviada exitosamente');
      
      // Mostrar modal de confirmación
      setShowInfoModal(true);
    } catch (error) {
      showError('No se pudo enviar la solicitud de verificación');
    } finally {
      setLoading(false);
    }
  };

  const openDocumentHelper = () => {
    Linking.openURL('https://help.example.com/verification-documents');
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
      </View>
      <Text style={styles.loadingText}>Cargando información...</Text>
    </View>
  );

  const renderRequirementItem = (icon: string, title: string, description: string) => (
    <View style={styles.requirementItem} key={title}>
      <View style={styles.requirementIcon}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.requirementContent}>
        <Text style={styles.requirementTitle}>{title}</Text>
        <Text style={styles.requirementDescription}>{description}</Text>
      </View>
    </View>
  );

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Solicitar Verificación</Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => setShowRequirementsModal(true)}
        >
          <Ionicons name="help-circle" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.verificationIcon}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerCardTitle}>Verificación de Cuenta</Text>
            <Text style={styles.headerCardSubtitle}>
              Obtenga una cuenta verificada para mayor confianza y credibilidad
            </Text>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="star" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Beneficios de la verificación</Text>
          </View>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>Mayor confianza de otros usuarios</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>Acceso a funciones premium</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>Prioridad en búsquedas</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.benefitText}>Soporte prioritario</Text>
            </View>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Información requerida</Text>
          </View>

          <View style={styles.formSection}>
            <InputField
              label="Documento de verificación"
              placeholder="https://drive.google.com/file/d/..."
              value={form.documentoAdjunto}
              onChangeText={(text) => setForm({ ...form, documentoAdjunto: text })}
              leftIcon="link"
              keyboardType="url"
              autoCapitalize="none"
              required
            />
            <TouchableOpacity 
              style={styles.helpButton2}
              onPress={openDocumentHelper}
            >
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.helpButtonText}>¿Qué documentos puedo usar?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <InputField
              label="Información adicional"
              placeholder="Proporcione detalles adicionales sobre su solicitud..."
              value={form.comentarios || ''}
              onChangeText={(text) => setForm({ ...form, comentarios: text })}
              leftIcon="chatbubble-outline"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Process Info Card */}
        <View style={styles.processCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Proceso de verificación</Text>
          </View>
          
          <View style={styles.processSteps}>
            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Envío de solicitud</Text>
                <Text style={styles.stepDescription}>Complete el formulario con su documento</Text>
              </View>
            </View>

            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Revisión del equipo</Text>
                <Text style={styles.stepDescription}>Nuestro equipo revisará su documento (1-3 días)</Text>
              </View>
            </View>

            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Notificación de resultado</Text>
                <Text style={styles.stepDescription}>Recibirá una notificación con el resultado</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <CustomButton
          title={loading ? "Enviando solicitud..." : "Enviar Solicitud"}
          onPress={handleSubmit}
          disabled={loading || !form.documentoAdjunto.trim()}
          variant="primary"
          size="large"
          leftIcon={loading ? undefined : "paper-plane"}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.modalTitle}>¡Solicitud enviada!</Text>
              <Text style={styles.modalSubtitle}>
                Su solicitud de verificación ha sido enviada exitosamente y está pendiente de revisión.
              </Text>
            </View>
            
            <View style={styles.modalInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>Tiempo de procesamiento: 1-3 días hábiles</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="notifications" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>Recibirá una notificación cuando sea procesada</Text>
              </View>
            </View>
            
            <CustomButton
              title="Entendido"
              onPress={() => {
                setShowInfoModal(false);
                navigation.goBack();
              }}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Requirements Modal */}
      <Modal
        visible={showRequirementsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeaderBar}>
            <TouchableOpacity onPress={() => setShowRequirementsModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitleBar}>Requisitos de Verificación</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.requirementsContent}>
              <Text style={styles.requirementsTitle}>Documentos aceptados</Text>
              <Text style={styles.requirementsDescription}>
                Para verificar su cuenta, puede usar cualquiera de los siguientes documentos:
              </Text>

              {renderRequirementItem(
                'card',
                'Documento de identidad',
                'Cédula de identidad, DNI, pasaporte o licencia de conducir'
              )}

              {renderRequirementItem(
                'business',
                'Documentos profesionales',
                'Licencias profesionales, certificaciones o títulos académicos'
              )}

              {renderRequirementItem(
                'home',
                'Comprobante de domicilio',
                'Factura de servicios públicos o estado de cuenta bancario'
              )}

              <View style={styles.importantNote}>
                <View style={styles.noteIcon}>
                  <Ionicons name="warning" size={20} color={colors.warning} />
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle}>Importante</Text>
                  <Text style={styles.noteText}>
                    • El documento debe ser legible y en buena calidad{'\n'}
                    • Debe estar vigente y sin expirar{'\n'}
                    • Proporcione una URL pública del documento{'\n'}
                    • Use servicios como Google Drive, Dropbox, etc.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  helpButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  verificationIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.primaryLight,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  benefitsCard: {
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
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  formCard: {
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
  formSection: {
    marginBottom: 16,
  },
  helpButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  processCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processSteps: {
    gap: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.successLight,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  modalButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleBar: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  modalScrollContent: {
    flex: 1,
    padding: 20,
  },
  requirementsContent: {
    paddingBottom: 40,
  },
  requirementsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  requirementsDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  requirementIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  noteIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
