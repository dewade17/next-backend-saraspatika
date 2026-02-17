'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layout, ConfigProvider } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  ScheduleOutlined,
  SettingOutlined,
  MenuOutlined,
  LogoutOutlined,
  AuditOutlined,
  BookOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  FundProjectionScreenOutlined,
  ContainerOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { canFromClaims } from '@/lib/rbac_client.js';

import AppButton from '@/app/(view)/components_shared/AppButton.jsx';
import AppDrawer from '@/app/(view)/components_shared/AppDrawer.jsx';
import AppFlex from '@/app/(view)/components_shared/AppFlex.jsx';
import AppImage from '@/app/(view)/components_shared/AppImage.jsx';
import AppAvatar from '@/app/(view)/components_shared/AppAvatar.jsx';
import AppModal from '@/app/(view)/components_shared/AppModal.jsx';
import AppSkeleton from '@/app/(view)/components_shared/AppSkeleton.jsx';
import AppMenu from '@/app/(view)/components_shared/AppMenu.jsx';
import AppDropDown from '@/app/(view)/components_shared/AppDropDown.jsx';

import ProviderAuth, { useAuth } from './providerAuth.jsx';

const { Sider, Content, Footer } = Layout;

const menuConfig = [
  {
    key: 'home',
    label: 'Home',
    href: '/home/dashboard',
    icon: <HomeOutlined />,
    // Admin/Kepsek punya absensi:read, Guru/Pegawai punya absensi:read. Aman.
    permission: { resource: 'absensi', action: 'read' },
  },
  {
    key: 'absensi',
    label: 'Manajemen Absensi',
    icon: <FundProjectionScreenOutlined />,
    children: [
      {
        key: 'absensi-guru',
        label: 'Absensi Guru',
        href: '/home/absensi-guru',
        permission: { resource: 'absensi', action: 'read' },
      },
      {
        key: 'absensi-pegawai',
        label: 'Absensi Pegawai',
        href: '/home/absensi-pegawai',
        permission: { resource: 'absensi', action: 'read' },
      },
    ],
  },
  {
    key: 'verifikasi',
    label: 'Verifikasi Izin',
    href: '/home/manajemen-verifikasi-izin',
    icon: <ScheduleOutlined />,
    // Admin/Kepsek punya izin:update. Guru/Pegawai Cuma create/read.
    // Jadi menu ini HANYA muncul untuk Admin/Kepsek. TEPAT.
    permission: { resource: 'izin', action: 'update' },
  },
  {
    key: 'pola jam kerja',
    label: 'Pola Jam Kerja',
    href: '/home/manajemen-pola-kerja',
    icon: <FieldTimeOutlined />,
    permission: { resource: 'pola_jam_kerja', action: 'read' },
  },
  {
    key: 'shift kerja',
    label: 'Shift Kerja',
    href: '/home/manajemen-shift-kerja',
    icon: <ContainerOutlined />,
    permission: { resource: 'shift_kerja', action: 'read' },
  },
  {
    key: 'agenda kerja',
    label: 'Agenda Kerja',
    href: '/home/agenda-kerja',
    icon: <AuditOutlined />,
    // PERBAIKAN: Resource disesuaikan dengan seed 'agenda'
    permission: { resource: 'agenda', action: 'read' },
  },
  {
    key: 'agenda mengajar',
    label: 'Agenda mengajar',
    href: '/home/agenda-mengajar',
    icon: <BookOutlined />,
    // PERBAIKAN: Resource disesuaikan dengan seed 'agenda'
    permission: { resource: 'agenda', action: 'read' },
  },
  {
    key: 'profile sekolah',
    label: 'Profile Sekolah',
    href: '/home/profile-sekolah',
    icon: <DatabaseOutlined />,
    // PERBAIKAN: Resource disesuaikan dengan seed 'profile_sekolah'
    permission: { resource: 'profile_sekolah', action: 'read' },
  },
  {
    key: 'pengguna',
    label: 'Manajemen Pengguna',
    href: '/home/manajemen-pengguna',
    icon: <SettingOutlined />,
    // PERBAIKAN: Resource disesuaikan dengan seed 'pengguna'
    permission: { resource: 'pengguna', action: 'read' },
  },
  {
    key: 'manajemen-lokasi',
    label: 'Manajemen Lokasi',
    href: '/home/manajemen-lokasi',
    icon: <EnvironmentOutlined />,
    // PERBAIKAN: Gunakan resource 'lokasi' agar lebih spesifik
    permission: { resource: 'lokasi', action: 'read' },
  },
  {
    key: 'reset-face',
    label: 'Reset Face',
    href: '/home/manajemen-face',
    icon: <UserOutlined />,
    // PERBAIKAN: Gunakan resource 'wajah' dengan action 'delete'
    // karena di seed: grant(manajerial, 'wajah', ['read', 'delete']);
    permission: { resource: 'wajah', action: 'delete' },
  },
];

function buildMenuItem(label, key, icon, children) {
  return { key, icon, children, label };
}

function filterMenuByPermissions(config, perms) {
  return config
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => canFromClaims(perms, child.permission?.resource, child.permission?.action));
        if (!children.length) return null;
        return { ...item, children };
      }

      if (item.permission && !canFromClaims(perms, item.permission.resource, item.permission.action)) {
        return null;
      }

      return item;
    })
    .filter(Boolean);
}

function mapMenuConfigToItems(config) {
  return config.map((item) => {
    if (item.children?.length) {
      return buildMenuItem(
        item.label,
        item.key,
        item.icon,
        item.children.map((child) => buildMenuItem(<Link href={child.href}>{child.label}</Link>, child.key)),
      );
    }
    return buildMenuItem(<Link href={item.href}>{item.label}</Link>, item.key, item.icon);
  });
}

function buildMenuMap(config) {
  const map = {};
  config.forEach((item) => {
    if (item.href) map[item.href] = item.key;
    if (item.children?.length) {
      item.children.forEach((child) => {
        map[child.href] = child.key;
      });
    }
  });
  return map;
}

function AdminDashboardShell({ children }) {
  const { user, perms, isLoadingUser, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredMenuConfig = useMemo(() => filterMenuByPermissions(menuConfig, perms), [perms]);
  const menuItems = useMemo(() => mapMenuConfigToItems(filteredMenuConfig), [filteredMenuConfig]);
  const menuMap = useMemo(() => buildMenuMap(filteredMenuConfig), [filteredMenuConfig]);

  const selectedKeys = useMemo(() => {
    const entries = Object.entries(menuMap).sort((a, b) => b[0].length - a[0].length);
    const found = entries.find(([path]) => pathname.startsWith(path));
    return found ? [found[1]] : [];
  }, [pathname, menuMap]);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const primaryColor = '#1677ff';
  const sidebarBg = '#d9f2d0'; // Hijau pastel sesuai gambar
  const headerBg = '#bae7ff'; // Biru muda sesuai gambar
  const selectedMenuBg = '#91d5ff'; // Biru highlight menu aktif
  const userLabel = user?.nama_pengguna || user?.email || 'User';

  // ⛔️ Proteksi folder /home: block render sampai user ter-load (dan id_user sudah tersimpan di localStorage)
  if (isLoadingUser) {
    return (
      <Layout style={{ minHeight: '100vh', padding: 40 }}>
        <AppSkeleton
          loading
          active
          avatar
          paragraph={{ rows: 8 }}
        />
      </Layout>
    );
  }

  // Kalau user gagal di-load, ProviderAuth akan redirect ke /login.
  // Return null supaya tidak sempat render shell.
  if (!user) return null;

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: sidebarBg,
            triggerBg: '#c1e0b5', // Warna tombol collapse (hijau sedikit lebih tua agar kontras)
            triggerColor: '#434343',
            headerBg: headerBg,
            footerBg: '#ffffff',
          },
          Menu: {
            itemBg: sidebarBg,
            subMenuItemBg: sidebarBg,
            itemColor: '#434343', // Teks gelap agar mudah dibaca
            itemHoverBg: '#c1e0b5', // Warna saat kursor menempel
            itemSelectedBg: selectedMenuBg, // Warna biru saat menu dipilih (seperti tombol Pegawai)
            itemSelectedColor: '#003a8c', // Teks biru tua saat terpilih
            popupBg: sidebarBg,
          },
        },
        token: {
          colorPrimary: primaryColor,
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            style={{
              position: 'fixed',
              height: '100vh',
              left: 0,
              zIndex: 1000,
              backgroundColor: sidebarBg,
              boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
              overflowY: 'auto', // Mengaktifkan scroll vertikal
              paddingBottom: '48px',
            }}
            width={240}
          >
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <AppImage
                src='/assets/images/logo_saraspatika.png'
                alt='Logo'
                width={collapsed ? 40 : 50}
                preview={false}
              />
            </div>

            <AppMenu
              mode='inline'
              selectedKeys={selectedKeys}
              items={menuItems}
              inlineCollapsed={collapsed}
              style={{ backgroundColor: sidebarBg }}
            />
          </Sider>
        )}

        {isMobile && (
          <AppDrawer
            placement='left'
            open={drawerVisible}
            onOpenChange={setDrawerVisible}
            width={280}
            footer={false}
            bodyStyle={{ padding: 0, backgroundColor: sidebarBg }}
          >
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <AppImage
                src='/assets/images/logo_saraspatika.png'
                alt='Logo'
                width={100}
                preview={false}
              />
            </div>

            <AppMenu
              mode='inline'
              selectedKeys={selectedKeys}
              items={menuItems}
              onAction={() => setDrawerVisible(false)}
              style={{ backgroundColor: sidebarBg }}
            />
          </AppDrawer>
        )}

        <Layout style={{ marginLeft: !isMobile ? (collapsed ? 80 : 240) : 0, transition: 'all 0.2s' }}>
          <AppFlex
            align='center'
            justify='space-between'
            style={{
              padding: '0 24px',
              height: 64,
              position: 'sticky',
              top: 0,
              zIndex: 999,
              backgroundColor: headerBg,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {isMobile && (
              <AppButton
                type='text'
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            )}

            <div style={{ flex: 1 }} />

            <AppDropDown
              trigger={['click']}
              items={[
                {
                  key: 'logout',
                  label: 'Keluar',
                  icon: <LogoutOutlined />,
                  onClick: () => setLogoutModalVisible(true),
                },
              ]}
            >
              <AppFlex
                gap={12}
                align='center'
                style={{ cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                  <div style={{ fontWeight: 600, color: '#262626' }}>{userLabel}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user?.role}</div>
                </div>

                <AppAvatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: primaryColor }}
                />
              </AppFlex>
            </AppDropDown>
          </AppFlex>

          <Content style={{ margin: '24px', padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>{children}</Content>
          <Footer style={{ textAlign: 'center', color: '#8c8c8c' }}>Si Hadir Saraspatika ©{new Date().getFullYear()}</Footer>
        </Layout>
      </Layout>

      <AppModal
        title='Konfirmasi Keluar'
        open={logoutModalVisible}
        onOpenChange={setLogoutModalVisible}
        onOk={handleLogout}
        okText='Keluar'
        cancelText='Batal'
        okTone='danger'
        okDanger
        centered
      >
        <p>Apakah Anda yakin ingin keluar dari sistem?</p>
      </AppModal>
    </ConfigProvider>
  );
}

export default function AdminDashboardLayout({ children }) {
  return (
    <ProviderAuth>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </ProviderAuth>
  );
}
