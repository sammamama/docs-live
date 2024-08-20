"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import Loader from "@/components/Loader";
import { getClerkUser, getDocumentUsers } from "@/lib/actions/user.actions";
import { useUser } from "@clerk/nextjs";

const Provider = ({ children }: { children: ReactNode }) => {
  const {user: clerkUser} = useUser();
  
  return (
    <LiveblocksProvider 
      authEndpoint={"/api/liveblocks-auth"}
      resolveUsers={async ({userIds}: {userIds: string[]}) => {
        const users = await getClerkUser({userIds});

        return users;
      }}

      resolveMentionSuggestions={async({text, roomId}) => {
        const roomUser = await getDocumentUsers({
          roomId, 
          text, 
          currentUser: clerkUser?.emailAddresses[0].emailAddress!
        });

        return roomUser;
      }}
    >
        <ClientSideSuspense fallback={<Loader />}>
          {children}
        </ClientSideSuspense>
    </LiveblocksProvider>
  );
}

export default Provider;