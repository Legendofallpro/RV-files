import { Button, createStyles } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import { Dropzone as MantineDropzone } from "@mantine/dropzone";
import React, { ForwardedRef, useEffect, useRef, useState } from "react";
import { TbCloudUpload, TbFolder } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useClipboardPaste from "../../hooks/useClipboardPaste.hook";
import { FileUpload } from "../../types/File.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";
import { getFilesFromEvent } from "../../utils/file.util";
import { filterBlockedFiles } from "../../utils/blockedFiles.util";
import en from "../../i18n/translations/en-US";
import bay from "./bay.module.css";

const useStyles = createStyles(() => ({
  dropzone: {
    border: 0,
    borderRadius: 0,
    padding: 0,
    backgroundColor: "transparent",
    "&[data-accept], &:hover": {
      backgroundColor: "color-mix(in srgb, var(--rv-signal) 6%, transparent)",
    },
  },
  mobileDescription: {
    display: "none",
    "@media (pointer: coarse)": {
      display: "inline",
    },
  },
  desktopDescription: {
    display: "inline",
    "@media (pointer: coarse)": {
      display: "none",
    },
  },
}));

const Dropzone = ({
  title,
  isUploading,
  maxShareSize,
  currentFilesSize = 0,
  onFilesChanged,
  onFilesRejected,
  readout,
}: {
  title?: string;
  onFilesRejected?: (files: FileUpload[]) => void;
  readout?: React.ReactNode;
  isUploading: boolean;
  maxShareSize: number;
  currentFilesSize?: number;
  onFilesChanged: (files: FileUpload[]) => void;
}) => {
  const { classes } = useStyles();

  const [isDragging, setIsDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  // All ingress routes share the same policy: picker, drop, folder and paste.
  const acceptFiles = (incomingFiles: FileUpload[]) => {
    if (isUploading) return;
    const blocked: FileUpload[] = [];
    const files = filterBlockedFiles(incomingFiles, (name) => {
      const hit = incomingFiles.find((f) => f.name === name);
      if (hit) blocked.push(hit);
      toast.error(
        <FormattedMessage
          id="upload.dropzone.notify.blocked-file"
          defaultMessage={en["upload.dropzone.notify.blocked-file"]}
          values={{ name }}
        />,
      );
    }).map((file) => {
      file.uploadingProgress = 0;
      return file;
    });
    if (blocked.length) onFilesRejected?.(blocked);
    if (files.length) onFilesChanged(files);
  };

  useClipboardPaste({
    onFiles: acceptFiles,
    disabled: isUploading,
  });
  const openRef = useRef<() => void>();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsMac(/Macintosh|Mac OS X/.test(navigator.userAgent));
    setIsFirefox(/Firefox/.test(navigator.userAgent));
  }, []);

  const isFolderUploadSupported =
    isMounted &&
    typeof HTMLInputElement !== "undefined" &&
    "webkitdirectory" in HTMLInputElement.prototype;

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = event.target.files;
    if (!filesList) return;
    const filesArray = Array.from(filesList) as FileUpload[];

    acceptFiles(filesArray);
    event.target.value = "";
  };

  function dropzoneMessageId(mobile: boolean) {
    if (mobile) {
      return !isFolderUploadSupported
        ? "upload.dropzone.description.desktop.no-folder"
        : "upload.dropzone.description.desktop";
    } else if (isFirefox) {
      return !isFolderUploadSupported
        ? "upload.dropzone.description.desktop.firefox.no-folder"
        : "upload.dropzone.description.desktop.firefox";
    }
    return !isFolderUploadSupported
      ? "upload.dropzone.description.desktop.no-folder"
      : "upload.dropzone.description.desktop";
  }

  const scanning = !reduceMotion;

  return (
    <motion.div
      className={bay.gate}
      animate={{
        scale: isDragging && !reduceMotion ? 1.01 : 1,
      }}
      transition={{ duration: reduceMotion ? 0 : 0.15 }}
    >
      <div className={bay.gateRail} aria-hidden="true">
        <span>Gate 01 · Drop inspection</span>
        <span>{isUploading ? "● Transmitting" : isDragging ? "● Scanning" : "○ Standby"}</span>
      </div>
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: "none" }}
        {...({
          webkitdirectory: "",
          directory: "",
        } as any)}
        multiple
        onChange={handleFolderSelect}
      />
      <div className={bay.gateField}>
        <div className={bay.gateGrid} aria-hidden="true" />
        <span className={`${bay.corner} ${bay.cTL}`} aria-hidden="true" />
        <span className={`${bay.corner} ${bay.cTR}`} aria-hidden="true" />
        <span className={`${bay.corner} ${bay.cBL}`} aria-hidden="true" />
        <span className={`${bay.corner} ${bay.cBR}`} aria-hidden="true" />
        {scanning && (
          <motion.div
            aria-hidden="true"
            className={`${bay.beam} ${isDragging ? bay.beamHot : ""}`}
            initial={{ top: "-30%" }}
            animate={{ top: ["-30%", "100%"] }}
            transition={{
              duration: isDragging ? 1.1 : 3.2,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        )}
        <MantineDropzone
          onReject={(e) => {
            setIsDragging(false);
            if (e[0]?.errors[0]) toast.error(e[0].errors[0].message);
          }}
          onDragEnter={() => !isUploading && setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          disabled={isUploading}
          openRef={openRef as ForwardedRef<() => void>}
          getFilesFromEvent={getFilesFromEvent}
          onDrop={(files: FileUpload[]) => {
            setIsDragging(false);
            acceptFiles(files);
          }}
          className={classes.dropzone}
          radius={0}
        >
          <div className={bay.gateBody} style={{ pointerEvents: "none" }}>
            <div
              className={`${bay.aperture} ${scanning ? bay.apertureSpin : ""}`}
            >
              <TbCloudUpload size={40} strokeWidth={1.6} />
            </div>
            <div className={bay.gateCopy}>
              <div className="rv-label">
                {isDragging ? "Release to inspect" : "Drop at the checkpoint"}
              </div>
              <h2>
                {title || <FormattedMessage id="upload.dropzone.title" />}
              </h2>
              <p>
                <span className={classes.mobileDescription}>
                  <FormattedMessage
                    id={
                      isMounted
                        ? dropzoneMessageId(true)
                        : "upload.dropzone.description.mobile"
                    }
                    values={{
                      maxSize: byteToHumanSizeString(maxShareSize),
                    }}
                  />
                </span>
                <span className={classes.desktopDescription}>
                  <FormattedMessage
                    id={
                      isMounted
                        ? dropzoneMessageId(false)
                        : "upload.dropzone.description.desktop"
                    }
                    values={{
                      maxSize: byteToHumanSizeString(maxShareSize),
                      shortcut: isMac ? "⌘+V" : "Ctrl+V",
                    }}
                  />
                </span>
              </p>
            </div>
            <span className="sr-only">
              <FormattedMessage
                id="upload.dropzone.quota-hint"
                defaultMessage={en["upload.dropzone.quota-hint"]}
              />
            </span>
          </div>
        </MantineDropzone>
      </div>
      {readout}
      <div className={bay.gateFoot}>
        <span>
          BLOCKED: .EXE .BAT .CMD .SH .PS1 .JS .HTML .SVG .MSI .JAR .APK .DLL …
        </span>
        {isFolderUploadSupported && (
          <Button
            variant="default"
            size="xs"
            radius={0}
            disabled={isUploading}
            onClick={() => folderInputRef.current?.click()}
          >
            <TbFolder style={{ marginRight: 6 }} />
            <FormattedMessage
              id={
                currentFilesSize > 0
                  ? "upload.button.folder.append"
                  : "upload.button.folder"
              }
            />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
export default Dropzone;
