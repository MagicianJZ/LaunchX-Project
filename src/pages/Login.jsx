import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // #region agent log
    fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H1',location:'src/pages/Login.jsx:21',message:'email password login submitted',data:{emailPresent:Boolean(email),passwordPresent:Boolean(password),emailLength:email.length,path:window.location.pathname,hash:window.location.hash},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      const loginResponse = await base44.auth.loginViaEmailPassword(email, password);
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H2,H3',location:'src/pages/Login.jsx:25',message:'email password login succeeded before redirect',data:{hasAccessToken:Boolean(loginResponse?.access_token),hasUser:Boolean(loginResponse?.user),path:window.location.pathname,hash:window.location.hash,redirectTarget:'/'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      window.location.href = "/";
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H1',location:'src/pages/Login.jsx:29',message:'email password login failed',data:{name:err?.name,status:err?.status,responseStatus:err?.response?.status,reason:err?.data?.extra_data?.reason||err?.response?.data?.extra_data?.reason,message:err?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // #region agent log
    fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H5',location:'src/pages/Login.jsx:39',message:'google login invoked',data:{path:window.location.pathname,hash:window.location.hash,redirectTarget:'/'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
