import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return <main className="auth-page"><div className="auth-layout"><section className="auth-intro"><span className="section-tag">JOIN STEAM CAFE</span><h1>Make every craving count.</h1><p>Create your account to keep your ordering details ready for your next delicious visit.</p></section><AuthForm mode="register" /></div></main>;
}
