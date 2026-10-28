"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidEmail } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const login = mode === "login";
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirmation: "" });
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (login) {
      const remembered = window.localStorage.getItem("steamCafeRememberedEmail");
      if (remembered && isValidEmail(remembered)) {
        setValues((current) => ({ ...current, email: remembered }));
        setRemember(true);
      }
    }
  }, [login]);

  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !values.email.trim() ||
      !isValidEmail(values.email.trim()) ||
      !values.password ||
      (!login &&
        (!values.name.trim() ||
          !values.phone.trim() ||
          values.password.length < 6 ||
          values.password !== values.confirmation))
    ) {
      setError("Please correct the highlighted fields.");
      return;
    }

    setMessage(login ? "Signing you in..." : "Creating your account...");

    const payload = login
      ? { email: values.email.trim(), password: values.password }
      : {
          fullName: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password
        };

    const endpoint = `/api/auth/${login ? "login" : "register"}`;
    const configuredBase = process.env.NEXT_PUBLIC_AUTH_API_URL?.trim();

    try {
      let response: Response;

      if (configuredBase) {
        try {
          response = await fetch(`${configuredBase}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch {
          // If port 4000/configuredBase is offline, gracefully use the built-in route
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      } else {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data: { error?: string; token?: string; user?: unknown } = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "The authentication service could not complete the request.");

      if (login) {
        if (remember) {
          window.localStorage.setItem("steamCafeRememberedEmail", values.email.trim());
        } else {
          window.localStorage.removeItem("steamCafeRememberedEmail");
        }
        if (data.token) window.sessionStorage.setItem("steamCafeAuthToken", data.token);
        if (data.user) window.sessionStorage.setItem("steamCafeUser", JSON.stringify(data.user));

        window.dispatchEvent(new Event("steam-cafe-auth-updated"));
        setMessage("Login successful! Redirecting...");

        window.setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect") || "/";
          router.push(redirect);
        }, 600);
      } else {
        setMessage("Account created successfully. You can now log in.");
        setValues({ name: "", email: "", phone: "", password: "", confirmation: "" });
        window.setTimeout(() => router.push("/login"), 1000);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The authentication service could not complete the request."
      );
    }
  }

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <div className="auth-card-heading">
        <p className="section-label">{login ? "WELCOME BACK" : "CREATE ACCOUNT"}</p>
        <h2>{login ? "Log in to your account" : "Join Steam Cafe"}</h2>
        <p>{login ? "Enter your details to continue." : "It only takes a moment to get started."}</p>
      </div>

      {!login && (
        <Field
          id="register-name"
          label="Full name"
          value={values.name}
          onChange={(value) => update("name", value)}
        />
      )}

      <Field
        id={`${login ? "login" : "register"}-email`}
        label="Email address"
        type="email"
        value={values.email}
        onChange={(value) => update("email", value)}
      />

      {!login && (
        <Field
          id="register-phone"
          label="Phone number"
          value={values.phone}
          onChange={(value) => update("phone", value)}
        />
      )}

      <Field
        id={`${login ? "login" : "register"}-password`}
        label="Password"
        type={showPassword ? "text" : "password"}
        value={values.password}
        onChange={(value) => update("password", value)}
      />

      {!login && (
        <Field
          id="register-confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          value={values.confirmation}
          onChange={(value) => update("confirmation", value)}
        />
      )}

      {login && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />{" "}
          <span>Remember my email on this device</span>
        </label>
      )}

      <button
        type="button"
        className="password-toggle auth-password-toggle"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? "Hide passwords" : "Show passwords"}
      </button>

      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-message success" role="status">
          {message}
        </p>
      )}

      <button className="btn btn-primary auth-submit" type="submit">
        {login ? "Log In" : "Create Account"} <i className="fa-solid fa-arrow-right" />
      </button>

      <p className="auth-switch">
        {login ? "New to Steam Cafe? " : "Already have an account? "}
        <Link href={login ? "/register" : "/login"}>
          {login ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={type === "password" ? "current-password" : undefined}
        required
      />
    </div>
  );
}
