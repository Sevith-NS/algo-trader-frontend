import { redirect } from "next/navigation";

// The old next-auth credentials form lived here. Auth is Clerk now; keep the
// URL working for old links and bookmarks.
export default function LoginPage() {
  redirect("/sign-up");
}
