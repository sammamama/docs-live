import { liveblocks } from "@/lib/liveblocks";
import { getUserColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const clerkUser = await currentUser();

  if(!clerkUser) redirect('/sign-in')

  const { id, firstName, lastName, imageUrl, emailAddresses } = clerkUser;

  // Get the current user from your database
  const user = {
    id: clerkUser.id,
    info: {
        id,
        name: `${firstName} ${lastName}`,
        email: emailAddresses[0].emailAddress,
        avatar: imageUrl,
        color: getUserColor(id)
    }
  };

  // Start an auth session inside your endpoint
  // const session = liveblocks.prepareSession(
  //   user.id,
  //   { userInfo: user.info } // Optional
  // );

  // Use a naming pattern to allow access to rooms with wildcards
  // Giving the user read access on their org, and write access on their group
  // session.allow(`${user}:*`, session.FULL_ACCESS);
  // session.allow(`${user}:${user.group}:*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await liveblocks.identifyUser({
        userId: user.info.email,
        groupIds: [],
    }, 
    {userInfo: user.info}
  );
  return new Response(body, { status });
}