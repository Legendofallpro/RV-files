import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import * as yup from "yup";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import useUser from "../../hooks/user.hook";
import authService from "../../services/auth.service";
import toast from "../../utils/toast.util";
import AuthShell from "./AuthShell";

const SignUpForm = () => {
  const config = useConfig();
  const router = useRouter();
  const t = useTranslate();
  const { refreshUser } = useUser();

  let minLength = 8;
  let requireLowercase = false;
  let requireUppercase = false;
  let requireNumber = false;
  let requireSpecialCharacter = false;

  if (config.get("security.customPasswordPolicy")) {
    minLength = config.get("security.minLength");
    requireLowercase = config.get("security.requireLowercase");
    requireUppercase = config.get("security.requireUppercase");
    requireNumber = config.get("security.requireNumber");
    requireSpecialCharacter = config.get("security.requireSpecialCharacter");
  }

  const validationSchema = yup.object().shape({
    displayName: yup
      .string()
      .matches(/^[\p{L} ,.'-]*$/u, t("common.error.name.invalid-chars")),
    email: yup.string().email(t("common.error.invalid-email")).required(),
    username: yup
      .string()
      .min(3, t("common.error.too-short", { length: 3 }))
      .required(t("common.error.field-required")),
    password: yup
      .string()
      .min(minLength, t("common.error.too-short", { length: minLength }))
      .matches(
        requireLowercase ? /[a-z]/ : /.*/,
        t("common.error.password.lowercase"),
      )
      .matches(
        requireUppercase ? /[A-Z]/ : /.*/,
        t("common.error.password.uppercase"),
      )
      .matches(
        requireNumber ? /[0-9]/ : /.*/,
        t("common.error.password.number"),
      )
      .matches(
        requireSpecialCharacter ? /[^a-zA-Z0-9]/ : /.*/,
        t("common.error.password.special"),
      )
      .required(t("common.error.field-required")),
  });

  const form = useForm({
    initialValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
    },
    validate: yupResolver(validationSchema),
  });

  const signUp = async (
    displayName: string,
    email: string,
    username: string,
    password: string,
  ) => {
    await authService
      .signUp(displayName, email.trim(), username.trim(), password.trim())
      .then(async (response) => {
        if (response.data.verificationRequired) {
          router.replace({
            pathname: "/auth/verify/info",
            query: { email: email.trim() },
          });
        } else {
          const user = await refreshUser();
          if (user?.isAdmin) {
            router.replace("/admin/intro");
          } else {
            router.replace("/upload");
          }
        }
      })
      .catch(toast.axiosError);
  };

  return (
    <AuthShell
      form="Form RV-02 · Registration"
      title={<FormattedMessage id="signup.title" />}
      subtitle={
        config.get("security.allowRegistration") ? (
          <>
            <FormattedMessage id="signup.description" />{" "}
            <Link href={"signIn"}>
              <FormattedMessage id="signup.button.signin" />
            </Link>
          </>
        ) : undefined
      }
    >
        <form
          onSubmit={form.onSubmit((values) =>
            signUp(
              values.displayName,
              values.email,
              values.username,
              values.password,
            ),
          )}
        >
          <TextInput
            label={t("signup.input.displayName")}
            placeholder={t("signup.input.displayName.placeholder")}
            {...form.getInputProps("displayName")}
          />
          <TextInput
            label={t("signup.input.username")}
            placeholder={t("signup.input.username.placeholder")}
            mt="md"
            {...form.getInputProps("username")}
          />
          <TextInput
            label={t("signup.input.email")}
            placeholder={t("signup.input.email.placeholder")}
            mt="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label={t("signin.input.password")}
            placeholder={t("signin.input.password.placeholder")}
            mt="md"
            {...form.getInputProps("password")}
          />
          <Button fullWidth mt="xl" type="submit">
            <FormattedMessage id="signup.button.submit" />
          </Button>
        </form>
    </AuthShell>
  );
};

export default SignUpForm;
