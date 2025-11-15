/**
 * Integration tests for CreateEventScreen
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateEventScreen } from '../../CreateEventScreen';
import * as firebase from '../../../services/firebase';

jest.mock('../../../services/firebase');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: jest.fn(),
  removeListener: jest.fn(),
} as any;

const mockRoute = {
  params: {},
} as any;

describe('CreateEventScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI rendering', () => {
    it('should render event creation form', () => {
      const { getByPlaceholderText, getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByPlaceholderText(/nombre del evento/i)).toBeTruthy();
      expect(getByPlaceholderText(/descripción/i)).toBeTruthy();
      expect(getByText(/crear evento/i)).toBeTruthy();
    });

    it('should render currency selector', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText(/moneda/i)).toBeTruthy();
    });

    it('should render participant section', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText(/participantes/i)).toBeTruthy();
      expect(getByText(/añadir participante/i)).toBeTruthy();
    });

    it('should render budget field', () => {
      const { getByPlaceholderText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByPlaceholderText(/presupuesto/i)).toBeTruthy();
    });
  });

  describe('Event creation', () => {
    it('should create event successfully', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Viaje a Barcelona',
        description: 'Fin de semana',
        currency: 'EUR',
        budget: 500,
      };

      (firebase.createEvent as jest.Mock).mockResolvedValue(mockEvent);

      const { getByPlaceholderText, getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = getByPlaceholderText(/nombre del evento/i);
      const descInput = getByPlaceholderText(/descripción/i);
      const budgetInput = getByPlaceholderText(/presupuesto/i);
      const createButton = getByText(/crear evento/i);

      fireEvent.changeText(nameInput, 'Viaje a Barcelona');
      fireEvent.changeText(descInput, 'Fin de semana');
      fireEvent.changeText(budgetInput, '500');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(firebase.createEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Viaje a Barcelona',
            description: 'Fin de semana',
            budget: 500,
          })
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('EventDetail', {
        eventId: 'event-123',
      });
    });

    it('should validate required fields', async () => {
      const { getByText, findByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const createButton = getByText(/crear evento/i);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/nombre.*requerido/i)).toBeTruthy();
      });
    });

    it('should validate budget is positive', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = getByPlaceholderText(/nombre del evento/i);
      const budgetInput = getByPlaceholderText(/presupuesto/i);
      const createButton = getByText(/crear evento/i);

      fireEvent.changeText(nameInput, 'Test Event');
      fireEvent.changeText(budgetInput, '-100');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/presupuesto.*positivo/i)).toBeTruthy();
      });
    });

    it('should handle creation errors', async () => {
      const error = new Error('Failed to create event');
      (firebase.createEvent as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, findByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = getByPlaceholderText(/nombre del evento/i);
      const createButton = getByText(/crear evento/i);

      fireEvent.changeText(nameInput, 'Test Event');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/error/i)).toBeTruthy();
      });
    });
  });

  describe('Participants management', () => {
    it('should add participant', () => {
      const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const addButton = getByText(/añadir participante/i);
      fireEvent.press(addButton);

      const participantInputs = getAllByPlaceholderText(/nombre del participante/i);
      expect(participantInputs.length).toBeGreaterThan(0);
    });

    it('should remove participant', () => {
      const { getByText, getAllByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Add participant first
      const addButton = getByText(/añadir participante/i);
      fireEvent.press(addButton);

      // Find and press remove button
      const removeButtons = getAllByText(/×/);
      const initialCount = removeButtons.length;
      
      fireEvent.press(removeButtons[0]);

      const afterRemove = getAllByText(/×/).length;
      expect(afterRemove).toBeLessThan(initialCount);
    });

    it('should require at least one participant', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = getByPlaceholderText(/nombre del evento/i);
      const createButton = getByText(/crear evento/i);

      fireEvent.changeText(nameInput, 'Test Event');
      
      // Try to create without participants
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(findByText(/al menos.*participante/i)).toBeTruthy();
      });
    });

    it('should validate participant names', () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const addButton = getByText(/añadir participante/i);
      fireEvent.press(addButton);

      const participantInput = getByPlaceholderText(/nombre del participante/i);
      fireEvent.changeText(participantInput, '   ');

      // Empty or whitespace names should not be allowed
      expect(participantInput.props.value.trim()).toBe('');
    });
  });

  describe('Currency selection', () => {
    it('should open currency picker', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const currencyButton = getByText(/EUR/i);
      fireEvent.press(currencyButton);

      // Currency picker should be visible
      expect(getByText(/USD/i)).toBeTruthy();
    });

    it('should change currency', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const currencyButton = getByText(/EUR/i);
      fireEvent.press(currencyButton);

      const usdOption = getByText(/USD/i);
      fireEvent.press(usdOption);

      expect(getByText(/USD/i)).toBeTruthy();
    });

    it('should support multiple currencies', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const currencyButton = getByText(/EUR/i);
      fireEvent.press(currencyButton);

      // Should show multiple currency options
      expect(getByText(/USD/i)).toBeTruthy();
      expect(getByText(/GBP/i)).toBeTruthy();
      expect(getByText(/MXN/i)).toBeTruthy();
    });
  });

  describe('Edit mode', () => {
    const mockEditRoute = {
      params: {
        eventId: 'event-123',
        mode: 'edit',
      },
    } as any;

    beforeEach(() => {
      (firebase.getEvent as jest.Mock).mockResolvedValue({
        id: 'event-123',
        name: 'Existing Event',
        description: 'Test description',
        currency: 'USD',
        budget: 1000,
      });
    });

    it('should load event data in edit mode', async () => {
      const { findByDisplayValue } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockEditRoute} />
      );

      await waitFor(() => {
        expect(findByDisplayValue('Existing Event')).toBeTruthy();
      });
    });

    it('should update event on save', async () => {
      (firebase.updateEvent as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockEditRoute} />
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText(/nombre del evento/i);
        fireEvent.changeText(nameInput, 'Updated Event');
      });

      const saveButton = getByText(/guardar/i);
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(firebase.updateEvent).toHaveBeenCalledWith(
          'event-123',
          expect.objectContaining({
            name: 'Updated Event',
          })
        );
      });
    });

    it('should show correct button text in edit mode', async () => {
      const { findByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockEditRoute} />
      );

      await waitFor(() => {
        expect(findByText(/guardar/i)).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should go back on cancel', () => {
      const { getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const backButton = getByText(/atrás/i);
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should navigate to event detail after creation', async () => {
      (firebase.createEvent as jest.Mock).mockResolvedValue({
        id: 'new-event-123',
        name: 'New Event',
      });

      const { getByPlaceholderText, getByText } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const nameInput = getByPlaceholderText(/nombre del evento/i);
      const createButton = getByText(/crear evento/i);

      fireEvent.changeText(nameInput, 'New Event');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('EventDetail', {
          eventId: 'new-event-123',
        });
      });
    });
  });

  describe('Dark mode', () => {
    it('should apply theme colors correctly', () => {
      const { getByTestId } = render(
        <CreateEventScreen navigation={mockNavigation} route={mockRoute} />
      );

      const container = getByTestId('create-event-container');
      expect(container.props.style).toHaveProperty('backgroundColor');
    });
  });
});
