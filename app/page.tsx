import { redirect } from "next/navigation";

// Startseite leitet direkt in den Dashboard-Chat (proxy.ts schickt zu /login,
// falls nicht eingeloggt).
export default function Home() {
  redirect("/chat");
}
