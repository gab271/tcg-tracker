import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  fetchProfileByUsername,
  fetchPublicCollection,
  fetchPublicDecks,
} from "@/lib/supabase/queries/public-profile";
import PublicProfileClient from "./PublicProfileClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `@${username} — TCG Multiverse`,
    description: `View ${username}'s public TCG collection and decks.`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await fetchProfileByUsername(supabase, username);
  if (!profile) notFound();

  const [collection, decks] = await Promise.all([
    profile.isPublicCollection
      ? fetchPublicCollection(supabase, profile.userId)
      : Promise.resolve([]),
    profile.isPublicDecks
      ? fetchPublicDecks(supabase, profile.userId)
      : Promise.resolve([]),
  ]);

  return (
    <PublicProfileClient
      profile={profile}
      collection={collection}
      decks={decks}
    />
  );
}
