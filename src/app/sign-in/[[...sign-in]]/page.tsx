import { SignIn } from "@clerk/nextjs";

export default function SignInPage(): React.JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Officer sign-in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to access Samvaad AI press briefing workspace.
        </p>
      </div>
      <SignIn />
    </main>
  );
}
