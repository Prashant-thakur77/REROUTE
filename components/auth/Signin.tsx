"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Github, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import {  loginWithEmailPassword ,signupWithEmailPassword, loginWithProvider, sendMagicLink } from "@/lib/functions/auth";
import { adminSignup } from "@/lib/actions/auth";
import { toast } from "sonner";
import { AuthHeader } from "./auth-header";

const authSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type FormData = z.infer<typeof authSchema>;

const SigninPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<string>("email");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "test@example.com",
      password: "Password123!",
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    
    try {
      let result;
      if (isSignUpMode) {
        // Use adminSignup to bypass rate limits and auto-confirm
        const adminResult = await adminSignup(values.email, values.password);
        
        if (adminResult.user) {
          // Signup succeeded, now sign in to get the session
          result = await loginWithEmailPassword(values.email, values.password);
          if (result && result.session) {
            toast.success("Account created! Welcome to the platform.");
            router.push("/dashboard");
          } else {
            toast.success("Account created! Please sign in with your credentials.");
            setIsSignUpMode(false);
          }
        } else {
          toast.error(adminResult.error || "Signup failed. Email might already be in use.");
        }
      } else {
        result = await loginWithEmailPassword(values.email, values.password);
        if (result && result.session) {
          toast.success("Welcome back! You have been signed in successfully.");
          router.push("/dashboard");
        } else if (result === null) {
          toast.error("Login failed. Please double-check your email and password.");
        } else {
          toast.error("Login failed. Please check your credentials.");
        }
      }
    } catch (error: any) {
      const msg = error?.message || "An unexpected error occurred. Please try again.";
      if (msg.includes("Email not confirmed")) {
        toast.error("Please confirm your email address before signing in. Check your inbox.");
      } else {
        toast.error(msg);
      }
      console.error(`${isSignUpMode ? 'Signup' : 'Signin'} error:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    setIsLoading(true);
    try {
      const result = await loginWithProvider(provider);
      if (result) {
        toast.success(`Successfully signed in with ${provider}.`);
        router.push("/dashboard");
      } else {
        toast.error(`Could not sign in with ${provider}. Please try again.`);
      }
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}.`);
      console.error(`${provider} login error:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Email is required for magic link",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendMagicLink(email);
      if (result) {
        toast.success(`Magic link sent! Check your inbox at ${email}.`);
      } else {
        toast.error("Failed to send magic link. Please try again or use a different method.");
      }
    } catch (error) {
      toast.error("Failed to send magic link. Please try again.");
      console.error("Magic link error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    form.reset();
  };

  const inputClass =
    "h-11 bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-[#2748E8]/40";
  const primaryBtn =
    "h-11 w-full rounded-full bg-[#0F172A] text-[#F8FAFC] hover:bg-[#1E293B] transition-transform duration-200 hover:-translate-y-0.5";

  return (
    <>
      <AuthHeader />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-4 pb-8 pt-20 sm:pt-24">
        {/* Ambient editorial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(39,72,232,0.08) 0%, transparent 60%)",
          }}
        />

        <Card className="relative w-full max-w-[420px] rounded-2xl border-[#CBD5E1] bg-[#FFFFFF] shadow-[0_24px_70px_rgba(24,22,15,0.14)]">
          <CardHeader className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2748E8]">
              REROUTE
            </p>
            <CardTitle className="mt-1 font-display text-2xl font-semibold text-[#0F172A] sm:text-3xl">
              {isSignUpMode ? "Create account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-sm text-[#475569]">
              {isSignUpMode
                ? "Join the supply chain resilience platform"
                : "Choose your preferred method to sign in"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="email" onValueChange={setAuthMethod}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-full bg-[#F1F5F9] p-1">
                <TabsTrigger value="email" className="rounded-full px-1 py-1.5 text-xs data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#0F172A] sm:text-sm">Email</TabsTrigger>
                <TabsTrigger value="social" className="rounded-full px-1 py-1.5 text-xs data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#0F172A] sm:text-sm">Social</TabsTrigger>
                <TabsTrigger value="magic" className="rounded-full px-1 py-1.5 text-xs data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#0F172A] sm:text-sm">Magic Link</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-5">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#475569]">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className={inputClass}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#475569]">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className={inputClass}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className={primaryBtn} disabled={isLoading}>
                      {isLoading
                        ? isSignUpMode
                          ? "Creating account..."
                          : "Signing in..."
                        : isSignUpMode
                          ? "Create account"
                          : "Sign in"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <button
                    onClick={toggleMode}
                    className="inline-flex min-h-[40px] items-center px-2 text-sm text-[#2748E8] hover:underline focus:outline-none"
                    disabled={isLoading}
                  >
                    {isSignUpMode
                      ? "Already have an account? Sign In"
                      : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="social" className="mt-5">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-full border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9]"
                    onClick={() => handleSocialLogin("google")}
                    disabled={isLoading}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-full border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9]"
                    onClick={() => handleSocialLogin("github")}
                    disabled={isLoading}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Continue with GitHub
                  </Button>
                  <Separator className="bg-[#E2E8F0]" />
                  <p className="text-center text-sm text-[#64748B]">
                    Secure authentication with OAuth
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="magic" className="mt-5">
                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#475569]">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className={inputClass}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      className={primaryBtn}
                      onClick={handleMagicLink}
                      disabled={isLoading}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isLoading ? "Sending..." : "Send Magic Link"}
                    </Button>
                  </form>
                </Form>
                <p className="mt-4 text-center text-sm text-[#64748B]">
                  We'll send you a secure link to sign in instantly
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SigninPage;