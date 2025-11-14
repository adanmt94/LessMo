/**
 * CreateGroupScreen - Pantalla para crear/editar grupos
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

type CreateGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;
type CreateGroupScreenRouteProp = RouteProp<RootStackParamList, 'CreateGroup'>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
  route: CreateGroupScreenRouteProp;
}

const GROUP_ICONS = ['👥', '🎉', '✈️', '🏠', '💼', '🎓', '🏋️', '🍕', '🎮', '🎨', '🎵', '📚'];
const GROUP_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];

export const CreateGroupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { groupId, mode } = route.params || {};
  const isEditMode = mode === 'edit' && groupId;
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('👥');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    // Validaciones
    if (!groupName.trim()) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio');
      return;
    }

    if (groupName.length > 50) {
      Alert.alert('Error', 'El nombre debe tener máximo 50 caracteres');
      return;
    }

    setLoading(true);

    try {
      const groupId = await createGroup(
        groupName,
        user!.uid,
        description,
        selectedColor,
        selectedIcon
      );

      Alert.alert(
        '¡Grupo creado!',
        'El grupo se ha creado correctamente',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Groups' } as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? 'Editar Grupo' : 'Nuevo Grupo'}
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Información básica */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Grupo</Text>
            
            <Input
              label="Nombre del grupo *"
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ej: Viaje a Madrid, Piso compartido..."
              maxLength={50}
            />

            <Input
              label="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el grupo..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </Card>

          {/* Selección de icono */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Icono del Grupo</Text>
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
            <Text style={styles.sectionTitle}>Color del Grupo</Text>
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

          {/* Preview */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Vista Previa</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                <Text style={styles.previewIconText}>{selectedIcon}</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{groupName || 'Nombre del grupo'}</Text>
                <Text style={styles.previewDescription}>
                  {description || 'Sin descripción'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Botón de crear */}
          <Button
            title={isEditMode ? 'Guardar Cambios' : 'Crear Grupo'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#6366F1',
    fontWeight: '300',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
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
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  iconButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
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
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  colorCheckmark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  spacing: {
    height: 32,
  },
});
