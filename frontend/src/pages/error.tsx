import React from "react";
import Meta from "../components/Meta";
import useTranslate from "../hooks/useTranslate.hook";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import useHomeHref from "../hooks/homeHref.hook";
import CheckpointClosed from "../components/share/CheckpointClosed";

export default function Error() {
  const t = useTranslate();
  const router = useRouter();
  const homeHref = useHomeHref();

  const params = router.query.params
    ? (router.query.params as string).split(",").map((param) => {
        return t(`error.param.${param}`);
      })
    : [];

  return (
    <>
      <Meta title={t("error.title")} />
      <CheckpointClosed
        code="ERROR"
        title={t("error.description")}
        text={
          <FormattedMessage
            id={`error.msg.${router.query.error || "default"}`}
            values={Object.fromEntries(
              [params].map((value, key) => [key.toString(), value]),
            )}
          />
        }
        actionLabel="Go home"
        actionHref={homeHref}
      />
    </>
  );
}
