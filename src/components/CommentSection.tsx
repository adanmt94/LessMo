/**
 * CommentSection - Componente para mostrar y gestionar comentarios
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import {
  Comment,
  CommentThread,
  getCommentThreads,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
} from '../services/commentService';

interface Props {
  expenseId: string;
  eventId: string;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉', '🤔'];

export const CommentSection: React.FC<Props> = ({ expenseId, eventId }) => {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const styles = getStyles(theme);
  
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (cancelled) return;
      await loadComments();
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [expenseId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getCommentThreads(expenseId);
      setThreads(data);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newCommentText.trim() || !user) return;
    
    try {
      setSubmitting(true);
      await createComment(
        expenseId,
        eventId,
        user.uid,
        user.displayName || 'Usuario',
        newCommentText.trim(),
        undefined,
        replyingTo || undefined
      );
      
      setNewCommentText('');
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      setSubmitting(true);
      await updateComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
      await loadComments();
    } catch (error) {
      Alert.alert('Error', 'No se pudo editar el comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Eliminar comentario',
      '¿Estás seguro de que quieres eliminar este comentario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              await loadComments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el comentario');
            }
          },
        },
      ]
    );
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;
    
    try {
      const thread = threads.find(t => 
        t.comment.id === commentId || t.replies.some(r => r.id === commentId)
      );
      const comment = thread?.comment.id === commentId 
        ? thread.comment 
        : thread?.replies.find(r => r.id === commentId);
      
      if (!comment) return;
      
      const hasReacted = comment.reactions?.[emoji]?.includes(user.uid);
      
      if (hasReacted) {
        await removeReaction(commentId, user.uid, emoji);
      } else {
        await addReaction(commentId, user.uid, emoji);
      }
      
      await loadComments();
    } catch (error) {
      
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwner = user?.uid === comment.userId;
    const isEditing = editingId === comment.id;
    
    return (
      <View
        key={comment.id}
        style={[
          styles.commentContainer,
          isReply && styles.replyContainer,
        ]}
      >
        {/* Avatar y nombre */}
        <View style={styles.commentHeader}>
          <View style={styles.avatarContainer}>
            {comment.userPhotoUrl ? (
              <Image source={{ uri: comment.userPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {comment.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.commentHeaderText}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {comment.userName}
              {comment.edited && (
                <Text style={[styles.editedBadge, { color: theme.colors.textSecondary }]}>
                  {' '}(editado)
                </Text>
              )}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
              {formatTimestamp(comment.createdAt)}
            </Text>
          </View>
          
          {isOwner && !isEditing && (
            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(comment.id);
                  setEditText(comment.text);
                }}
                style={styles.actionButton}
              >
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                  Editar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteComment(comment.id)}
                style={styles.actionButton}
              >
                <Text style={[styles.actionText, { color: theme.colors.error }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Texto del comentario */}
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={[styles.editInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(null);
                  setEditText('');
                }}
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleEditComment(comment.id)}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.commentText, { color: theme.colors.text }]}>
            {comment.text}
          </Text>
        )}
        
        {/* Fotos adjuntas */}
        {comment.photoUrls && comment.photoUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {comment.photoUrls.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.attachedPhoto} />
            ))}
          </ScrollView>
        )}
        
        {/* Reacciones */}
        <View style={styles.reactionsContainer}>
          {comment.reactions && Object.entries(comment.reactions).map(([emoji, userIds]) => (
            userIds.length > 0 && (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReaction(comment.id, emoji)}
                style={[
                  styles.reactionBadge,
                  userIds.includes(user?.uid || '') && styles.reactionBadgeActive,
                  { backgroundColor: theme.colors.surface }
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={[styles.reactionCount, { color: theme.colors.text }]}>
                  {userIds.length}
                </Text>
              </TouchableOpacity>
            )
          ))}
          
          <TouchableOpacity
            onPress={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
            style={[styles.addReactionButton, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={styles.addReactionText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Selector de reacciones */}
        {showReactions === comment.id && (
          <View style={[styles.reactionPicker, { backgroundColor: theme.colors.surface }]}>
            {COMMON_REACTIONS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  handleReaction(comment.id, emoji);
                  setShowReactions(null);
                }}
                style={styles.reactionOption}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Botón de responder */}
        {!isReply && !isEditing && (
          <TouchableOpacity
            onPress={() => setReplyingTo(comment.id)}
            style={styles.replyButton}
          >
            <Text style={[styles.replyButtonText, { color: theme.colors.primary }]}>
              Responder
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.commentsScroll}>
        {threads.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No hay comentarios aún. ¡Sé el primero en comentar!
          </Text>
        ) : (
          threads.map(thread => (
            <View key={thread.comment.id} style={styles.threadContainer}>
              {renderComment(thread.comment)}
              {thread.replies.map(reply => renderComment(reply, true))}
            </View>
          ))
        )}
      </ScrollView>
      
      {/* Input para nuevo comentario */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        {replyingTo && (
          <View style={styles.replyingToBar}>
            <Text style={[styles.replyingToText, { color: theme.colors.textSecondary }]}>
              Respondiendo...
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={[styles.cancelReplyText, { color: theme.colors.primary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TextInput
            value={newCommentText}
            onChangeText={setNewCommentText}
            placeholder="Escribe un comentario..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[styles.input, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!newCommentText.trim() || submitting}
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              (!newCommentText.trim() || submitting) && styles.sendButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString();
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  commentsScroll: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 32,
  },
  threadContainer: {
    marginBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  replyContainer: {
    marginLeft: 48,
    marginTop: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  commentHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  editedBadge: {
    fontSize: 12,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  photosContainer: {
    marginVertical: 8,
  },
  attachedPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reactionBadgeActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReactionText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  reactionPicker: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  reactionOption: {
    padding: 8,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  replyButton: {
    marginTop: 4,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 12,
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
  },
  cancelReplyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
