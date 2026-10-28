import { Global } from "@mantine/core";

// Design tokens are emitted as CSS variables so plain CSS (checkpoint.css)
// follows Mantine's light/dark switch.
const GlobalStyle = () => {
  return (
    <Global
      styles={(theme) => {
        const dark = theme.colorScheme == "dark";
        return {
          ":root": dark
            ? {
                "--rv-bg": "#121119",
                "--rv-surface": "#1B1A24",
                "--rv-surface-2": "#252330",
                "--rv-ink": "#F1EBDD",
                "--rv-muted": "#ABA6B8",
                "--rv-line": "#2F2D3D",
                "--rv-line-strong": "#4D4A60",
                "--rv-signal": "#FF5E3A",
                "--rv-signal-ink": "#140A07",
                "--rv-accent-2": "#8CAEFF",
                "--rv-ok": "#8BD8A4",
                "--rv-ok-bg": "rgba(139,216,164,0.12)",
                "--rv-warn": "#F0B454",
                "--rv-danger": "#FF6B7A",
                "--rv-glow": "rgba(255,94,58,0.30)",
                "--rv-revoked": "#ABA6B8",
                "--rv-hazard-a": "#FF5E3A",
                "--rv-hazard-b": "#140A07",
              }
            : {
                "--rv-bg": "#F4F1EA",
                "--rv-surface": "#FBFAF6",
                "--rv-surface-2": "#E9E4D6",
                "--rv-ink": "#17140F",
                "--rv-muted": "#5A5446",
                "--rv-line": "#D6CEBB",
                "--rv-line-strong": "#A39A84",
                "--rv-signal": "#C8381A",
                "--rv-signal-ink": "#FFF9F2",
                "--rv-accent-2": "#2E4FB8",
                "--rv-ok": "#2D7A4C",
                "--rv-ok-bg": "rgba(45,122,76,0.10)",
                "--rv-warn": "#94600A",
                "--rv-danger": "#B3261E",
                "--rv-glow": "rgba(200,56,26,0.28)",
                "--rv-revoked": "#5A5446",
                "--rv-hazard-a": "#C8381A",
                "--rv-hazard-b": "#17140F",
              },
          body: {
            backgroundColor: "var(--rv-bg)",
            color: "var(--rv-ink)",
            WebkitFontSmoothing: "antialiased",
          },
          "::selection": {
            background: "var(--rv-signal)",
            color: "var(--rv-signal-ink)",
          },
          a: {
            color: "inherit",
            textDecoration: "none",
          },
          ".mantine-Header-root, .mantine-Footer-root": {
            backgroundColor: "var(--rv-bg)",
            borderColor: "var(--rv-line-strong)",
          },
          "table.md, table.md th:nth-of-type(odd), table.md td:nth-of-type(odd)":
            {
              background: "var(--rv-surface-2)",
            },
          "table.md td": {
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
          },
        };
      }}
    />
  );
};
export default GlobalStyle;
