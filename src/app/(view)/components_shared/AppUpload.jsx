'use client';

import React from 'react';
import { App as AntdApp, Upload, Modal, Tooltip } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';

const DEFAULT_FONT_FAMILY = 'var(--font-poppins)';

function isThenable(value) {
  return value != null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

function normalizeTooltip(tooltip, disabled, disabledReason) {
  if (disabled && disabledReason) return { title: disabledReason };
  if (!tooltip) return null;

  if (typeof tooltip === 'string' || React.isValidElement(tooltip)) return { title: tooltip };
  if (typeof tooltip === 'object') {
    const { title, ...rest } = tooltip;
    return { title, ...rest };
  }
  return null;
}

function withTooltipWrapper(node, tooltipCfg) {
  if (!tooltipCfg?.title) return node;
  return (
    <Tooltip {...tooltipCfg}>
      <span style={{ display: 'inline-block', width: '100%' }}>{node}</span>
    </Tooltip>
  );
}

function toErrorMessage(err) {
  if (!err) return 'Terjadi kesalahan.';
  if (typeof err === 'string') return err;
  if (err?.message && typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Terjadi kesalahan.';
  }
}

function getExt(name) {
  const n = String(name ?? '');
  const idx = n.lastIndexOf('.');
  if (idx < 0) return '';
  return n.slice(idx + 1).toLowerCase();
}

function normalizeAcceptList(accept) {
  if (!accept) return [];
  if (Array.isArray(accept)) return accept.map((s) => String(s).trim()).filter(Boolean);
  return String(accept)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isImageFile(file) {
  const t = String(file?.type ?? '');
  if (t.startsWith('image/')) return true;
  const ext = getExt(file?.name);
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
}

function validateFile(file, rules) {
  const { maxSizeMB, maxSizeBytes, minSizeBytes, allowedTypes, allowedExts, imageOnly, accept, blockTypes, blockExts } = rules ?? {};

  if (!file) return { ok: false, reason: 'File tidak valid.' };

  const size = Number(file.size ?? 0);

  const maxBytes = typeof maxSizeBytes === 'number' ? maxSizeBytes : typeof maxSizeMB === 'number' ? Math.floor(maxSizeMB * 1024 * 1024) : null;

  if (typeof minSizeBytes === 'number' && size < minSizeBytes) {
    return { ok: false, reason: `Ukuran file terlalu kecil.` };
  }

  if (typeof maxBytes === 'number' && size > maxBytes) {
    const mb = maxBytes / 1024 / 1024;
    return { ok: false, reason: `Ukuran file terlalu besar. Maks ${mb.toFixed(2)} MB.` };
  }

  const type = String(file.type ?? '').toLowerCase();
  const ext = getExt(file.name);

  if (imageOnly && !isImageFile(file)) {
    return { ok: false, reason: 'Hanya file gambar yang diizinkan.' };
  }

  const allowedTypeList = Array.isArray(allowedTypes) ? allowedTypes.map((s) => String(s).toLowerCase()) : [];
  const allowedExtList = Array.isArray(allowedExts) ? allowedExts.map((s) => String(s).toLowerCase().replace(/^\./, '')) : [];
  const blockedTypeList = Array.isArray(blockTypes) ? blockTypes.map((s) => String(s).toLowerCase()) : [];
  const blockedExtList = Array.isArray(blockExts) ? blockExts.map((s) => String(s).toLowerCase().replace(/^\./, '')) : [];

  if (blockedTypeList.length > 0 && blockedTypeList.includes(type)) {
    return { ok: false, reason: 'Tipe file tidak diizinkan.' };
  }
  if (blockedExtList.length > 0 && ext && blockedExtList.includes(ext)) {
    return { ok: false, reason: 'Ekstensi file tidak diizinkan.' };
  }

  const acceptList = normalizeAcceptList(accept);

  const acceptPass = (() => {
    if (acceptList.length === 0) return true;

    // accept bisa: image/*, .pdf, application/pdf
    for (const a of acceptList) {
      const v = a.toLowerCase();
      if (v === '*/*') return true;

      if (v.endsWith('/*')) {
        const pref = v.slice(0, v.length - 1); // "image/"
        if (type.startsWith(pref)) return true;
        continue;
      }

      if (v.startsWith('.')) {
        const e = v.slice(1);
        if (ext && ext === e) return true;
        continue;
      }

      if (type === v) return true;
    }

    return false;
  })();

  if (!acceptPass) {
    return { ok: false, reason: 'Format file tidak sesuai.' };
  }

  if (allowedTypeList.length > 0 && type && !allowedTypeList.includes(type)) {
    return { ok: false, reason: 'Tipe file tidak sesuai.' };
  }

  if (allowedExtList.length > 0 && ext && !allowedExtList.includes(ext)) {
    return { ok: false, reason: 'Ekstensi file tidak sesuai.' };
  }

  return { ok: true, reason: null };
}

async function fileToDataUrl(file) {
  if (!file) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function resizeImageIfNeeded(file, opts) {
  const { enable, maxWidth, maxHeight, quality = 0.9, mimeType } = opts ?? {};
  if (!enable) return file;
  if (!isImageFile(file)) return file;

  const mw = typeof maxWidth === 'number' ? maxWidth : null;
  const mh = typeof maxHeight === 'number' ? maxHeight : null;
  if (!mw && !mh) return file;

  const dataUrl = await fileToDataUrl(file);
  if (!dataUrl) return file;

  const img = await new Promise((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = dataUrl;
  });

  if (!img) return file;

  const ow = img.width || 0;
  const oh = img.height || 0;
  if (!ow || !oh) return file;

  let nw = ow;
  let nh = oh;

  if (mw && nw > mw) {
    const ratio = mw / nw;
    nw = mw;
    nh = Math.round(nh * ratio);
  }

  if (mh && nh > mh) {
    const ratio = mh / nh;
    nh = mh;
    nw = Math.round(nw * ratio);
  }

  if (nw === ow && nh === oh) return file;

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, nw, nh);

  const outMime = mimeType ?? (String(file.type || '').startsWith('image/') ? file.type : 'image/jpeg');

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), outMime, quality);
  });

  if (!blob) return file;

  const newName = file.name;
  const outFile = new File([blob], newName, { type: outMime, lastModified: Date.now() });
  return outFile;
}

function FieldChrome({ label, required, extra, help, error, style, className, children }) {
  const hasHelp = help != null && help !== '';
  const hasError = error != null && error !== '';

  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: DEFAULT_FONT_FAMILY,
        ...style,
      }}
    >
      {label != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: '18px' }}>
            {label}
            {required ? <span style={{ marginInlineStart: 6, color: 'var(--ant-colorError, #ff4d4f)' }}>*</span> : null}
          </div>
          {extra != null ? <div style={{ opacity: 0.8 }}>{extra}</div> : null}
        </div>
      ) : null}

      {children}

      {hasError ? <div style={{ fontSize: 12, color: 'var(--ant-colorError, #ff4d4f)', lineHeight: '16px' }}>{error}</div> : hasHelp ? <div style={{ fontSize: 12, opacity: 0.75, lineHeight: '16px' }}>{help}</div> : null}
    </div>
  );
}

function normalizeConfirm(confirm) {
  if (!confirm) return null;

  if (typeof confirm === 'string' || React.isValidElement(confirm)) {
    return { title: confirm, okText: 'Ya', cancelText: 'Batal' };
  }

  if (typeof confirm === 'object') {
    return {
      title: confirm.title ?? 'Yakin?',
      content: confirm.content ?? confirm.description,
      okText: confirm.okText ?? 'Ya',
      cancelText: confirm.cancelText ?? 'Batal',
      okType: confirm.okType,
      danger: confirm.danger,
      centered: confirm.centered,
      maskClosable: confirm.maskClosable,
      width: confirm.width,
      icon: confirm.icon,
    };
  }

  return null;
}

async function runConfirmModal(confirmCfg) {
  if (!confirmCfg) return true;

  return new Promise((resolve) => {
    Modal.confirm({
      title: confirmCfg.title,
      content: confirmCfg.content,
      okText: confirmCfg.okText,
      cancelText: confirmCfg.cancelText,
      okType: confirmCfg.okType ?? (confirmCfg.danger ? 'danger' : 'primary'),
      centered: confirmCfg.centered,
      maskClosable: confirmCfg.maskClosable,
      width: confirmCfg.width,
      icon: confirmCfg.icon,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

function normalizeValueType(valueType) {
  const t = String(valueType ?? 'fileList').toLowerCase();
  if (t === 'files' || t === 'file') return 'files';
  return 'fileList';
}

function extractFilesFromFileList(fileList) {
  if (!Array.isArray(fileList)) return [];
  return fileList.map((f) => f?.originFileObj).filter(Boolean);
}

/**
 * AppUpload
 * - value/onValueChange: controlled fileList (antd) atau files (File[]) via valueType="files"
 * - validasi: maxSizeMB, allowedTypes/exts, imageOnly, accept
 * - resizeImage: opsi preprocess image (canvas) sebelum upload
 * - confirmRemove: konfirmasi sebelum hapus
 * - feedback: toast success/error untuk done/error
 * - preview: modal preview image
 */
export const AppUpload = React.forwardRef(function AppUpload(
  {
    value,
    defaultValue,
    valueType = 'fileList', // 'fileList' | 'files'
    onValueChange,

    fileList: fileListProp, // optional: langsung pakai antd fileList
    onChange,

    tooltip,
    disabledReason,

    accept,
    imageOnly = false,
    allowedTypes,
    allowedExts,
    blockTypes,
    blockExts,
    maxSizeMB,
    maxSizeBytes,
    minSizeBytes,

    maxCount,
    multiple,

    autoUpload = true, // false => sebelumUpload akan return false (manual mode)
    beforeUpload, // user hook
    customRequest, // pass-through

    resizeImage, // { enable, maxWidth, maxHeight, quality, mimeType }

    feedback, // true | { success, error }
    feedbackSuccess,
    feedbackError,

    confirmRemove, // string | object
    confirmBeforeAdd, // string|object (konfirmasi sebelum menambahkan ke list)

    preview = true,
    previewTitle = 'Preview',
    onPreview,

    trigger, // 'button' | 'dragger' | 'custom'
    triggerLabel = 'Upload',
    triggerIcon,
    triggerProps, // props untuk AppButton

    listType,
    showUploadList = true,

    disabled,
    className,
    style,

    ...rest
  },
  ref,
) {
  const { message } = AntdApp.useApp();

  const [innerList, setInnerList] = React.useState(() => {
    const t = normalizeValueType(valueType);
    if (fileListProp) return undefined;
    if (t === 'files') return [];
    return Array.isArray(defaultValue) ? defaultValue : [];
  });

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewSrc, setPreviewSrc] = React.useState('');
  const [previewName, setPreviewName] = React.useState('');

  const seenStatusRef = React.useRef(new Map()); // uid -> lastStatus

  const isDisabled = Boolean(disabled ?? rest.disabled);

  const tooltipCfg = normalizeTooltip(tooltip, isDisabled, disabledReason);

  const outType = normalizeValueType(valueType);

  const controlled = value != null || fileListProp != null;

  const currentFileList = (() => {
    if (fileListProp != null) return fileListProp;

    if (outType === 'files') {
      // untuk files mode, kita simpan innerList sebagai fileList (antd) juga agar upload UI konsisten
      // value (File[]) tidak bisa langsung dipakai Upload, jadi gunakan innerList
      if (controlled) return innerList ?? [];
      return innerList ?? [];
    }

    if (value != null) return value;
    return innerList ?? [];
  })();

  const setFileListSafe = (nextList) => {
    if (fileListProp != null) {
      // user manage via fileListProp + onChange
      return;
    }

    if (value == null) {
      setInnerList(nextList);
    }
  };

  const emitValue = (nextList, meta) => {
    if (typeof onValueChange !== 'function') return;

    if (outType === 'files') {
      onValueChange(extractFilesFromFileList(nextList), { ...meta, fileList: nextList, valueType: 'files' });
      return;
    }

    onValueChange(nextList, { ...meta, fileList: nextList, valueType: 'fileList' });
  };

  const normalizeFeedback = () => {
    if (!feedback) return null;
    if (feedback === true) return {};
    if (typeof feedback === 'object') return feedback;
    return null;
  };

  const fb = normalizeFeedback();
  const successMsg = feedbackSuccess ?? fb?.success;
  const errorMsg = feedbackError ?? fb?.error;

  const confirmRemoveCfg = normalizeConfirm(confirmRemove);
  const confirmBeforeAddCfg = normalizeConfirm(confirmBeforeAdd);

  const doPreview = async (file) => {
    if (typeof onPreview === 'function') {
      const res = onPreview(file);
      if (isThenable(res)) await res;
      return;
    }

    const isImg = isImageFile(file?.originFileObj ?? file);
    if (!isImg) {
      const url = file?.url || file?.thumbUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    let src = file?.url || file?.thumbUrl;

    if (!src) {
      const f = file?.originFileObj;
      if (f) src = await fileToDataUrl(f);
    }

    setPreviewSrc(src || '');
    setPreviewName(String(file?.name ?? ''));
    setPreviewOpen(true);
  };

  const handleChange = (info) => {
    const nextList = info?.fileList ?? [];
    setFileListSafe(nextList);

    if (typeof onChange === 'function') onChange(info);

    emitValue(nextList, { event: info, file: info?.file });

    // feedback (done/error) sekali per perubahan status
    const f = info?.file;
    const uid = f?.uid;
    const st = f?.status;

    if (uid && st) {
      const prev = seenStatusRef.current.get(uid);
      if (prev !== st) {
        seenStatusRef.current.set(uid, st);

        if (st === 'done' && successMsg) message.success(successMsg);
        if (st === 'error' && errorMsg) {
          const serverMsg = typeof f?.error === 'string' ? f.error : f?.error?.message ? String(f.error.message) : null;
          message.error(serverMsg || errorMsg);
        }
      }
    }
  };

  const handleRemove = async (file) => {
    if (isDisabled) return false;

    if (confirmRemoveCfg) {
      const ok = await runConfirmModal(confirmRemoveCfg);
      if (!ok) return false;
    }

    if (typeof rest.onRemove === 'function') {
      const res = rest.onRemove(file);
      if (typeof res === 'boolean') return res;
      if (isThenable(res)) return await res;
    }

    return true;
  };

  const handleBeforeUpload = async (file, fileList) => {
    if (isDisabled) return Upload.LIST_IGNORE;

    if (confirmBeforeAddCfg) {
      const ok = await runConfirmModal(confirmBeforeAddCfg);
      if (!ok) return Upload.LIST_IGNORE;
    }

    const check = validateFile(file, {
      maxSizeMB,
      maxSizeBytes,
      minSizeBytes,
      allowedTypes,
      allowedExts,
      blockTypes,
      blockExts,
      imageOnly,
      accept,
    });

    if (!check.ok) {
      message.error(check.reason || 'File tidak valid.');
      return Upload.LIST_IGNORE;
    }

    let nextFile = file;

    try {
      nextFile = await resizeImageIfNeeded(file, resizeImage);
    } catch (err) {
      // jika resize gagal, fallback file original
      if (errorMsg) message.error(errorMsg);
    }

    if (typeof beforeUpload === 'function') {
      const res = beforeUpload(nextFile, fileList);
      const out = isThenable(res) ? await res : res;

      if (out === false) return false;
      if (out === Upload.LIST_IGNORE) return Upload.LIST_IGNORE;
      if (out instanceof File || out instanceof Blob) return out;
    }

    if (!autoUpload) return false;
    return nextFile;
  };

  const renderTrigger = () => {
    const tr = String(trigger ?? 'button').toLowerCase();
    if (tr === 'custom') return rest.children;

    if (tr === 'dragger') {
      // Dragger trigger ditangani oleh AppUploadDragger, di sini fallback ke button
    }

    return (
      <AppButton
        type='default'
        icon={triggerIcon ?? <UploadOutlined />}
        disabled={isDisabled}
        {...(triggerProps ?? null)}
      >
        {triggerLabel}
      </AppButton>
    );
  };

  const uploadNode = (
    <Upload
      ref={ref}
      disabled={isDisabled}
      accept={accept}
      multiple={multiple}
      maxCount={maxCount}
      fileList={currentFileList}
      showUploadList={showUploadList}
      listType={listType}
      customRequest={customRequest}
      beforeUpload={handleBeforeUpload}
      onChange={handleChange}
      onPreview={preview ? doPreview : undefined}
      onRemove={handleRemove}
      className={className}
      style={{ fontFamily: DEFAULT_FONT_FAMILY, ...(style ?? null) }}
      {...rest}
    >
      {renderTrigger()}
    </Upload>
  );

  return (
    <>
      {withTooltipWrapper(uploadNode, tooltipCfg)}

      {preview ? (
        <Modal
          open={previewOpen}
          title={previewName ? `${previewTitle}: ${previewName}` : previewTitle}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={previewName}
              style={{ width: '100%' }}
              src={previewSrc}
            />
          ) : (
            <div style={{ fontFamily: DEFAULT_FONT_FAMILY, opacity: 0.8 }}>Tidak ada preview.</div>
          )}
        </Modal>
      ) : null}
    </>
  );
});

export const AppUploadDragger = React.forwardRef(function AppUploadDragger({ title = 'Klik atau drag file ke area ini', description, icon, ...props }, ref) {
  const node = (
    <Upload.Dragger
      ref={ref}
      {...props}
    >
      <div style={{ padding: 12, fontFamily: DEFAULT_FONT_FAMILY }}>
        <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>{icon ?? <InboxOutlined />}</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {description ? <div style={{ opacity: 0.75 }}>{description}</div> : null}
      </div>
    </Upload.Dragger>
  );

  return node;
});

export function AppImageUpload(props) {
  return (
    <AppUpload
      listType='picture-card'
      accept='image/*'
      imageOnly
      maxCount={1}
      triggerLabel='Upload'
      {...props}
    />
  );
}

export function AppFileUpload(props) {
  return (
    <AppUpload
      listType='text'
      triggerLabel='Upload'
      {...props}
    />
  );
}

export function AppUploadField({ label, required, extra, help, error, tooltip, disabledReason, ...props }) {
  return (
    <FieldChrome
      label={label}
      required={required}
      extra={extra}
      help={help}
      error={error}
    >
      <AppUpload
        tooltip={tooltip}
        disabledReason={disabledReason}
        {...props}
      />
    </FieldChrome>
  );
}

AppUpload.Dragger = AppUploadDragger;
AppUpload.Image = AppImageUpload;
AppUpload.File = AppFileUpload;
AppUpload.Field = AppUploadField;

export default AppUpload;
