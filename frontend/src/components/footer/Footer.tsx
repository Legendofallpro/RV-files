import { Footer as MFooter } from "@mantine/core";
import Link from "next/link";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import s from "./footer.module.css";

const Footer = () => {
  const t = useTranslate();
  const config = useConfig();
  const hasImprint = !!(
    config.get("legal.imprintUrl") || config.get("legal.imprintText")
  );
  const hasPrivacy = !!(
    config.get("legal.privacyPolicyUrl") ||
    config.get("legal.privacyPolicyText")
  );
  const imprintUrl =
    (!config.get("legal.imprintText") && config.get("legal.imprintUrl")) ||
    "/imprint";
  const privacyUrl =
    (!config.get("legal.privacyPolicyText") &&
      config.get("legal.privacyPolicyUrl")) ||
    "/privacy";
  const legal = config.get("legal.enabled");

  return (
    <MFooter height="auto" zIndex={100} className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>
          <strong className="rv-display">
            {config.get("general.appName")}
          </strong>
          <span className={s.tag}>Checkpoint 01 · Lane open</span>
          <p>Small files, checked before they are opened.</p>
        </div>

        <dl className={s.limits}>
          <div><dt>Share</dt><dd>10 MB</dd></div>
          <div><dt>Account</dt><dd>50 MB</dd></div>
          <div><dt>Expiry</dt><dd>≤ 7 d</dd></div>
          <div><dt>Blocked</dt><dd>21 types</dd></div>
        </dl>

        <nav className={s.links} aria-label="Footer">
          <Link href="/upload">Share a file</Link>
          <Link href="/account/shares">My shares</Link>
          {legal && hasImprint && (
            <a href={imprintUrl}>{t("imprint.title")}</a>
          )}
          {legal && hasPrivacy && (
            <a href={privacyUrl}>{t("privacy.title")}</a>
          )}
        </nav>
      </div>

      <div className={s.fine}>
        <span>
          {t("footer.poweredBy")}{" "}
          <a
            href="https://github.com/smp46/pingvin-share-x"
            target="_blank"
            rel="noreferrer"
          >
            Pingvin Share X
          </a>{" "}
          · BSD-2-Clause
        </span>
        <span>SN RV-01-7F3A · 128-BIT IDS · 0 SCRIPTS EXECUTED</span>
        <span className={s.barcode} aria-hidden="true" />
      </div>
    </MFooter>
  );
};

export default Footer;
