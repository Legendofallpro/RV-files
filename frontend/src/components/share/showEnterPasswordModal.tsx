import { Button, Group, PasswordInput, Stack, Text } from "@mantine/core";
import { TbAlertTriangle, TbLock } from "react-icons/tb";
import d from "./recipient.module.css";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import useTranslate, {
  translateOutsideContext,
} from "../../hooks/useTranslate.hook";

const showEnterPasswordModal = (
  modals: ModalsContextProps,
  submitCallback: (password: string) => Promise<void>,
  initialWrong = false,
) => {
  const t = translateOutsideContext();
  return modals.openModal({
    closeOnClickOutside: false,
    withCloseButton: false,
    closeOnEscape: false,
    title: "Security desk",
    radius: 0,
    children: (
      <PasswordModalBody
        submitCallback={submitCallback}
        initialWrong={initialWrong}
      />
    ),
  });
};

export const PasswordModalBody = ({
  submitCallback,
  initialWrong = false,
}: {
  submitCallback: (password: string) => Promise<void>;
  initialWrong?: boolean;
}) => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(
    initialWrong ? "share.modal.error.invalid-password" : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslate();
  return (
    <Stack align="stretch" className={d.desk}>
      <div className={d.deskStrip}>
        <span>Desk 02 · Password check</span>
        <span>Tripwire armed</span>
      </div>
      <Group noWrap align="flex-start">
        <div className={d.deskLock} aria-hidden="true">
          <TbLock size={28} />
        </div>
        <div>
          <Text weight={700} size="lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {t("share.modal.password.title")}
          </Text>
          <Text size="sm" color="dimmed">
            <FormattedMessage id="share.modal.password.description" />
          </Text>
        </div>
      </Group>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setIsSubmitting(true);
          setPasswordError("");
          try {
            await submitCallback(password);
          } catch (failure) {
            const code = (
              failure as { response?: { data?: { error?: string } } }
            )?.response?.data?.error;
            setPasswordError(
              code === "wrong_password"
                ? "share.modal.error.invalid-password"
                : "common.error.unknown",
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <Stack>
          <PasswordInput
            variant="default"
            size="md"
            radius={0}
            data-autofocus
            placeholder={t("share.modal.password")}
            error={passwordError ? t(passwordError) : undefined}
            aria-label={t("share.modal.password")}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            value={password}
          />
          <div className={d.deskHint} role="note">
            <TbAlertTriangle size={16} style={{ flex: "none", marginTop: 1, color: "var(--rv-signal)" }} aria-hidden="true" />
            <span>
              Wrong attempts are counted. After 5 misses the tripwire locks
              this link for everyone.
            </span>
          </div>
          <Button type="submit" loading={isSubmitting} size="md" radius={0}>
            Present password
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

export default showEnterPasswordModal;
