import { Poppins } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Providers from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Saraspatika',
  description: 'Dashboard Admin Sistem Absensi Guru dan Pegawai SD Saraswati 4 Denpasar',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${poppins.variable} antialiased`}>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
