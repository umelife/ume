// components/marketplace/CategoryIcon.tsx
'use client';
import React from 'react';
import { CATEGORY_ICONS } from '@/lib/constants/categoryIcons';

interface Props {
  category: string;
  size?: number;
  className?: string; // controls color via currentColor (text-* classes)
}

export default function CategoryIcon({ category, size = 24, className = '' }: Props) {
  const IconFactory = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {IconFactory({ size, weight: 'regular' })}
    </span>
  );
}
