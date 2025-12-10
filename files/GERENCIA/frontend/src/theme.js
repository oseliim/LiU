import { createTheme } from '@mui/material/styles'

// Paleta de cores baseada no sistema antigo (interface_gerencia)
const colors = {
  // Verdes (paleta principal)
  greenDark: '#004D00',      // --color1
  greenDarker: '#024302',    // --color2
  greenMedium: '#008000',    // --color4
  greenLight: '#009200',     // --color14
  greenLighter: '#53a453',   // --color15
  greenAccent: '#006600',    // --color13
  
  // Cinzas
  grayDark: '#212529',       // --color6
  grayMedium: '#495057',     // --color7
  grayLight: '#adb5bd',      // --color8
  grayLighter: '#6c757d',    // --color10
  
  // Backgrounds
  bgLight: '#f3f3f3',        // --color5
  bgLighter: '#f8f9fa',      // --color11
  bgLightest: '#e9ecef',     // --color12
  
  // Status
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  
  // Neutros
  white: '#ffffff',
  black: '#000000'
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.greenMedium,
      dark: colors.greenDark,
      light: colors.greenLight,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.greenAccent,
      dark: colors.greenDarker,
      light: colors.greenLighter,
      contrastText: colors.white,
    },
    background: {
      default: '#f5f7fa',
      paper: colors.white,
    },
    text: {
      primary: colors.grayDark,
      secondary: colors.grayMedium,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    divider: colors.bgLightest,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 77, 0, 0.08)',
    '0px 4px 8px rgba(0, 77, 0, 0.12)',
    '0px 8px 16px rgba(0, 77, 0, 0.16)',
    '0px 12px 24px rgba(0, 77, 0, 0.20)',
    '0px 16px 32px rgba(0, 77, 0, 0.24)',
    '0px 20px 40px rgba(0, 77, 0, 0.28)',
    '0px 24px 48px rgba(0, 77, 0, 0.32)',
    '0px 28px 56px rgba(0, 77, 0, 0.36)',
    '0px 32px 64px rgba(0, 77, 0, 0.40)',
    '0px 36px 72px rgba(0, 77, 0, 0.44)',
    '0px 40px 80px rgba(0, 77, 0, 0.48)',
    '0px 44px 88px rgba(0, 77, 0, 0.52)',
    '0px 48px 96px rgba(0, 77, 0, 0.56)',
    '0px 52px 104px rgba(0, 77, 0, 0.60)',
    '0px 56px 112px rgba(0, 77, 0, 0.64)',
    '0px 60px 120px rgba(0, 77, 0, 0.68)',
    '0px 64px 128px rgba(0, 77, 0, 0.72)',
    '0px 68px 136px rgba(0, 77, 0, 0.76)',
    '0px 72px 144px rgba(0, 77, 0, 0.80)',
    '0px 76px 152px rgba(0, 77, 0, 0.84)',
    '0px 80px 160px rgba(0, 77, 0, 0.88)',
    '0px 84px 168px rgba(0, 77, 0, 0.92)',
    '0px 88px 176px rgba(0, 77, 0, 0.96)',
    '0px 92px 184px rgba(0, 77, 0, 1.00)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 77, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0, 77, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0px 2px 8px rgba(0, 77, 0, 0.2)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 77, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.greenLight,
      dark: colors.greenMedium,
      light: colors.greenLighter,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.greenAccent,
      dark: colors.greenDark,
      light: colors.greenLighter,
      contrastText: colors.white,
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#f5f5f5',
      secondary: colors.grayLight,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    divider: '#424242',
  },
  typography: {
    ...lightTheme.typography,
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0, 146, 0, 0.2)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
  },
})

