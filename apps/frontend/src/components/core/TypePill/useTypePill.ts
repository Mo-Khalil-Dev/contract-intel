import { colors } from '@/config/designTokens';

export type ContractType = 'vendor' | 'license' | 'partnership' | 'customer' | 'lease' | 'nda';

interface TypeStyle {
  color: string;
  background: string;
  border: string;
}

const typeStyles: Record<ContractType, TypeStyle> = {
  vendor: {
    color: colors.blueDark,
    background: colors.blueLight,
    border: colors.blueMid,
  },
  license: {
    color: '#7C3AED', // violet-600
    background: '#EDE9FE', // violet-100
    border: '#C4B5FD', // violet-300
  },
  partnership: {
    color: colors.greenDark,
    background: colors.greenBg,
    border: colors.greenBorder,
  },
  customer: {
    color: '#0E7490', // cyan-700
    background: '#CFFAFE', // cyan-100
    border: '#67E8F9', // cyan-300
  },
  lease: {
    color: colors.orangeDark,
    background: colors.orangeBg,
    border: colors.orangeBorder,
  },
  nda: {
    color: colors.inkMid,
    background: colors.bgAlt,
    border: colors.borderMid,
  },
};

export interface UseTypePillProps {
  type: ContractType;
}

export interface UseTypePillResult {
  style: { color: string; backgroundColor: string; borderColor: string };
  displayLabel: string;
}

export function useTypePill({ type }: UseTypePillProps): UseTypePillResult {
  const styleSet = typeStyles[type];

  return {
    style: {
      color: styleSet.color,
      backgroundColor: styleSet.background,
      borderColor: styleSet.border,
    },
    displayLabel: type.charAt(0).toUpperCase() + type.slice(1),
  };
}
