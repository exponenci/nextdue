import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const locales = new Set(["en", "ru", "uz"]);

export default async function WorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.has(locale)) redirect("/en");
  const session = await auth();
  if (!session?.user) redirect(`/api/auth/signin?callbackUrl=/${locale}/app`);
  return <main className="workspace-shell">
    <div className="workspace-topbar">
      <Link href={`/${locale}`} className="brand"><span>ND</span>NextDue</Link>
      <span>{session.user.email}</span>
    </div>
    <iframe
      className="workspace-frame"
      title="NextDue workspace"
      src="/workspace/index.html?mode=saas"
      sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
    />
  </main>;
}
