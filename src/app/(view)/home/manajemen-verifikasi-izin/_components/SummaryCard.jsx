import React from 'react';
import { Tag, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import AppCard from '@/app/(view)/components_shared/AppCard.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppTypography from '@/app/(view)/components_shared/AppTypography.jsx';
import { STATUS_LABEL, STATUS_TAG_COLOR, JENIS_LABEL } from '../_utils/constants.js';
import { toIdDate } from '../_utils/helper.js';

export default function SummaryCard({ item, onApprove, onReject, busy }) {
  const status = String(item?.status ?? 'MENUNGGU').toUpperCase();
  const jenis = String(item?.jenis_pengajuan ?? '').toUpperCase();

  return (
    <AppCard
      bordered
      style={{ borderRadius: 10, height: '100%' }}
      styles={{ body: { padding: 14 } }}
    >
      <AppFlex
        direction='column'
        gap={8}
        style={{ width: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <AppTypography
            as='text'
            weight='semibold'
            truncate
            style={{ display: 'block', minWidth: 0 }}
          >
            {item?.user?.name || '-'}
          </AppTypography>
          <Tag
            color={STATUS_TAG_COLOR[status] || 'default'}
            style={{ marginInlineEnd: 0 }}
          >
            {STATUS_LABEL[status] || status}
          </Tag>
        </div>

        <AppTypography as='text'>
          <b>NIP</b>: {item?.user?.nip || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Konfirmasi</b>: {JENIS_LABEL[jenis] || item?.jenis_pengajuan || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Deskripsi</b>: {item?.alasan || '-'}
        </AppTypography>
        <AppTypography as='text'>
          <b>Mulai</b>: {toIdDate(item?.tanggal_mulai)}
        </AppTypography>
        <AppTypography as='text'>
          <b>Selesai</b>: {toIdDate(item?.tanggal_selesai)}
        </AppTypography>

        <AppFlex
          align='center'
          gap={8}
          style={{ marginTop: 4 }}
        >
          <AppTypography as='text'>
            <b>Bukti Pendukung</b>:
          </AppTypography>
          {item?.foto_bukti_url ? (
            <Button
              type='link'
              size='small'
              icon={<EyeOutlined />}
              onClick={() => window.open(item.foto_bukti_url, '_blank')}
              style={{ padding: 0, height: 'auto' }}
            />
          ) : (
            <AppTypography
              as='text'
              type='secondary'
            >
              <i>-</i>
            </AppTypography>
          )}
        </AppFlex>

        <AppFlex
          gap={10}
          justify='space-between'
          style={{ marginTop: 14 }}
        >
          <AppButton
            type='primary'
            block
            onClick={() => onApprove(item)}
            loading={busy === item?.id_pengajuan}
            disabled={status !== 'MENUNGGU'}
          >
            Setuju
          </AppButton>
          <AppButton
            danger
            block
            onClick={() => onReject(item)}
            loading={busy === item?.id_pengajuan}
            disabled={status !== 'MENUNGGU'}
          >
            Tolak
          </AppButton>
        </AppFlex>
      </AppFlex>
    </AppCard>
  );
}
