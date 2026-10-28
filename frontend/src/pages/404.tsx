import { FormattedMessage } from "react-intl";
import Meta from "../components/Meta";
import CheckpointClosed from "../components/share/CheckpointClosed";
import useHomeHref from "../hooks/homeHref.hook";

const ErrorNotFound = () => {
  const homeHref = useHomeHref();
  return (
    <>
      <Meta title="Not found" />
      <CheckpointClosed
        code="NOT FOUND"
        title="404 · No such ticket."
        text={<FormattedMessage id="404.description" />}
        actionLabel={<FormattedMessage id="404.button.home" />}
        actionHref={homeHref}
      />
    </>
  );
};
export default ErrorNotFound;
