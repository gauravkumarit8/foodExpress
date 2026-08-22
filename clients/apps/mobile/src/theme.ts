// Mirrors apps/web/tailwind.config.js — same "kitchen ticket" system,
// expressed as plain values for React Native StyleSheets.
export const colors = {
  ink: '#1C1B19',
  paper: '#F5F1E6',
  paperDark: '#EAE3D2',
  line: '#D9CFB8',
  ticket: { 50: '#FBEAE9', 100: '#F5CBC9', 300: '#E67A76', 500: '#D62828', 600: '#B81F1F', 700: '#8F1717' },
  cook: { 100: '#FBE6C4', 500: '#F2A93B', 700: '#B87A1E' },
  route: { 100: '#DCE6F7', 500: '#2E5EAA', 700: '#1F3F73' },
  pass: { 100: '#DCEEDD', 500: '#3A7D44', 700: '#275A2E' },
  white: '#FFFFFF',
};

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const radius = { ticket: 4 };
