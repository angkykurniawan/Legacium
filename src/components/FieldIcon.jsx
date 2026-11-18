import React from 'react';
import {
  Atom,
  FlaskConical,
  Dna,
  Landmark,
  Cpu,
  Rocket,
  Stethoscope,
  BookOpen,
  Scale,
  Globe,
  Palette,
  Sprout
} from 'lucide-react';
import { getFieldMeta } from '../data/fields.js';

export function FieldIcon({ field, iconName = '', size = 28, color = '#0F242D', strokeWidth = 2.2 }) {
  const props = { size, color, strokeWidth };
  const resolved = iconName || getFieldMeta(field)?.iconName || 'atom';

  switch (resolved) {
    case 'atom':
    case 'fisika':
      return <Atom {...props} />;
    case 'flask':
    case 'kimia':
      return <FlaskConical {...props} />;
    case 'dna':
    case 'biologi':
      return <Dna {...props} />;
    case 'landmark':
    case 'arsitektur':
      return <Landmark {...props} />;
    case 'cpu':
    case 'matematika':
      return <Cpu {...props} />;
    case 'rocket':
    case 'dirgantara':
      return <Rocket {...props} />;
    case 'stethoscope':
      return <Stethoscope {...props} />;
    case 'book':
      return <BookOpen {...props} />;
    case 'scale':
      return <Scale {...props} />;
    case 'globe':
      return <Globe {...props} />;
    case 'palette':
      return <Palette {...props} />;
    case 'sprout':
      return <Sprout {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
