import { MantineThemeOverride } from "@mantine/core";

// "Stamp" palette: paper, ink-navy and a vermilion signal.
const signal: [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] = [
  "#FFF0EB",
  "#FFDDD2",
  "#FFBBA8",
  "#FF9879",
  "#FF7A56",
  "#FF5E3A",
  "#C8381A",
  "#A62D14",
  "#82230F",
  "#5C190B",
];

export const DISPLAY_FONT = "'Space Grotesk', 'IBM Plex Sans', sans-serif";
export const BODY_FONT =
  "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const MONO_FONT = "'JetBrains Mono', ui-monospace, Menlo, monospace";

export default <MantineThemeOverride>{
  white: "#FBFAF6",
  black: "#17140F",
  colors: {
    // `victoria` is the historical primary key stored in admin config; it now
    // resolves to vermilion so existing installs pick up the new identity.
    victoria: signal,
    signal,
    orange: signal,
    gray: [
      "#F7F4EE",
      "#EDE9E0",
      "#E2DCD0",
      "#D2CABB",
      "#B8AF9F",
      "#968D7E",
      "#6B6458",
      "#524C43",
      "#39342E",
      "#221F1B",
    ],
     dark: [
      "#F1EBDD",
      "#D0CBD8",
      "#ABA6B8",
      "#4D4A60",
      "#2F2D3D",
      "#252330",
      "#1B1A24",
      "#121119",
      "#0D0C13",
      "#08080C",
    ],
    green: [
      "#E9F5EE",
      "#CBE7D6",
      "#A3D4B6",
      "#74BC91",
      "#4AA36F",
      "#2E8A57",
      "#1F7145",
      "#175A37",
      "#11452A",
      "#0A2F1C",
    ],
  },
  primaryColor: "victoria",
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "sm",
  radius: {
    xs: "0.125rem",
    sm: "0.1875rem",
    md: "0.25rem",
    lg: "0.375rem",
    xl: "0.625rem",
  },
  fontFamily: BODY_FONT,
  fontFamilyMonospace: MONO_FONT,
  headings: {
    fontFamily: DISPLAY_FONT,
    fontWeight: 700,
  },
  shadows: {
    xs: "0 1px 0 rgba(23,20,15,0.08)",
    sm: "0 1px 0 rgba(23,20,15,0.10)",
    md: "0 2px 0 rgba(23,20,15,0.10)",
    lg: "0 4px 0 rgba(23,20,15,0.10)",
    xl: "0 8px 0 rgba(23,20,15,0.10)",
  },
  components: {
    Button: {
      styles: (theme, params: { variant?: string; color?: string }) => {
        const isPrimary =
          !params.color ||
          params.color === theme.primaryColor ||
          params.color === "victoria" ||
          params.color === "orange";
        return {
          root: {
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            letterSpacing: "0.01em",
            ...(params.variant === "filled" || !params.variant
              ? isPrimary
                ? {
                    color: "var(--rv-signal-ink)",
                    border: "1.5px solid var(--rv-signal-ink)",
                    "&:not(:disabled):hover": {
                      backgroundColor:
                        theme.colors.victoria[
                          theme.colorScheme === "dark" ? 4 : 7
                        ],
                    },
                  }
                : {}
              : {}),
          },
        };
      },
    },
    ActionIcon: {
      styles: (theme, params: { variant?: string; color?: string }) => ({
        root:
          params.variant === "filled" &&
          (params.color === "victoria" || params.color === "orange")
            ? {
                color: "var(--rv-signal-ink)",
                border: "1.5px solid var(--rv-signal-ink)",
              }
            : {},
      }),
    },
    Modal: {
      styles: (theme) => ({
        title: {
          fontFamily: DISPLAY_FONT,
          fontSize: theme.fontSizes.lg,
          fontWeight: 700,
        },
        content: {
          border: "1.5px solid var(--rv-line-strong)",
          backgroundColor: "var(--rv-surface)",
        },
      }),
    },
    Badge: {
      styles: () => ({
        root: { fontFamily: MONO_FONT, letterSpacing: "0.06em" },
      }),
    },
    Table: {
      styles: (theme) => ({
        root: {
          "& thead tr th": {
            fontFamily: MONO_FONT,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
            color: "var(--rv-muted)",
            borderBottom: "1.5px solid var(--rv-line-strong)",
          },
        },
      }),
    },
  },
};
