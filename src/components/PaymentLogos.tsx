/**
 * Payment Method Logos
 * Logos vectoriales profesionales para métodos de pago
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
}

export const BizumLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="bizumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#00D4FF" />
        <Stop offset="100%" stopColor="#0066FF" />
      </LinearGradient>
    </Defs>
    <Rect width="200" height="200" rx="40" fill="url(#bizumGradient)" />
    <Path
      d="M60 80 L90 110 L60 140 M90 80 L120 110 L90 140 M120 80 L150 110 L120 140"
      stroke="white"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const PayPalLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Rect width="200" height="200" rx="40" fill="#003087" />
    <G transform="translate(40, 40)">
      <Path
        d="M50 20 C80 20 90 40 85 60 C80 80 70 100 40 100 L30 100 L20 140 L0 140 L20 60 L50 60 C60 60 65 55 67 50 C70 40 65 35 50 35 L30 35 L35 20 Z"
        fill="#009CDE"
      />
      <Path
        d="M70 20 C100 20 110 40 105 60 C100 80 90 100 60 100 L50 100 L40 140 L20 140 L40 60 L70 60 C80 60 85 55 87 50 C90 40 85 35 70 35 L50 35 L55 20 Z"
        fill="#012169"
        opacity="0.7"
      />
    </G>
  </Svg>
);

export const ApplePayLogo: React.FC<LogoProps> = ({ width = 50, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 240 200">
    <Rect width="240" height="200" rx="30" fill="#000000" />
    <G transform="translate(20, 50)">
      {/* Apple Logo */}
      <Path
        d="M40 0 C35 0 30 5 30 10 C30 15 35 20 40 20 C42 20 44 19 45 18 C46 25 40 32 35 35 C30 38 25 35 20 30 C15 25 10 15 15 5 C20 -5 30 -5 35 0 C37 -2 39 -1 40 0 Z"
        fill="white"
      />
      {/* Pay text */}
      <Path
        d="M70 20 L70 50 L80 50 C90 50 95 45 95 35 C95 25 90 20 80 20 Z M78 26 L82 26 C87 26 90 29 90 35 C90 41 87 44 82 44 L78 44 Z"
        fill="white"
      />
      <Path
        d="M110 30 C105 30 102 33 102 37 L118 37 C118 33 115 30 110 30 M102 40 C102 44 105 48 110 48 C113 48 116 46 117 44 L122 46 C120 49 116 52 110 52 C102 52 97 47 97 40 C97 33 102 28 110 28 C118 28 123 33 123 40 L123 42 L102 42 Z"
        fill="white"
      />
      <Path
        d="M140 28 L146 48 L150 28 L155 28 L159 48 L165 28 L170 28 L162 52 L156 52 L152 34 L148 52 L142 52 L134 28 Z"
        fill="white"
      />
    </G>
  </Svg>
);

export const GooglePayLogo: React.FC<LogoProps> = ({ width = 50, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 240 200">
    <Rect width="240" height="200" rx="30" fill="white" />
    <Rect width="240" height="200" rx="30" fill="none" stroke="#E8E8E8" strokeWidth="2" />
    <G transform="translate(30, 60)">
      {/* G */}
      <Path
        d="M30 0 C15 0 5 10 5 25 C5 40 15 50 30 50 C40 50 47 45 50 38 L40 33 C38 37 35 42 30 42 C22 42 15 36 15 25 C15 14 22 8 30 8 C37 8 42 12 43 18 L30 18 L30 26 L52 26 C52 11 43 0 30 0 Z"
        fill="#5F6368"
      />
      {/* Pay */}
      <Path
        d="M65 10 L65 50 L73 50 L73 38 L80 38 C88 38 93 33 93 24 C93 15 88 10 80 10 Z M73 17 L79 17 C83 17 85 19 85 24 C85 29 83 31 79 31 L73 31 Z"
        fill="#5F6368"
      />
      <Path
        d="M105 20 C100 20 97 23 97 27 L105 27 C105 23 103 20 100 20 M97 30 C97 34 100 38 105 38 C108 38 111 36 112 34 L117 36 C115 39 111 42 105 42 C97 42 92 37 92 30 C92 23 97 18 105 18 C113 18 118 23 118 30 L118 32 L97 32 Z"
        fill="#5F6368"
      />
      <Path
        d="M130 18 L138 38 L146 18 L154 18 L142 50 L140 55 C138 58 136 60 131 60 L127 60 L127 53 L131 53 C133 53 134 52 135 50 L136 48 L124 18 Z"
        fill="#5F6368"
      />
      {/* Color dots */}
      <Circle cx="168" cy="20" r="4" fill="#4285F4" />
      <Circle cx="168" cy="30" r="4" fill="#EA4335" />
      <Circle cx="168" cy="40" r="4" fill="#FBBC04" />
      <Circle cx="178" cy="25" r="4" fill="#34A853" />
      <Circle cx="178" cy="35" r="4" fill="#4285F4" />
    </G>
  </Svg>
);

export const VenmoLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Rect width="200" height="200" rx="40" fill="#3D95CE" />
    <Path
      d="M120 50 C125 60 127 70 127 85 C127 115 105 150 80 150 L55 150 L35 55 L60 50 L72 120 C78 110 85 95 85 80 C85 70 83 62 80 55 Z"
      fill="white"
    />
  </Svg>
);

export const BankTransferLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366F1" />
        <Stop offset="100%" stopColor="#4F46E5" />
      </LinearGradient>
    </Defs>
    <Rect width="200" height="200" rx="40" fill="url(#bankGradient)" />
    {/* Bank building */}
    <Path
      d="M100 40 L40 80 L160 80 Z"
      fill="white"
    />
    <Rect x="50" y="90" width="20" height="60" fill="white" />
    <Rect x="80" y="90" width="20" height="60" fill="white" />
    <Rect x="110" y="90" width="20" height="60" fill="white" />
    <Rect x="140" y="90" width="20" height="60" fill="white" />
    <Rect x="40" y="155" width="120" height="15" fill="white" />
  </Svg>
);

export const CashLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="cashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10B981" />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
    </Defs>
    <Rect width="200" height="200" rx="40" fill="url(#cashGradient)" />
    {/* Dollar bills stack */}
    <Rect x="30" y="60" width="140" height="80" rx="10" fill="#16A34A" opacity="0.6" />
    <Rect x="35" y="70" width="140" height="80" rx="10" fill="#15803D" opacity="0.8" />
    <Rect x="40" y="80" width="140" height="80" rx="10" fill="white" />
    {/* Dollar sign */}
    <Path
      d="M110 95 C95 95 90 100 90 107 C90 114 95 117 105 119 C115 121 118 123 118 127 C118 131 115 134 110 134 C105 134 102 131 102 127 L92 127 C92 136 98 143 107 145 L107 152 L113 152 L113 145 C125 143 128 136 128 127 C128 118 122 115 112 113 C102 111 100 109 100 106 C100 103 103 100 110 100 C117 100 119 103 119 106 L129 106 C129 98 124 92 113 90 L113 83 L107 83 L107 90 C98 92 90 97 90 107"
      fill="#16A34A"
    />
    <Circle cx="55" cy="120" r="8" fill="#16A34A" opacity="0.3" />
    <Circle cx="165" cy="120" r="8" fill="#16A34A" opacity="0.3" />
  </Svg>
);

export const OtherPaymentLogo: React.FC<LogoProps> = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="otherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8B5CF6" />
        <Stop offset="100%" stopColor="#7C3AED" />
      </LinearGradient>
    </Defs>
    <Rect width="200" height="200" rx="40" fill="url(#otherGradient)" />
    {/* Credit card */}
    <Rect x="40" y="70" width="120" height="80" rx="10" fill="white" />
    <Rect x="40" y="85" width="120" height="15" fill="#8B5CF6" />
    {/* Card chip */}
    <Rect x="55" y="110" width="25" height="20" rx="3" fill="#D4AF37" />
    {/* Card waves */}
    <Path
      d="M110 115 C115 115 115 120 120 120 C125 120 125 115 130 115 C135 115 135 120 140 120"
      stroke="#8B5CF6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M110 125 C115 125 115 130 120 130 C125 130 125 125 130 125 C135 125 135 130 140 130"
      stroke="#8B5CF6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

// Componente selector de logo
export const PaymentMethodLogo: React.FC<{ method: string } & LogoProps> = ({ 
  method, 
  width = 40, 
  height = 40 
}) => {
  switch (method.toLowerCase()) {
    case 'bizum':
      return <BizumLogo width={width} height={height} />;
    case 'paypal':
      return <PayPalLogo width={width} height={height} />;
    case 'apple_pay':
      return <ApplePayLogo width={width} height={height} />;
    case 'google_pay':
      return <GooglePayLogo width={width} height={height} />;
    case 'venmo':
      return <VenmoLogo width={width} height={height} />;
    case 'bank_transfer':
      return <BankTransferLogo width={width} height={height} />;
    case 'cash':
      return <CashLogo width={width} height={height} />;
    case 'other':
      return <OtherPaymentLogo width={width} height={height} />;
    default:
      return <OtherPaymentLogo width={width} height={height} />;
  }
};
