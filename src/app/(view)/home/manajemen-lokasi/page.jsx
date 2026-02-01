'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, FloatButton, Form, Input, InputNumber, Modal, Popconfirm, Row, Skeleton, Space, Typography, message, theme } from 'antd';
import { DeleteOutlined, EditOutlined, EnvironmentOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toNumber(val) {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : null;
}

const seed = [
  {
    id: makeId(),
    name: 'SD Saraswati 4 Denpasar',
    latitude: -6.193125,
    longitude: 106.82181,
    radius: 0.1,
  },
];

function LocationCard({ loc, onEdit, onDelete }) {
  const { token } = theme.useToken();

  const styles = {
    wrapper: {
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
      border: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
    },
    body: { padding: 16 },
    footer: {
      display: 'flex',
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
    },
    footerBtn: {
      width: '50%',
      borderRadius: 0,
      height: 44,
    },
    row: { margin: 0, lineHeight: 1.6 },
    label: { color: token.colorTextSecondary },
    value: { color: token.colorText },
    name: { marginBottom: 8, display: 'block' },
  };

  return (
    <div style={styles.wrapper}>
      <Card
        bordered={false}
        bodyStyle={styles.body}
      >
        <Typography.Text
          strong
          style={styles.name}
        >
          Nama lokasi: {loc.name}
        </Typography.Text>

        <p style={styles.row}>
          <span style={styles.label}>Latitude</span>
          <span style={styles.value}> : {loc.latitude}</span>
        </p>
        <p style={styles.row}>
          <span style={styles.label}>Longitude</span>
          <span style={styles.value}> : {loc.longitude}</span>
        </p>
        <p style={styles.row}>
          <span style={styles.label}>Radius</span>
          <span style={styles.value}> : {loc.radius}</span>
        </p>
      </Card>

      <div style={styles.footer}>
        <Button
          type='primary'
          icon={<EditOutlined />}
          style={styles.footerBtn}
          onClick={() => onEdit(loc)}
        >
          Edit
        </Button>

        <Popconfirm
          title='Hapus lokasi?'
          description='Aksi ini tidak bisa dibatalkan.'
          okText='Hapus'
          cancelText='Batal'
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(loc.id)}
        >
          <Button
            danger
            type='primary'
            icon={<DeleteOutlined />}
            style={styles.footerBtn}
          >
            Delete
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}

function LocationFormModal({ open, title, initialValues, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      latitude: initialValues?.latitude ?? null,
      longitude: initialValues?.longitude ?? null,
      radius: initialValues?.radius ?? 0.1,
    });
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      name: String(values.name || '').trim(),
      latitude: toNumber(values.latitude),
      longitude: toNumber(values.longitude),
      radius: toNumber(values.radius),
    };
    await onSubmit(payload);
    form.resetFields();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleOk}
      okText='Simpan'
      cancelText='Batal'
      destroyOnClose
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          name: '',
          latitude: null,
          longitude: null,
          radius: 0.1,
        }}
      >
        <Form.Item
          label='Nama Lokasi'
          name='name'
          rules={[
            { required: true, message: 'Nama lokasi wajib diisi.' },
            { min: 3, message: 'Minimal 3 karakter.' },
            { max: 80, message: 'Maksimal 80 karakter.' },
          ]}
        >
          <Input
            placeholder='Contoh: SD Saraswati 4 Denpasar'
            allowClear
          />
        </Form.Item>

        <Row gutter={12}>
          <Col
            xs={24}
            sm={12}
          >
            <Form.Item
              label='Latitude'
              name='latitude'
              rules={[
                { required: true, message: 'Latitude wajib diisi.' },
                {
                  validator: (_, v) => {
                    const n = toNumber(v);
                    if (n === null) return Promise.reject(new Error('Latitude harus berupa angka.'));
                    if (n < -90 || n > 90) return Promise.reject(new Error('Latitude harus di antara -90 sampai 90.'));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                placeholder='-6.193125'
              />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            sm={12}
          >
            <Form.Item
              label='Longitude'
              name='longitude'
              rules={[
                { required: true, message: 'Longitude wajib diisi.' },
                {
                  validator: (_, v) => {
                    const n = toNumber(v);
                    if (n === null) return Promise.reject(new Error('Longitude harus berupa angka.'));
                    if (n < -180 || n > 180) return Promise.reject(new Error('Longitude harus di antara -180 sampai 180.'));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                placeholder='106.821810'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label='Radius'
          name='radius'
          rules={[
            { required: true, message: 'Radius wajib diisi.' },
            {
              validator: (_, v) => {
                const n = toNumber(v);
                if (n === null) return Promise.reject(new Error('Radius harus berupa angka.'));
                if (n < 0.01) return Promise.reject(new Error('Radius minimal 0.01.'));
                return Promise.resolve();
              },
            },
          ]}
          extra='Sesuaikan satuan radius sesuai kebutuhan'
        >
          <InputNumber
            style={{ width: '100%' }}
            step={0.01}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function LocationManagementPage() {
  const { token } = theme.useToken();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const editingLocation = useMemo(() => locations.find((l) => l.id === editingId) || null, [locations, editingId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, query]);

  const statsText = useMemo(() => {
    const total = locations.length;
    const shown = filtered.length;
    if (total === 0) return '0 lokasi';
    if (shown === total) return `${total} lokasi`;
    return `${shown} dari ${total} lokasi`;
  }, [locations.length, filtered.length]);

  const pageStyles = {
    container: { padding: 16 },
    headerCard: {
      borderRadius: 14,
      boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
      border: `1px solid ${token.colorBorderSecondary}`,
      marginBottom: 16,
    },
    titleWrap: { display: 'flex', alignItems: 'flex-start', gap: 10 },
    title: { margin: 0 },
    subtitle: { color: token.colorTextSecondary, fontSize: 12, marginTop: 2 },
    meta: { color: token.colorTextSecondary, fontSize: 12, marginTop: 4 },
    search: { width: '100%' },
    actionsWrap: { width: '100%' },
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      setLocations(seed);
    } catch (e) {
      message.error('Gagal memuat data lokasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditingId(loc.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const upsert = async (payload) => {
    setLocations((prev) => {
      if (!editingId) return [{ id: makeId(), ...payload }, ...prev];
      return prev.map((l) => (l.id === editingId ? { ...l, ...payload } : l));
    });
    message.success(editingId ? 'Lokasi berhasil diupdate.' : 'Lokasi berhasil ditambahkan.');
    closeModal();
  };

  const remove = (id) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    message.success('Lokasi berhasil dihapus.');
  };

  return (
    <div style={pageStyles.container}>
      <Card
        style={pageStyles.headerCard}
        bodyStyle={{ padding: 16 }}
      >
        <Row
          gutter={[12, 12]}
          align='middle'
        >
          <Col
            xs={24}
            md={14}
          >
            <div style={pageStyles.titleWrap}>
              <EnvironmentOutlined />
              <div>
                <Typography.Title
                  level={4}
                  style={pageStyles.title}
                >
                  Manajemen Lokasi
                </Typography.Title>
                <div style={pageStyles.subtitle}>Kelola daftar lokasi beserta koordinat dan radius.</div>
                <div style={pageStyles.meta}>{statsText}</div>
              </div>
            </div>
          </Col>

          <Col
            xs={24}
            md={10}
          >
            <Row
              gutter={[8, 8]}
              align='middle'
              justify='end'
              style={pageStyles.actionsWrap}
            >
              <Col
                xs={24}
                sm={16}
              >
                <Input
                  allowClear
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Cari nama lokasi...'
                  prefix={<SearchOutlined />}
                  style={pageStyles.search}
                />
              </Col>
              <Col
                xs={24}
                sm={8}
              >
                <Button
                  type='primary'
                  icon={<PlusOutlined />}
                  onClick={openCreate}
                  style={{ width: '100%' }}
                >
                  Tambah
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Col
              key={i}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
            >
              <Card
                style={{ borderRadius: 14 }}
                bodyStyle={{ padding: 16 }}
              >
                <Skeleton
                  active
                  title
                  paragraph={{ rows: 3 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filtered.length === 0 ? (
        <Card
          style={{ borderRadius: 14 }}
          bodyStyle={{ padding: 24 }}
        >
          <Empty description={locations.length === 0 ? 'Belum ada lokasi.' : 'Tidak ada hasil pencarian.'} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((loc) => (
            <Col
              key={loc.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
            >
              <LocationCard
                loc={loc}
                onEdit={openEdit}
                onDelete={remove}
              />
            </Col>
          ))}
        </Row>
      )}

      <FloatButton
        icon={<PlusOutlined />}
        type='primary'
        tooltip='Tambah lokasi'
        onClick={openCreate}
        style={{ right: 24, bottom: 24 }}
      />

      <LocationFormModal
        open={modalOpen}
        title={editingId ? 'Edit Lokasi' : 'Tambah Lokasi'}
        initialValues={editingLocation}
        onCancel={closeModal}
        onSubmit={upsert}
      />
    </div>
  );
}
