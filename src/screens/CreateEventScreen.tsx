/**
 * CreateEventScreen - Pantalla para crear/editar eventos (contenedores)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { createGroup } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type CreateEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup' | 'CreateEvent'>;
type CreateEventScreenRouteProp = RouteProp<RootStackParamList, 'CreateGroup'> | RouteProp<RootStackParamList, 'CreateEvent'>;

interface Props {
  navigation: CreateEventScreenNavigationProp;
  route: CreateEventScreenRouteProp;
}

const GROUP_ICONS = ['👥', '🎉', '✈️', '🏠', '💼', '🎓', '🏋️', '🍕', '🎮', '🎨', '🎵', '📚'];
const GROUP_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];
export const CreateEventScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const { groupId, mode } = route.params || {};
  const isEditMode = mode === 'edit' && groupId;
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👥');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [groupType, setGroupType] = useState<'project' | 'recurring'>('project');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!isEditMode);
  const [members, setMembers] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  // 💰 PRESUPUESTO GRUPAL (característica principal)
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'GBP'>('EUR');

  // Cargar datos del evento si estamos en modo edición
  useEffect(() => {
    if (isEditMode) {
      loadGroupData();
    }
  }, [isEditMode, groupId]);

  const loadGroupData = async () => {
    try {
      setLoadingData(true);
      const { getGroup, getUserInfo } = await import('../services/firebase');
      const group = await getGroup(groupId!);
      
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setSelectedIcon(group.icon || '👥');
      setSelectedColor(group.color || '#6366F1');
      
      // Cargar información de los miembros
      if (group.memberIds && group.memberIds.length > 0) {
        const membersInfo = await Promise.all(
          group.memberIds.map((memberId: string) => getUserInfo(memberId))
        );
        setMembers(membersInfo.filter((m): m is { id: string; name: string; email?: string } => m !== null));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('createGroup.errorLoading'));
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddMember = async () => {
    // NOMBRE es obligatorio
    if (!newMemberName.trim()) {
      Alert.alert(t('common.error'), 'Por favor ingresa un nombre para el participante');
      return;
    }

    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      let userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let userName = newMemberName.trim();
      let userEmail = newMemberEmail.trim().toLowerCase();
      
      // Si hay email, buscar usuario registrado
      if (userEmail) {
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', userEmail)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          // Usuario registrado encontrado
          const userData = usersSnapshot.docs[0];
          userId = userData.id;
          const userInfo = userData.data();
          userName = userInfo.name || userInfo.displayName || userName;
          
          // Verificar si ya está en la lista
          if (members.some(m => m.id === userId)) {
            Alert.alert(t('common.error'), 'Este usuario ya está en la lista');
            return;
          }
          
          // Si estamos en modo edición, añadir directamente a Firebase
          if (isEditMode && groupId) {
            const { addGroupMember } = await import('../services/firebase');
            await addGroupMember(groupId, userId);
          }
        }
      }
      
      // Verificar si ya existe por nombre (para usuarios sin registro)
      if (members.some(m => m.name.toLowerCase() === userName.toLowerCase())) {
        Alert.alert(t('common.error'), 'Ya existe un participante con ese nombre');
        return;
      }
      
      // Añadir a la lista local
      setMembers([
        ...members,
        {
          id: userId,
          name: userName,
          email: userEmail || undefined
        }
      ]);
      
      setNewMemberName('');
      setNewMemberEmail('');
      Alert.alert('✅ Éxito', isEditMode ? 'Participante añadido al evento' : 'Participante añadido (se guardará al crear el evento)');
    } catch (error: any) {
      console.error('Error añadiendo participante:', error);
      Alert.alert(t('common.error'), error.message || 'No se pudo añadir el participante');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const { getGroup } = await import('../services/firebase');
    const group = await getGroup(groupId!);
    
    // No permitir eliminar al creador
    if (group.createdBy === memberId) {
      Alert.alert(t('common.error'), 'No puedes eliminar al creador del evento');
      return;
    }
    
    Alert.alert(
      'Eliminar miembro',
      `¿Estás seguro de eliminar a ${memberName} del evento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isEditMode) {
                const { removeGroupMember } = await import('../services/firebase');
                await removeGroupMember(groupId!, memberId);
              }
              
              setMembers(members.filter(m => m.id !== memberId));
              Alert.alert('Éxito', 'Miembro eliminado correctamente');
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || 'No se pudo eliminar el miembro');
            }
          }
        }
      ]
    );
  };

  const handleCreateGroup = async () => {
    // Validaciones
    if (!groupName.trim()) {
      Alert.alert(t('common.error'), t('createGroup.nameRequired'));
      return;
    }

    if (groupName.length > 50) {
      Alert.alert(t('common.error'), t('createGroup.nameTooLong'));
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Actualizar evento existente
        const { updateGroup } = await import('../services/firebase');
        await updateGroup(
          groupId!,
          groupName,
          description,
          selectedColor,
          selectedIcon
        );

        Alert.alert(
          t('common.success'),
          t('createGroup.groupUpdated'),
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Crear nuevo evento
        const budgetNumber = budget.trim() ? parseFloat(budget) : undefined;
        
        const newGroupId = await createGroup(
          groupName,
          user!.uid,
          description,
          selectedColor,
          selectedIcon,
          groupType, // Pasar el tipo seleccionado
          budgetNumber, // Presupuesto
          currency // Moneda
        );

        Alert.alert(
          t('common.success'),
          t('createGroup.groupCreated'),
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Groups' } as any),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || (isEditMode ? t('createGroup.errorUpdating') : t('createGroup.errorCreating')));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>{t('createGroup.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {/* 💰 PRESUPUESTO GRUPAL - LO MÁS IMPORTANTE */}
          {!isEditMode && (
            <Card style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetIcon}>💰</Text>
                <View style={styles.budgetHeaderText}>
                  <Text style={styles.budgetTitle}>¿Qué presupuesto grupal quieres añadir?</Text>
                  <Text style={styles.budgetSubtitle}>Define el límite máximo para este evento</Text>
                </View>
              </View>
              
              <View style={styles.budgetInputContainer}>
                <View style={styles.currencySelector}>
                  {(['EUR', 'USD', 'GBP'] as const).map((curr) => (
                    <TouchableOpacity
                      key={curr}
                      style={[
                        styles.currencyButton,
                        currency === curr && styles.currencyButtonSelected,
                      ]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text style={[
                        styles.currencyText,
                        currency === curr && styles.currencyTextSelected,
                      ]}>
                        {curr === 'EUR' ? '€' : curr === 'USD' ? '$' : '£'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Input
                  label="Presupuesto máximo"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="Ej: 1000 (Puede quedar en blanco)"
                  keyboardType="numeric"
                  style={styles.budgetInput}
                />
              </View>
              
              <Text style={styles.budgetHelp}>
                💡 Puedes dejarlo en blanco si aún no lo sabes. Podrás editarlo después.
              </Text>
            </Card>
          )}

          {/* Información básica */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('createGroup.groupInfo')}</Text>
            
            <Input
              label={t('createGroup.groupNameLabel')}
              value={groupName}
              onChangeText={setGroupName}
              placeholder={t('createGroup.groupNamePlaceholder')}
              maxLength={50}
            />

            <Input
              label={t('createGroup.descriptionLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el evento..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </Card>

          {/* Tipo de evento */}
          {!isEditMode && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de evento</Text>
              <Text style={styles.sectionSubtitle}>
                Elige cómo organizar los gastos
              </Text>
              
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    groupType === 'project' && styles.typeButtonSelected,
                  ]}
                  onPress={() => setGroupType('project')}
                >
                  <Text style={styles.typeIcon}>📅</Text>
                  <Text style={[
                    styles.typeTitle,
                    groupType === 'project' && styles.typeTitleSelected
                  ]}>
                    Proyecto/Viaje
                  </Text>
                  <Text style={styles.typeDescription}>
                    Añade gastos específicos dentro del evento
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    groupType === 'recurring' && styles.typeButtonSelected,
                  ]}
                  onPress={() => setGroupType('recurring')}
                >
                  <Text style={styles.typeIcon}>🏠</Text>
                  <Text style={[
                    styles.typeTitle,
                    groupType === 'recurring' && styles.typeTitleSelected
                  ]}>
                    Gastos Recurrentes
                  </Text>
                  <Text style={styles.typeDescription}>
                    Añade gastos directamente (piso, pareja...)
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Selección de icono */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('createGroup.groupIcon')}</Text>
            <View style={styles.iconGrid}>
              {GROUP_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconButtonSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Selección de color */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('createGroup.groupColor')}</Text>
            <View style={styles.colorGrid}>
              {GROUP_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorButtonSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Text style={styles.colorCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Gestión de participantes */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Participantes ({members.length})</Text>
            <Text style={styles.sectionSubtitle}>
              {isEditMode ? 'Gestiona los miembros del evento' : 'Añade participantes al evento (opcional)'}
            </Text>
            
            {/* Añadir nuevo miembro */}
            <View style={styles.addMemberSection}>
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <Input
                    label="Nombre del participante *"
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                    placeholder="Ej: María"
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputColumn}>
                  <Input
                    label="Email (opcional)"
                    value={newMemberEmail}
                    onChangeText={setNewMemberEmail}
                    placeholder="email@ejemplo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleAddMember}
              >
                <Text style={styles.addMemberButtonText}>+ Añadir</Text>
              </TouchableOpacity>
            </View>
              
            {/* Lista de miembros */}
            {members.length > 0 && (
              <View style={styles.membersList}>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.email && (
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => handleRemoveMember(member.id, member.name)}
                    >
                      <Text style={styles.removeMemberButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Preview */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('createGroup.preview')}</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                <Text style={styles.previewIconText}>{selectedIcon}</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{groupName || 'Nombre del evento'}</Text>
                <Text style={styles.previewDescription}>
                  {description || 'Sin descripción'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Botón de crear */}
          <Button
            title={isEditMode ? t('createGroup.updateButton') : t('createGroup.createButton')}
            onPress={handleCreateGroup}
            loading={loading}
            disabled={loading || !groupName.trim()}
          />

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  iconButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? theme.colors.surface : '#EEF2FF',
  },
  iconText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: theme.colors.text,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  colorCheckmark: {
    fontSize: 24,
    color: theme.colors.card,
    fontWeight: '700',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewIconText: {
    fontSize: 28,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  spacing: {
    height: 32,
  },
  // Estilos para gestión de participantes
  addMemberSection: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputColumn: {
    flex: 1,
  },
  addMemberButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  removeMemberButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error || '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMemberButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para selector de tipo
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  typeTitleSelected: {
    color: theme.colors.primary,
  },
  typeDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // 💰 Estilos para sección de presupuesto
  budgetSection: {
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  budgetHeaderText: {
    flex: 1,
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  budgetSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  budgetInputContainer: {
    marginBottom: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  currencyButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  currencyText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  currencyTextSelected: {
    color: theme.colors.card,
  },
  budgetInput: {
    fontSize: 18,
  },
  budgetHelp: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
