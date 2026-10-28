import {
  Box,
  Burger,
  Container,
  createStyles,
  Group,
  Header as MantineHeader,
  Paper,
  Stack,
  Text,
  Transition,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { TbChevronLeft } from "react-icons/tb";
import useConfig from "../../hooks/config.hook";
import useUser from "../../hooks/user.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import authService from "../../services/auth.service";
import Logo from "../Logo";
import useHomeHref from "../../hooks/homeHref.hook";
import ActionAvatar from "./ActionAvatar";
import NavbarShareMenu from "./NavbarShareMenu";

const HEADER_HEIGHT = 64;

type NavLink = {
  link?: string;
  label?: string;
  component?: ReactNode;
  action?: () => Promise<void>;
};

type MobileMenuView = "root" | "shares" | "profile";

const useStyles = createStyles((theme) => ({
  root: {
    zIndex: 1,
    background: "var(--rv-bg)",
    borderBottom: "1.5px solid var(--rv-line-strong)",
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -5,
      height: 3,
      background:
        "repeating-linear-gradient(-45deg, var(--rv-signal) 0 6px, transparent 6px 12px)",
      opacity: 0.85,
    },
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    textDecoration: "none",
    color: "var(--rv-ink)",
  },

  status: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 9px",
    border: "1px solid var(--rv-line)",
    background: "var(--rv-surface)",
    fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "var(--rv-muted)",
    whiteSpace: "nowrap",
    [theme.fn.smallerThan("md")]: {
      display: "none",
    },
  },

  led: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--rv-ok)",
    boxShadow: "0 0 0 3px color-mix(in srgb, var(--rv-ok) 25%, transparent)",
    animation: "rvLedPulse 2.4s ease-in-out infinite",
    "@keyframes rvLedPulse": {
      "50%": {
        boxShadow:
          "0 0 0 5px color-mix(in srgb, var(--rv-ok) 0%, transparent)",
      },
    },
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
    },
  },

  serial: {
    color: "var(--rv-ink)",
  },

  mobilePanel: {
    marginBottom: theme.spacing.md,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    overflow: "hidden",
    width: "100%",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },

  links: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  burger: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  link: {
    display: "block",
    lineHeight: 1,
    padding: "9px 12px",
    borderRadius: 0,
    textDecoration: "none",
    color: "var(--rv-ink)",
    fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: "1px solid transparent",

    "&:hover": {
      borderColor: "var(--rv-line-strong)",
      backgroundColor: "var(--rv-surface)",
    },

    [theme.fn.smallerThan("sm")]: {
      borderRadius: 0,
      padding: theme.spacing.md,
    },
  },

  mobileMenuButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  mobileMenuButtonContent: {
    display: "flex",
    alignItems: "center",
  },

  mobileMenuLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: "var(--rv-ink)",
      borderColor: "var(--rv-ink)",
      color: "var(--rv-bg)",
      boxShadow: "inset 0 -3px 0 var(--rv-signal)",
    },
  },
}));

const Header = () => {
  const { user } = useUser();
  const router = useRouter();
  const config = useConfig();
  const homeHref = useHomeHref();
  const t = useTranslate();

  const isShareOrUploadPage = [
    "/upload/[reverseShareToken]",
    "/share/[shareId]",
  ].includes(router.pathname);
  const showAuthButtons = config.get("general.showAuthButtons");
  const shouldHideAuthButtons = !showAuthButtons && isShareOrUploadPage;

  const [opened, { toggle, close }] = useDisclosure(false);
  const [currentRoute, setCurrentRoute] = useState("");
  const [mobileMenuView, setMobileMenuView] = useState<MobileMenuView>("root");

  useEffect(() => {
    setCurrentRoute(router.pathname);
    close();
    setMobileMenuView("root");
  }, [close, router.pathname]);

  const authenticatedLinks: NavLink[] = [
    ...(user?.allowShare !== false
      ? [
          {
            link: "/upload",
            label: t("navbar.upload"),
          },
        ]
      : []),
    {
      component: <NavbarShareMenu />,
    },
    {
      component: <ActionAvatar />,
    },
  ];

  let unauthenticatedLinks: NavLink[] = [];

  if (!shouldHideAuthButtons) {
    unauthenticatedLinks.push({
      link: "/auth/signIn",
      label: t("navbar.signin"),
    });
  }

  if (config.get("security.allowUnauthenticatedShares")) {
    unauthenticatedLinks.unshift({
      link: "/upload",
      label: t("navbar.upload"),
    });
  }

  if (config.get("general.showHomePage"))
    unauthenticatedLinks.unshift({
      link: "/",
      label: t("navbar.home"),
    });

  if (config.get("security.allowRegistration") && !shouldHideAuthButtons) {
    unauthenticatedLinks.push({
      link: "/auth/signUp",
      label: t("navbar.signup"),
    });
  }

  const mobileRootLinks: NavLink[] = user
    ? [
        ...(user.allowShare !== false
          ? [
              {
                link: "/upload",
                label: t("navbar.upload"),
              },
            ]
          : []),
        {
          label: t("common.button.shares"),
        },
        {
          label: t("common.button.profile"),
        },
      ]
    : unauthenticatedLinks;

  const mobileShareLinks: NavLink[] = [
    {
      link: "/account/shares",
      label: t("navbar.links.shares"),
    },
    {
      link: "/account/reverseShares",
      label: t("navbar.links.reverse"),
    },
    ...(config.get("share.enableUserRecipients")
      ? [
          {
            link: "/account/received",
            label: t("navbar.links.received"),
          },
        ]
      : []),
  ];

  const mobileProfileLinks: NavLink[] = [
    {
      link: "/account",
      label: t("navbar.avatar.account"),
    },
    ...(user?.isAdmin
      ? [
          {
            link: "/admin",
            label: t("navbar.avatar.admin"),
          },
        ]
      : []),
    {
      label: t("navbar.avatar.signout"),
      action: async () => {
        await authService.signOut();
        close();
        setMobileMenuView("root");
      },
    },
  ];

  const { classes, cx } = useStyles();
  const desktopItems = (
    <>
      {(user ? authenticatedLinks : unauthenticatedLinks).map((link, i) => {
        if (link.component) {
          return (
            <Box pl={5} py={15} key={i}>
              {link.component}
            </Box>
          );
        }
        return (
          <Link
            key={link.label}
            href={link.link ?? ""}
            onClick={close}
            className={cx(classes.link, {
              [classes.linkActive]: currentRoute == link.link,
            })}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );

  const currentMobileLinks =
    mobileMenuView === "shares"
      ? mobileShareLinks
      : mobileMenuView === "profile"
        ? mobileProfileLinks
        : mobileRootLinks;

  const renderMobileEntry = (link: NavLink) => {
    const isSharesEntry =
      mobileMenuView === "root" && link.label === t("common.button.shares");
    const isProfileEntry =
      mobileMenuView === "root" && link.label === t("common.button.profile");

    if (isSharesEntry || isProfileEntry) {
      return (
        <UnstyledButton
          key={link.label}
          className={classes.mobileMenuButton}
          onClick={() =>
            setMobileMenuView(isSharesEntry ? "shares" : "profile")
          }
        >
          <span className={classes.mobileMenuButtonContent}>
            <Text className={classes.mobileMenuLabel}>{link.label}</Text>
          </span>
        </UnstyledButton>
      );
    }

    if (link.action) {
      return (
        <UnstyledButton
          key={link.label}
          className={classes.mobileMenuButton}
          onClick={() => void link.action?.()}
        >
          <span className={classes.mobileMenuButtonContent}>
            <Text className={classes.mobileMenuLabel}>{link.label}</Text>
          </span>
        </UnstyledButton>
      );
    }

    return (
      <Link
        key={link.label}
        href={link.link ?? ""}
        onClick={() => {
          close();
          setMobileMenuView("root");
        }}
        className={cx(classes.link, {
          [classes.linkActive]: currentRoute == link.link,
        })}
      >
        {link.label}
      </Link>
    );
  };
  return (
    <>
      <MantineHeader height={HEADER_HEIGHT} mb={0} className={classes.root}>
        <Container size={1240} className={classes.header}>
          <Group spacing={14} noWrap>
            <Link href={homeHref} className={classes.brand}>
              <Logo height={35} width={35} />
              <Text weight={700} className="rv-display" size="lg">
                {config.get("general.appName")}
              </Text>
              <span className="rv-label rv-hide-sm" style={{ marginLeft: -4 }}>
                / Checkpoint 01
              </span>
            </Link>
            <span className={classes.status} aria-label="Checkpoint online">
              <span className={classes.led} aria-hidden="true" />
              CHECKPOINT ONLINE
              <span aria-hidden="true">·</span>
              <span className={classes.serial}>SN RV-01-7F3A</span>
            </span>
          </Group>
          <Group spacing={5} className={classes.links}>
            <Group>{desktopItems}</Group>
          </Group>
          <Burger
            opened={opened}
            onClick={toggle}
            className={classes.burger}
            size="sm"
          />
        </Container>
      </MantineHeader>
      <Transition transition="scale-y" duration={20} mounted={opened}>
        {(styles) => (
          <Paper className={classes.mobilePanel} withBorder style={styles}>
            <Stack spacing={0}>
              {mobileMenuView !== "root" && (
                <UnstyledButton
                  className={classes.mobileMenuButton}
                  onClick={() => setMobileMenuView("root")}
                >
                  <span className={classes.mobileMenuButtonContent}>
                    <TbChevronLeft size={18} />
                  </span>
                </UnstyledButton>
              )}
              {currentMobileLinks.map((link) => renderMobileEntry(link))}
            </Stack>
          </Paper>
        )}
      </Transition>
      {!opened && <Box mb={40} />}
    </>
  );
};

export default Header;
