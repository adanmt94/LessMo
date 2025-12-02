/**
 * Servicio de Comentarios en Gastos
 * Sistema para agregar comentarios, fotos y discusiones en gastos
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, getDocs, query, where, orderBy, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger, LogCategory } from '../utils/logger';

const STORAGE_KEY_COMMENTS = '@expense_comments';

export interface Comment {
  id: string;
  expenseId: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  text: string;
  photoUrls?: string[]; // URLs de fotos adjuntas
  createdAt: Date;
  updatedAt?: Date;
  edited: boolean;
  replyTo?: string; // ID del comentario al que responde (threaded)
  reactions?: { [emoji: string]: string[] }; // { '👍': ['userId1', 'userId2'] }
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

/**
 * Crear un comentario
 */
export async function createComment(
  expenseId: string,
  eventId: string,
  userId: string,
  userName: string,
  text: string,
  photoUrls?: string[],
  replyTo?: string
): Promise<Comment> {
  try {
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const comment: Comment = {
      id: commentId,
      expenseId,
      eventId,
      userId,
      userName,
      text,
      photoUrls,
      replyTo,
      createdAt: new Date(),
      edited: false,
      reactions: {},
    };
    
    // Guardar en Firestore
    await setDoc(doc(db, 'expense_comments', commentId), {
      ...comment,
      createdAt: Timestamp.fromDate(comment.createdAt),
    });
    
    // Guardar en cache
    await saveCommentToCache(comment);
    
    logger.info(LogCategory.FEATURE, 'Comment created', { commentId, expenseId });
    
    return comment;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error creating comment', error);
    throw error;
  }
}

/**
 * Obtener comentarios de un gasto
 */
export async function getExpenseComments(expenseId: string): Promise<Comment[]> {
  try {
    // Intentar desde cache primero
    const cached = await getCommentsFromCache();
    const expenseComments = cached.filter(c => c.expenseId === expenseId);
    if (expenseComments.length > 0) {
      return expenseComments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    
    // Si no hay cache, obtener de Firestore
    const commentsRef = collection(db, 'expense_comments');
    const q = query(
      commentsRef,
      where('expenseId', '==', expenseId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    
    const comments: Comment[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as Comment;
    });
    
    // Guardar en cache
    await saveCommentsToCache(comments);
    
    return comments;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting expense comments', error);
    return [];
  }
}

/**
 * Obtener comentarios organizados en hilos (threaded)
 */
export async function getCommentThreads(expenseId: string): Promise<CommentThread[]> {
  try {
    const comments = await getExpenseComments(expenseId);
    
    // Separar comentarios principales y respuestas
    const mainComments = comments.filter(c => !c.replyTo);
    const replies = comments.filter(c => c.replyTo);
    
    // Organizar en hilos
    const threads: CommentThread[] = mainComments.map(comment => ({
      comment,
      replies: replies
        .filter(r => r.replyTo === comment.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    }));
    
    return threads;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting comment threads', error);
    return [];
  }
}

/**
 * Editar un comentario
 */
export async function updateComment(
  commentId: string,
  text: string,
  photoUrls?: string[]
): Promise<void> {
  try {
    const commentRef = doc(db, 'expense_comments', commentId);
    
    const updates = {
      text,
      photoUrls,
      updatedAt: Timestamp.now(),
      edited: true,
    };
    
    await updateDoc(commentRef, updates);
    
    // Actualizar cache
    const cached = await getCommentsFromCache();
    const updated = cached.map(c =>
      c.id === commentId
        ? { ...c, text, photoUrls, updatedAt: new Date(), edited: true }
        : c
    );
    await saveCommentsToCache(updated);
    
    logger.info(LogCategory.FEATURE, 'Comment updated', { commentId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error updating comment', error);
    throw error;
  }
}

/**
 * Eliminar un comentario
 */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'expense_comments', commentId));
    
    // Eliminar de cache
    const cached = await getCommentsFromCache();
    const filtered = cached.filter(c => c.id !== commentId);
    await saveCommentsToCache(filtered);
    
    logger.info(LogCategory.FEATURE, 'Comment deleted', { commentId });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error deleting comment', error);
    throw error;
  }
}

/**
 * Agregar reacción a un comentario
 */
export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const cached = await getCommentsFromCache();
    const comment = cached.find(c => c.id === commentId);
    
    if (!comment) {
      throw new Error('Comment not found');
    }
    
    // Inicializar reactions si no existe
    if (!comment.reactions) {
      comment.reactions = {};
    }
    
    // Inicializar array de emoji si no existe
    if (!comment.reactions[emoji]) {
      comment.reactions[emoji] = [];
    }
    
    // Agregar userId si no está ya
    if (!comment.reactions[emoji].includes(userId)) {
      comment.reactions[emoji].push(userId);
    }
    
    // Actualizar en Firestore
    const commentRef = doc(db, 'expense_comments', commentId);
    await updateDoc(commentRef, {
      reactions: comment.reactions,
    });
    
    // Actualizar cache
    const updated = cached.map(c =>
      c.id === commentId ? { ...c, reactions: comment.reactions } : c
    );
    await saveCommentsToCache(updated);
    
    logger.info(LogCategory.FEATURE, 'Reaction added', { commentId, emoji });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error adding reaction', error);
    throw error;
  }
}

/**
 * Eliminar reacción de un comentario
 */
export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const cached = await getCommentsFromCache();
    const comment = cached.find(c => c.id === commentId);
    
    if (!comment || !comment.reactions || !comment.reactions[emoji]) {
      return;
    }
    
    // Eliminar userId del array
    comment.reactions[emoji] = comment.reactions[emoji].filter(id => id !== userId);
    
    // Si el array queda vacío, eliminar la clave
    if (comment.reactions[emoji].length === 0) {
      delete comment.reactions[emoji];
    }
    
    // Actualizar en Firestore
    const commentRef = doc(db, 'expense_comments', commentId);
    await updateDoc(commentRef, {
      reactions: comment.reactions,
    });
    
    // Actualizar cache
    const updated = cached.map(c =>
      c.id === commentId ? { ...c, reactions: comment.reactions } : c
    );
    await saveCommentsToCache(updated);
    
    logger.info(LogCategory.FEATURE, 'Reaction removed', { commentId, emoji });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error removing reaction', error);
    throw error;
  }
}

/**
 * Obtener conteo de comentarios por gasto
 */
export async function getCommentCount(expenseId: string): Promise<number> {
  try {
    const comments = await getExpenseComments(expenseId);
    return comments.length;
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting comment count', error);
    return 0;
  }
}

/**
 * Obtener todos los comentarios de un evento
 */
export async function getEventComments(eventId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, 'expense_comments');
    const q = query(
      commentsRef,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as Comment;
    });
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error getting event comments', error);
    return [];
  }
}

/**
 * Buscar comentarios por texto
 */
export async function searchComments(eventId: string, searchTerm: string): Promise<Comment[]> {
  try {
    const comments = await getEventComments(eventId);
    const term = searchTerm.toLowerCase();
    
    return comments.filter(c =>
      c.text.toLowerCase().includes(term) ||
      c.userName.toLowerCase().includes(term)
    );
  } catch (error) {
    logger.error(LogCategory.FEATURE, 'Error searching comments', error);
    return [];
  }
}

// === Funciones de Cache ===

async function getCommentsFromCache(): Promise<Comment[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_COMMENTS);
    if (!cached) return [];
    
    const parsed = JSON.parse(cached);
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
    }));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error getting comments from cache', error);
    return [];
  }
}

async function saveCommentsToCache(comments: Comment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving comments to cache', error);
  }
}

async function saveCommentToCache(comment: Comment): Promise<void> {
  try {
    const cached = await getCommentsFromCache();
    cached.push(comment);
    await saveCommentsToCache(cached);
  } catch (error) {
    logger.error(LogCategory.CACHE, 'Error saving comment to cache', error);
  }
}
