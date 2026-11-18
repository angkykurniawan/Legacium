export const DEFAULT_RESEARCH_FIELDS = [
  {
    id: 'fisika',
    label: 'Fisika',
    shortLabel: 'Fisika',
    iconName: 'atom',
    bgColor: '#0E6BA8',
    iconColor: '#FFFFFF',
    badgeBg: '#DBEAFE',
    description: 'Energi, plasma, relativitas & elektromagnetik'
  },
  {
    id: 'kimia',
    label: 'Kimia',
    shortLabel: 'Kimia',
    iconName: 'flask',
    bgColor: '#3CC9B8',
    iconColor: '#0F242D',
    badgeBg: '#CCFBF1',
    description: 'Sintesis material, katalis & radiokimia'
  },
  {
    id: 'biologi',
    label: 'Biologi',
    shortLabel: 'Biologi',
    iconName: 'dna',
    bgColor: '#9AD1F5',
    iconColor: '#0F242D',
    badgeBg: '#E0F2FE',
    description: 'Genetika molekuler, vaksin & ekosistem'
  },
  {
    id: 'arsitektur',
    label: 'Arsitektur',
    shortLabel: 'Arsitektur',
    iconName: 'landmark',
    bgColor: '#E55827',
    iconColor: '#0F242D',
    badgeBg: '#FFEDD5',
    description: 'Tata kota riset, estetika & struktur kubah'
  },
  {
    id: 'matematika',
    label: 'Matematika',
    shortLabel: 'Matematika',
    iconName: 'cpu',
    bgColor: '#F7C948',
    iconColor: '#0F242D',
    badgeBg: '#FEF3C7',
    description: 'Aljabar, algoritma & pemodelan komputasi'
  },
  {
    id: 'dirgantara',
    label: 'Dirgantara',
    shortLabel: 'Dirgantara',
    iconName: 'rocket',
    bgColor: '#66D7C5',
    iconColor: '#0F242D',
    badgeBg: '#D1FAE5',
    description: 'Aerodinamika, propulsi & satelit arsip'
  }
];

export const FIELD_ICON_OPTIONS = [
  { id: 'atom', label: 'Atom / Fisika' },
  { id: 'flask', label: 'Lab / Kimia' },
  { id: 'dna', label: 'DNA / Biologi' },
  { id: 'landmark', label: 'Arsitektur / Sejarah' },
  { id: 'cpu', label: 'Komputasi / AI' },
  { id: 'rocket', label: 'Dirgantara / Antariksa' },
  { id: 'stethoscope', label: 'Kedokteran / Medis' },
  { id: 'book', label: 'Filsafat / Sastra' },
  { id: 'scale', label: 'Hukum / Ekonomi' },
  { id: 'globe', label: 'Geografi / Sosial' },
  { id: 'palette', label: 'Seni / Desain' },
  { id: 'sprout', label: 'Pertanian / Ekologi' }
];

export const FIELD_COLOR_PRESETS = [
  { name: 'Biru Laut', bgColor: '#0E6BA8', iconColor: '#FFFFFF', badgeBg: '#DBEAFE' },
  { name: 'Teal Segar', bgColor: '#3CC9B8', iconColor: '#0F242D', badgeBg: '#CCFBF1' },
  { name: 'Biru Langit', bgColor: '#9AD1F5', iconColor: '#0F242D', badgeBg: '#E0F2FE' },
  { name: 'Oranye Koral', bgColor: '#E55827', iconColor: '#0F242D', badgeBg: '#FFEDD5' },
  { name: 'Kuning Emas', bgColor: '#F7C948', iconColor: '#0F242D', badgeBg: '#FEF3C7' },
  { name: 'Mint Cerah', bgColor: '#66D7C5', iconColor: '#0F242D', badgeBg: '#D1FAE5' },
  { name: 'Ungu Royal', bgColor: '#8B5CF6', iconColor: '#FFFFFF', badgeBg: '#EDE9FE' },
  { name: 'Pink Koral', bgColor: '#F472B6', iconColor: '#0F242D', badgeBg: '#FCE7F3' }
];

export function normalizeField(raw) {
  if (!raw) return null;
  const label = raw.label || raw.id || 'Umum';
  return {
    id: raw.id,
    label,
    shortLabel: raw.shortLabel || label.split(' ')[0],
    iconName: raw.iconName || raw.icon_name || 'book',
    bgColor: raw.bgColor || raw.bg_color || '#8B5CF6',
    iconColor: raw.iconColor || raw.icon_color || '#FFFFFF',
    badgeBg: raw.badgeBg || raw.badge_bg || '#EDE9FE',
    description: raw.description || `Riset & inovasi bidang ${label}`
  };
}

let activeFieldsCache = [...DEFAULT_RESEARCH_FIELDS];

export function setActiveFields(list) {
  if (Array.isArray(list) && list.length > 0) {
    activeFieldsCache = list.map(normalizeField).filter(Boolean);
  }
}

export function getActiveFields() {
  return activeFieldsCache;
}

// Backward-compatible export
export const RESEARCH_FIELDS = DEFAULT_RESEARCH_FIELDS;

export function getFieldMeta(fieldId, customList = null) {
  const source = Array.isArray(customList) && customList.length > 0 ? customList : activeFieldsCache;
  const found = source.find((f) => f.id === fieldId);
  if (found) return normalizeField(found);
  const pretty = (fieldId || 'Umum')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: fieldId || 'umum',
    label: pretty,
    shortLabel: pretty.split(' ')[0],
    iconName: 'book',
    bgColor: '#8B5CF6',
    iconColor: '#FFFFFF',
    badgeBg: '#EDE9FE',
    description: `Riset lintas disiplin ${pretty}`
  };
}
