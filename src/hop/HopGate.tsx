import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import HopApp from "./HopApp";
import { Logo } from "./HopArt";
import "./hop.css";

// Same access rules as /staff: signed-in Supabase user with an active staff membership.
export default function HopGate() {
  const [user, setUser] = useState<string | null>(null),
    [checking, setChecking] = useState(true),
    [allowed, setAllowed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    document.title = "Busy Brewing · Horn OK Please";
    if (!supabase) {
      setChecking(false);
      return;
    }
    let generation = 0,
      alive = true,
      lastId: string | null | undefined = undefined;
    const check = async (id: string | null) => {
      if (id === lastId) return;
      lastId = id;
      const n = ++generation;
      setUser(id);
      setAllowed(false);
      setChecking(true);
      if (id) {
        const { data, error } = await supabase!
          .from("staff_members")
          .select("active")
          .eq("user_id", id)
          .maybeSingle();
        if (!alive || n !== generation) return;
        setAllowed(data?.active === true);
        setError(
          error
            ? "Unable to check access. Please sign in again."
            : data?.active
              ? ""
              : "This account has not been approved for the workspace.",
        );
      }
      if (alive && n === generation) setChecking(false);
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setChecking(false);
      } else void check(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => {
        if (alive) void check(session?.user.id ?? null);
      }, 0);
    });
    return () => {
      alive = false;
      generation++;
      data.subscription.unsubscribe();
    };
  }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (error) setError("Could not sign in. Check your email and password.");
    } catch {
      setError("Connection unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <div className="hop h-auth">
        <p role="status" className="h-auth-wait">
          <Logo className="h-logo" />
        </p>
      </div>
    );
  if (user && allowed) return <HopApp userId={user} />;
  return (
    <main className="hop h-auth">
      <section className="h-auth-card">
        <Logo full className="h-logo-full" />
        <p className="h-eyebrow">HORN OK PLEASE · THE SEASON BETWEEN</p>
        <h1>
          A little busy.
          <br />
          Welcome back.
        </h1>
        <p>Sign in to open the counter.</p>
        {!supabase ? (
          <p role="alert">Workspace connection is not configured yet.</p>
        ) : user ? (
          <button className="h-primary" onClick={() => supabase!.auth.signOut()}>
            Sign out
          </button>
        ) : (
          <form onSubmit={login}>
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required autoFocus />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="h-primary" disabled={busy}>
              {busy ? "Signing in…" : "Open the counter"}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="h-auth-error">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
