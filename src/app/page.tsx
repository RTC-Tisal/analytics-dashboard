import { redirect } from "next/navigation";

// The home page has no content of its own: send visitors to the first section.
export default function Home() {
  redirect("/website");
}
