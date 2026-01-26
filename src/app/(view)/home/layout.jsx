'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layout, Menu, Drawer, Button, Dropdown, Avatar, Modal, Flex, Image, ConfigProvider, notification } from 'antd';
import { HomeOutlined, UserOutlined, ScheduleOutlined, CalendarOutlined, BankOutlined, EnvironmentOutlined, SettingOutlined, ReloadOutlined, MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider, Content, Footer } = Layout;

const menuConfig = [
  {
    key: 'home',
    label: 'Home',
    href: '/home/admin/dashboard',
    icon: <HomeOutlined />,
    permission: { resource: 'dashboard', action: 'view' },
  },
  {
    key: 'absensi',
    label: 'Manajemen Absensi',
    icon: <UserOutlined />,
    children: [
      {
        key: 'absensi-karyawan',
        label: 'Karyawan',
        href: '/home/admin/absensi-karyawan',
        permission: { resource: 'absensi', action: 'read' },
      },
    ],
  },
  {
    key: 'verifikasi',
    label: 'Verifikasi Izin/Sakit/Cuti',
    href: '/home/admin/verifikasi-karyawan',
    icon: <ScheduleOutlined />,
    permission: { resource: 'izin', action: 'verify' },
  },
  {
    key: 'agenda-kerja',
    label: 'Agenda Kerja',
    href: '/home/admin/agenda-kerja',
    icon: <CalendarOutlined />,
    permission: { resource: 'agenda', action: 'read' },
  },
  {
    key: 'profil',
    label: 'Profil perusahaan',
    href: '/home/admin/manajemen-profil-perusahaan',
    icon: <BankOutlined />,
    permission: { resource: 'profil', action: 'manage' },
  },
  {
    key: 'lokasi',
    label: 'Manajemen Lokasi',
    href: '/home/admin/manajemen-lokasi',
    icon: <EnvironmentOutlined />,
    permission: { resource: 'lokasi', action: 'manage' },
  },
  {
    key: 'pengguna',
    label: 'Manajemen Pengguna',
    href: '/home/admin/manajemen-pengguna',
    icon: <SettingOutlined />,
    permission: { resource: 'pengguna', action: 'manage' },
  },
  {
    key: 'reset-face',
    label: 'Reset Face',
    href: '/home/admin/reset-face',
    icon: <ReloadOutlined />,
    permission: { resource: 'face', action: 'reset' },
  },
];

function buildMenuItem(label, key, icon, children) {
  return { key, icon, children, label };
}

function hasPermission(perms, resource, action) {
  if (!resource || !action) return true;
  return perms.includes(`${String(resource).toLowerCase()}:${String(action).toLowerCase()}`);
}

function filterMenuByPermissions(config, perms) {
  return config
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => hasPermission(perms, child.permission?.resource, child.permission?.action));
        if (!children.length) return null;
        return {
          ...item,
          children,
        };
      }

      if (!hasPermission(perms, item.permission?.resource, item.permission?.action)) {
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

const AdminDashboardLayout = ({ children, user, perms }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setDrawerVisible(false);
  }, [isMobile]);

  const normalizedPerms = useMemo(() => (Array.isArray(perms) ? perms.map((perm) => String(perm).toLowerCase()) : []), [perms]);
  const filteredMenuConfig = useMemo(() => filterMenuByPermissions(menuConfig, normalizedPerms), [normalizedPerms]);
  const items = useMemo(() => mapMenuConfigToItems(filteredMenuConfig), [filteredMenuConfig]);
  const menuMap = useMemo(() => buildMenuMap(filteredMenuConfig), [filteredMenuConfig]);

  function getSelectedKeys(currentPath) {
    const found = Object.entries(menuMap).find(([path]) => currentPath.startsWith(path));
    return found ? [found[1]] : [];
  }

  const selectedKeys = getSelectedKeys(pathname);

  const handleConfirmLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      notification.success({
        message: 'Logout Berhasil',
        description: 'Anda telah keluar dari akun.',
      });
      router.push('/login');
    } catch (error) {
      notification.error({
        message: 'Logout Gagal',
        description: error?.message || 'Terjadi kesalahan saat logout.',
      });
    } finally {
      setLogoutModalVisible(false);
    }
  };

  const primaryColor = '#1677ff';
  const userLabel = user?.email || `User ${user?.id || ''}`.trim();
  const roleLabel = user?.role || 'USER';

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: { siderBg: 'white', triggerBg: primaryColor, triggerColor: 'white', footerBg: 'white' },
          Menu: { colorBgContainer: 'white', colorText: primaryColor },
        },
        token: { colorPrimary: primaryColor },
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
              overflowY: 'auto',
              left: 0,
              zIndex: 1000,
              boxShadow: '8px 0 10px -5px rgba(0,0,0,0.07)',
            }}
            width={200}
          >
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Image
                src='/assets/images/logo_green.png'
                alt='Logo'
                width={80}
                preview={false}
              />
            </div>
            <Menu
              mode='inline'
              selectedKeys={selectedKeys}
              items={items}
            />
          </Sider>
        )}

        {isMobile && (
          <Drawer
            title='Menu'
            placement='left'
            closable
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              mode='inline'
              selectedKeys={selectedKeys}
              items={items}
            />
          </Drawer>
        )}

        <Layout
          style={{
            marginLeft: !isMobile ? (collapsed ? 80 : 200) : 0,
            marginTop: 50,
            transition: 'margin-left 0.2s',
          }}
        >
          <Flex
            align='center'
            justify='space-between'
            style={{
              paddingBlock: '1rem',
              paddingInline: '1rem',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 998,
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 2px 4px rgba(0,0,0,0.07)',
            }}
          >
            {isMobile && (
              <Button
                type='text'
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            )}
            <Flex
              justify='end'
              align='center'
              gap={20}
              style={{ flex: 1 }}
            >
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      label: 'Keluar',
                      icon: <LogoutOutlined />,
                      onClick: handleConfirmLogout,
                    },
                  ],
                }}
                trigger={['click']}
              >
                <a
                  onClick={(event) => event.preventDefault()}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Flex
                    gap={10}
                    style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}
                  >
                    <Avatar icon={<UserOutlined />} />
                    <div style={{ color: 'black', textAlign: 'right' }}>
                      <div>{userLabel}</div>
                      <div style={{ fontSize: 'smaller', marginTop: 5 }}>{roleLabel}</div>
                    </div>
                  </Flex>
                </a>
              </Dropdown>
            </Flex>
          </Flex>

          <Content style={{ margin: '40px 16px', padding: 24, minHeight: '100vh' }}>{children}</Content>
          <Footer style={{ textAlign: 'center', boxShadow: '0px -5px 10px rgba(0,0,0,0.07)' }}>Si Hadir ©{new Date().getFullYear()}</Footer>
        </Layout>
      </Layout>

      <Modal
        title='Keluar dari akun?'
        open={logoutModalVisible}
        onOk={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        okText='Logout'
        cancelText='Batal'
        okType='danger'
        centered
      >
        <p>Anda yakin ingin keluar dari akun?</p>
      </Modal>
    </ConfigProvider>
  );
};

export default AdminDashboardLayout;
