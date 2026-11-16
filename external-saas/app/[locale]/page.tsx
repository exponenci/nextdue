import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

const copy = {
  en: {
    eyebrow: "External SaaS foundation",
    title: "Every country. Every asset. One trusted plan.",
    body: "NextDue maps people, possessions and jurisdictions to an evidence-backed set of documents and obligations.",
    signIn: "Sign in",
    signedIn: "Signed in as",
    openApp: "Open workspace",
    model: "Households → people → jurisdictions → assets → obligations",
    note: "Google sign-in and Calendar access are separate consent flows."
  },
  ru: {
    eyebrow: "Основа внешнего SaaS",
    title: "Все страны и имущество — в одном понятном плане.",
    body: "NextDue связывает людей, имущество и юрисдикции с проверяемым каталогом документов и обязанностей.",
    signIn: "Войти",
    signedIn: "Вы вошли как",
    openApp: "Открыть рабочее пространство",
    model: "Семья → люди → юрисдикции → имущество → обязанности",
    note: "Вход через Google и доступ к календарю — разные согласия."
  },
  uz: {
    eyebrow: "Tashqi SaaS asosi",
    title: "Har bir mamlakat va mulk uchun bitta ishonchli reja.",
    body: "NextDue odamlar, mulklar va yurisdiksiyalarni tekshiriladigan hujjatlar va majburiyatlar katalogi bilan bog‘laydi.",
    signIn: "Kirish",
    signedIn: "Tizimga kirgan foydalanuvchi",
    openApp: "Ish maydonini ochish",
    model: "Oila → odamlar → yurisdiksiyalar → mulklar → majburiyatlar",
    note: "Google orqali kirish va Calendar ruxsati alohida rozilik jarayonlaridir."
  }
} as const;

type Locale = keyof typeof copy;

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!(rawLocale in copy)) notFound();
  const locale = rawLocale as Locale;
  const text = copy[locale];
  const session = await auth();

  return <main className="shell">
    <header>
      <Link href={`/${locale}`} className="brand"><span>ND</span>NextDue</Link>
      <nav aria-label="Language">
        <Link href="/en" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
        <Link href="/ru" aria-current={locale === "ru" ? "page" : undefined}>RU</Link>
        <Link href="/uz" aria-current={locale === "uz" ? "page" : undefined}>UZ</Link>
      </nav>
    </header>
    <section className="hero">
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="lead">{text.body}</p>
      {session?.user ? <div className="signed-in"><p className="session">{text.signedIn} <strong>{session.user.email}</strong></p><Link className="button" href={`/${locale}/app`}>{text.openApp}</Link></div> :
        <Link className="button" href="/api/auth/signin">{text.signIn}</Link>}
    </section>
    <section className="model-card">
      <p>{text.model}</p>
      <small>{text.note}</small>
    </section>
  </main>;
}
