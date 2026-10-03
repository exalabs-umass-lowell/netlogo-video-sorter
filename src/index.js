import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import VideoPairApp from './App_onebyone';
import VideoPairApp_simple from './App_onebyone_simple';

import { HashRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import "@fontsource/barlow/300.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";

// Light/dark palette tokens. Components read these via useTheme() rather
// than hardcoding colors, so the whole app follows the OS color scheme.
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#8fa6ff' : '#2a2a8c',
    },
    background: {
      default: mode === 'dark' ? '#121418' : '#f5f3ef',
      paper: mode === 'dark' ? '#1e2128' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f0f0f0' : '#000000',
      secondary: mode === 'dark' ? '#aeb0b4' : '#9a9690',
    },
  },
  typography: {
    fontFamily: "'Barlow', Arial, sans-serif",
  },
});

function Root() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? 'dark' : 'light')),
    [prefersDarkMode]
  );

  return (
    <React.StrictMode>
      <HashRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <VideoPairApp_simple/>
        </ThemeProvider >
      </HashRouter>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
