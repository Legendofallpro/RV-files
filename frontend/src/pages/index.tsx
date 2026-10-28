import { Button } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { TbArrowRight } from "react-icons/tb";
import { useIntl } from "react-intl";
import Meta from "../components/Meta";
import InspectionConsole from "../components/landing/InspectionConsole";
import {
  AuditSection,
  ClosingCta,
  RecipientSection,
  SpecsSection,
  TripwireSection,
} from "../components/landing/Sections";
import useUser from "../hooks/user.hook";
import useConfig from "../hooks/config.hook";
import useHomeHref from "../hooks/homeHref.hook";
import en from "../i18n/translations/en-US";
import styles from "../styles/home.module.css";

export default function Home() {
  const { refreshUser } = useUser();
  const router = useRouter();
  const config = useConfig();
  const homeHref = useHomeHref();
  const intl = useIntl();
  const reduceMotion = !!useReducedMotion();
  const t = (id: keyof typeof en) =>
    intl.formatMessage({ id, defaultMessage: en[id] });
  let signupEnabled = true;
  try {
    signupEnabled = config.get("security.allowRegistration") !== false;
  } catch {
    signupEnabled = true;
  }
  const redirectTarget = homeHref !== "/" ? homeHref : null;
  useEffect(() => {
    if (redirectTarget) router.replace(redirectTarget);
    else refreshUser();
  }, [redirectTarget, router]);
  if (redirectTarget) return null;

  return (
    <>
      <Meta title={t("home.rv.meta")} />
      <div className={styles.page}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowTag}>RV-01</span>
              <span className="rv-label">{t("home.rv.eyebrow")}</span>
            </div>
            <h1
              id="home-title"
              className={styles.title}
              aria-label={t("home.rv.title")}
            >
              <span className={styles.titleFirst}>
                {t("home.rv.title.first")}
              </span>
              <span className={styles.titleSecond}>
                {t("home.rv.title.second")}
                <motion.span
                  className={styles.titleStamp}
                  aria-hidden="true"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, scale: 2.2, rotate: -22 }
                  }
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  transition={{ delay: 0.6, duration: 0.22, ease: "easeIn" }}
                >
                  21 types blocked
                </motion.span>
              </span>
            </h1>
            <p className={styles.description}>{t("home.rv.description")}</p>
            <div className={styles.actions}>
              <Button
                component={Link}
                href="/upload"
                size="lg"
                rightIcon={<TbArrowRight size={20} aria-hidden="true" />}
              >
                {t("home.rv.cta")}
              </Button>
              {signupEnabled && (
                <Link href="/auth/signUp" className={styles.secondary}>
                  {t("home.rv.account")}
                </Link>
              )}
            </div>
            <dl className={styles.heroMeta}>
              <div>
                <dt>Per share</dt>
                <dd>10 MB</dd>
              </div>
              <div>
                <dt>Link lives</dt>
                <dd>≤ 7 days</dd>
              </div>
              <div>
                <dt>Share ID</dt>
                <dd>128-bit</dd>
              </div>
            </dl>
          </div>
          <div className={styles.heroVisual}>
            <InspectionConsole />
          </div>
        </section>

        <RecipientSection />
        <TripwireSection />
        <SpecsSection />
        <AuditSection />
        <ClosingCta signupEnabled={signupEnabled} />
      </div>
    </>
  );
}
