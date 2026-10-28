import { ActionIcon } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TbEdit, TbTrash, TbX } from "react-icons/tb";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { FileUpload } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import { HoverTip } from "../core/HoverTip";
import showTextEditorModal from "./modals/showTextEditorModal";
import bay from "./bay.module.css";

const nameOf = (file: File) =>
  ((file as any).webkitRelativePath || file.name)
    .replace(/\\/g, "/")
    .replace(/^\//, "");

const extOf = (name: string) => {
  const base = name.split("/").pop() || "";
  const parts = base.split(".");
  return parts.length > 1 ? parts.pop()!.slice(0, 6) : "bin";
};

// Client-side pre-check rows: each file is measured against the per-share
// limit, typed, and given the blocklist verdict. The server re-checks.
const PrecheckList = ({
  files,
  setFiles,
  rejected,
  onDismissRejected,
  maxShareSize,
}: {
  files: FileUpload[];
  setFiles: (files: FileUpload[]) => void;
  rejected: FileUpload[];
  onDismissRejected: (index: number) => void;
  maxShareSize: number;
}) => {
  const modals = useModals();
  const t = useTranslate();
  const reduceMotion = useReducedMotion();

  const remove = (index: number) => {
    files.splice(index, 1);
    setFiles([...files]);
  };
  const edit = async (index: number) => {
    const text = await (files[index] as unknown as File).text();
    showTextEditorModal(index, files, setFiles as any, text, modals);
  };

  const rowAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: -16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 16 },
        transition: { duration: 0.22 },
      };

  return (
    <div className={bay.checks}>
      <div className={bay.checksHead}>
        <span>Chk</span>
        <span>Item</span>
        <span>Type</span>
        <span>Size vs {byteToHumanSizeString(maxShareSize)}</span>
        <span />
      </div>
      {files.length === 0 && rejected.length === 0 && (
        <div className={bay.emptyChecks}>
          ▸ Conveyor empty. Items appear here with their pre-check verdict.
        </div>
      )}
      <AnimatePresence initial={false}>
        {rejected.map((file, i) => {
          const name = nameOf(file);
          return (
            <motion.div
              key={`x-${name}-${i}`}
              className={`${bay.checkRow} ${bay.rejected}`}
              {...rowAnim}
            >
              <span className={`${bay.verdict} ${bay.no}`} aria-label="Blocked">
                ✗
              </span>
              <span className={bay.fname} title={name}>
                {name}
                <span className={bay.fsub}>BLOCKED TYPE · NOT LOADED</span>
              </span>
              <span className={`${bay.badge} ${bay.badgeBad}`}>
                .{extOf(name)}
              </span>
              <span className={bay.sizeTxt}>
                {byteToHumanSizeString(file.size)}
              </span>
              <span className={bay.rowActs}>
                <HoverTip label="Dismiss">
                  <ActionIcon size={26} onClick={() => onDismissRejected(i)}>
                    <TbX />
                  </ActionIcon>
                </HoverTip>
              </span>
            </motion.div>
          );
        })}
        {files.map((file, i) => {
          const name = nameOf(file);
          const pct = Math.min(100, (file.size / maxShareSize) * 100);
          const progress = file.uploadingProgress;
          const editable =
            progress === 0 && shareService.isShareTextFile(name);
          return (
            <motion.div
              key={`ok-${name}-${i}`}
              className={bay.checkRow}
              {...rowAnim}
            >
              <span className={`${bay.verdict} ${bay.ok}`} aria-label="Cleared">
                ✓
              </span>
              <span className={bay.fname} title={name}>
                {name}
                <span className={bay.fsub}>
                  {progress === -1
                    ? "RETRYING…"
                    : progress >= 100
                      ? "TRANSMITTED"
                      : progress > 0
                        ? `TRANSMITTING ${Math.round(progress)}%`
                        : "CLEARED · AWAITING TICKET"}
                </span>
              </span>
              <span className={bay.badge}>.{extOf(name)}</span>
              <span>
                <div className={bay.sizeBar}>
                  <i
                    className={progress > 0 ? bay.prog : undefined}
                    style={{
                      width: `${progress > 0 ? progress : Math.max(pct, 1.5)}%`,
                    }}
                  />
                </div>
                <div className={bay.sizeTxt}>
                  {byteToHumanSizeString(file.size)} · {pct.toFixed(pct < 1 ? 1 : 0)}%
                </div>
              </span>
              <span className={bay.rowActs}>
                {editable && (
                  <HoverTip label={t("common.button.edit")}>
                    <ActionIcon size={26} onClick={() => edit(i)}>
                      <TbEdit />
                    </ActionIcon>
                  </HoverTip>
                )}
                {progress === 0 && (
                  <HoverTip label={t("common.button.delete")}>
                    <ActionIcon size={26} color="red" onClick={() => remove(i)}>
                      <TbTrash />
                    </ActionIcon>
                  </HoverTip>
                )}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PrecheckList;
