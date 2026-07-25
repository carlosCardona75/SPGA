import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3D7A2A",
      dark: "#2A5A1D",
      light: "#DFF2D8",
    },
    secondary: {
      main: "#5E9C4C",
    },
    background: {
      default: "#F8F9FA",
      paper: "#FFFFFF",
    },
    success: {
      main: "#198754",
    },
    error: {
      main: "#DC3545",
    },
    warning: {
      main: "#FFC107",
    },
    info: {
      main: "#0D6EFD",
    },
    text: {
      primary: "#2D2D2D",
      secondary: "#6C757D",
    },
    divider: "rgba(0, 0, 0, 0.08)",
  },

  typography: {
    fontFamily: "Poppins, Arial, sans-serif",

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;
