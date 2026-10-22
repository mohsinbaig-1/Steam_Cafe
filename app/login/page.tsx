import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return <main className="auth-page"><div className="auth-layout"><section className="auth-intro"><span className="section-tag">STEAM CAFE</span><h1>Good food is just a login away.</h1><p>Sign in to keep your Steam Cafe details close by and make your next order even easier.</p></section><AuthForm mode="login" /></div></main>;
}
