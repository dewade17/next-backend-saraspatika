import SetPasswordPageClient from './_components/SetPasswordPageClient';

function pickSearchParam(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export default async function SetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = pickSearchParam(params?.token);

  return <SetPasswordPageClient token={token} />;
}
