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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Currency } from '../types';
import { Button, Input, Card } from '../components/lovable';
import { createGroup, addParticipant } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AVAILABLE_CURRENCIES } from '../context/CurrencyContext';

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
  const [currency, setCurrency] = useState<Currency>('EUR');

  // Añadir al creador como participante inicial
  useEffect(() => {
    if (!isEditMode && user) {
      const creatorName = user.displayName || user.email?.split('@')[0] || 'Usuario';
      setMembers([{ id: user.uid, name: creatorName, email: user.email || undefined }]);
    }
  }, [user?.uid]);

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
      Alert.alert(t('common.error'), t('createGroup.participantNameRequired'));
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
            Alert.alert(t('common.error'), t('createGroup.userAlreadyInList'));
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
        Alert.alert(t('common.error'), t('createGroup.participantAlreadyExists'));
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
      Alert.alert(t('common.success'), isEditMode ? t('createGroup.participantAdded') : t('createGroup.participantAddedPending'));
    } catch (error: any) {
      console.error('Error añadiendo participante:', error);
      Alert.alert(t('common.error'), error.message || t('createGroup.addParticipantError'));
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const { getGroup } = await import('../services/firebase');
    const group = await getGroup(groupId!);
    
    // No permitir eliminar al creador
    if (group.createdBy === memberId) {
      Alert.alert(t('common.error'), t('createGroup.cannotRemoveCreator'));
      return;
    }
    
    Alert.alert(
      t('createGroup.removeMember'),
      t('createGroup.removeMemberConfirm', { name: memberName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (isEditMode) {
                const { removeGroupMember } = await import('../services/firebase');
                await removeGroupMember(groupId!, memberId);
              }
              
              setMembers(members.filter(m => m.id !== memberId));
              Alert.alert(t('common.success'), t('createGroup.memberRemoved'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('createGroup.removeMemberError'));
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
          groupType,
          budgetNumber,
          currency
        );

        // Add participants to the event that was auto-created
        try {
          const { getGroup } = await import('../services/firebase');
          const group = await getGroup(newGroupId);
          const targetEventId = group.defaultEventId || (group.eventIds && group.eventIds[0]);
          
          if (targetEventId) {
            const budgetPerPerson = budgetNumber && members.length > 0 
              ? budgetNumber / (members.length + 1) 
              : 0;
            
            // Add creator as participant
            await addParticipant(
              targetEventId,
              user!.displayName || user!.email?.split('@')[0] || t('eventDetail.user'),
              budgetPerPerson,
              user!.email || undefined,
              user!.uid
            );
            
            // Add each member as participant
            for (const member of members) {
              if (member.id !== user!.uid) {
                await addParticipant(
                  targetEventId,
                  member.name,
                  budgetPerPerson,
                  member.email || undefined,
                  member.id.startsWith('temp_') ? undefined : member.id
                );
              }
            }
          }
        } catch (participantError) {
          console.error('Error adding participants:', participantError);
        }

        // Actualizar widget iOS
        try {
          const { updateWidgetData } = await import('../services/widgetDataService');
          if (user?.uid) {
            await updateWidgetData(user.uid);
          }
        } catch (widgetError) {
          // No es crítico
        }

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
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          {/* 💰 PRESUPUESTO GRUPAL - LO MÁS IMPORTANTE */}
          {!isEditMode && (
            <Card style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetIcon}>💰</Text>
                <View style={styles.budgetHeaderText}>
                  <Text style={styles.budgetTitle}>{t('createGroup.budgetQuestion')}</Text>
                  <Text style={styles.budgetSubtitle}>{t('createGroup.budgetSubtitle')}</Text>
                </View>
              </View>
              
              <View style={styles.budgetInputContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencySelector} contentContainerStyle={styles.currencySelectorContent}>
                  {AVAILABLE_CURRENCIES.map((opt) => (
                    <TouchableOpacity
                      key={opt.code}
                      style={[
                        styles.currencyButton,
                        currency === opt.code && styles.currencyButtonSelected,
                      ]}
                      onPress={() => setCurrency(opt.code)}
                    >
                      <Text style={[
                        styles.currencyText,
                        currency === opt.code && styles.currencyTextSelected,
                      ]}>
                        {opt.symbol}
                      </Text>
                      <Text style={[
                        styles.currencyCode,
                        currency === opt.code && styles.currencyTextSelected,
                      ]}>
                        {opt.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <Input
                  label={t('createGroup.maxBudget')}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder={t('createGroup.budgetPlaceholder')}
                  keyboardType="numeric"
                  style={styles.budgetInput}
                />
              </View>
              
              <Text style={styles.budgetHelp}>
                💡 {t('createGroup.budgetHelp')}
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
              placeholder={t('createGroup.descriptionPlaceholder')}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </Card>

          {/* Tipo de evento */}
          {!isEditMode && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>{t('createGroup.eventType')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('createGroup.chooseOrganization')}
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
                    {t('createGroup.projectTrip')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('createGroup.projectDescription')}
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
                    {t('createGroup.recurringExpenses')}
                  </Text>
                  <Text style={styles.typeDescription}>
                    {t('createGroup.recurringDescription')}
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
            <Text style={styles.sectionTitle}>{t('createGroup.participants')} ({members.length})</Text>
            <Text style={styles.sectionSubtitle}>
              {isEditMode ? t('createGroup.manageMembers') : t('createGroup.addParticipantsOptional')}
            </Text>
            
            {/* Añadir nuevo miembro */}
            <View style={styles.addMemberSection}>
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <Input
                    label={t('createGroup.participantName')}
                    value={newMemberName}
                    onChangeText={setNewMemberName}
                    placeholder={t('createGroup.participantNamePlaceholder')}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputColumn}>
                  <Input
                    label={t('createGroup.emailOptional')}
                    value={newMemberEmail}
                    onChangeText={setNewMemberEmail}
                    placeholder={t('createGroup.emailPlaceholder')}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleAddMember}
              >
                <Text style={styles.addMemberButtonText}>{t('createGroup.addButton')}</Text>
              </TouchableOpacity>
            </View>
              
            {/* Lista de miembros */}
            {members.length > 0 && (
              <View style={styles.membersList}>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.name}{member.id === user?.uid ? ` (${t('common.you') || 'Tú'})` : ''}
                      </Text>
                      {member.email && (
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      )}
                    </View>
                    {member.id !== user?.uid && (
                      <TouchableOpacity
                        style={styles.removeMemberButton}
                        onPress={() => handleRemoveMember(member.id, member.name)}
                      >
                        <Text style={styles.removeMemberButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
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
                <Text style={styles.previewName}>{groupName || t('createGroup.eventNameFallback')}</Text>
                <Text style={styles.previewDescription}>
                  {description || t('createGroup.noDescription')}
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
    marginBottom: 16,
  },
  currencySelectorContent: {
    gap: 8,
  },
  currencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    minWidth: 60,
  },
  currencyButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  currencyCode: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 2,
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
