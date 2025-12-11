import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { PaymentProvider } from '../services/payments';

interface PaymentMethodIconProps {
  provider: PaymentProvider;
  size?: number;
}

export const PaymentMethodIcon: React.FC<PaymentMethodIconProps> = ({ provider, size = 40 }) => {
  // Mapeo de logos disponibles - PNG de assets/payment-methods (8 métodos)
  const logoMap: { [key in PaymentProvider]?: any } = {
    paypal: require('../../assets/payment-methods/paypal.png'),
    bizum: require('../../assets/payment-methods/bizum.png'),
    venmo: require('../../assets/payment-methods/venmo.png'),
    apple_pay: require('../../assets/payment-methods/apple-pay.png'),
    card: require('../../assets/payment-methods/card.png'),
    cash: require('../../assets/payment-methods/cash.png'),
    bank_transfer: require('../../assets/payment-methods/bank_transfer.png'),
    other: require('../../assets/payment-methods/other.png'),
  };

  console.log(`🎨 PaymentMethodIcon rendering: ${provider}, has logo: ${!!logoMap[provider]}`);

  // Emojis de fallback para logos no disponibles
  const emojiMap: { [key in PaymentProvider]: string } = {
    paypal: '🅿',
    bizum: '💳',
    venmo: '🔵',
    apple_pay: '🍎',
    google_pay: '🅖',
    zelle: '⚡',
    stripe: '💎',
    bank_transfer: '🏦',
    cash: '💵',
    card: '💳',
  };

  const logoSource = logoMap[provider];

  if (logoSource) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={logoSource}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback a emoji si no hay logo
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>
        {emojiMap[provider] || '💰'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    textAlign: 'center',
  },
});