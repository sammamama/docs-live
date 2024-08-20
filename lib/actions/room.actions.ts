"use server";

import { nanoid } from "nanoid";
import { liveblocks } from "../liveblocks";
import { getAccessType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const createDocument = async ({
  userId,
  email,
}: CreateDocumentParams) => {
  const roomId = nanoid();
  try {
    const metadata = {
      creatorId: userId,
      email,
      title: "Untitled",
    };

    const usersAccesses: RoomAccesses = {
      [email]: ["room:write"],
    };

    const room = await liveblocks.createRoom(roomId, {
      metadata,
      usersAccesses,
      defaultAccesses: ["room:write"],
    });

    return room;
  } catch (e) {
    console.log(e);
  }
};

export const getDocument = async ({
  userId,
  roomId,
}: {
  roomId: string;
  userId: string;
}) => {
  const room = await liveblocks.getRoom(roomId);

  const hasAccess = Object.keys(room.usersAccesses).includes(userId);

  if (!hasAccess) throw new Error("You do not have access to this document!");

  return parseStringify(room);
};

export const updateDocument = async (roomId: string, title: string) => {
  try {
    const updatedRoom = await liveblocks.updateRoom(roomId, {
      metadata: {
        title,
      },
    });

    revalidatePath(`/documents/${roomId}`);

    return updatedRoom;
  } catch (error) {
    console.log("Updation error: " + error);
  }
};

export const getDocuments = async (email: string) => {
  const rooms = await liveblocks.getRooms({ userId: email });

  return parseStringify(rooms);
};

export const updateDocumentAccess = async ({
  roomId,
  email,
  userType,
  updatedBy,
}: ShareDocumentParams) => {
  try {
    const usersAccesses: RoomAccesses = {
      [email]: getAccessType(userType) as AccessType,
    };

    const room = await liveblocks.updateRoom(roomId, { usersAccesses });

    if (room) {
      const notificaitonId = nanoid();

      await liveblocks.triggerInboxNotification({
        userId: email,
        kind: "$documentAccess",
        subjectId: notificaitonId,
        activityData: {
            userType,
            title: `You have been granted ${userType} access to the document by ${updatedBy.name}`,
            updatedBy: updatedBy.name,
            avatar: updatedBy.avatar,
            email: updatedBy.email
        },
        roomId
    })
}

    revalidatePath(`/documents/${roomId}`);
  } catch (error) {
    console.log(`error occured in room access: ${error}`);
  }
};

export const removeCollaborator = async ({
  roomId,
  email,
}: {
  roomId: string;
  email: string;
}) => {
  try {
    const room = await liveblocks.getRoom(roomId);

    if (room.metadata.email === email) {
      throw new Error("You cannot remove yourself from the document");
    }

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      usersAccesses: {
        [email]: null,
      },
    });

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(updatedRoom);
  } catch (error) {
    console.log(`Error occured in removing collaborator: ${error}`);
  }
};

export const deleteDocument = async (roomId: string) => {
    try {
        await liveblocks.deleteRoom(roomId);
        revalidatePath('/');
        redirect('/');
    } catch (error) {
        console.log(`Error occurred in deleting document: ${error}`)
    }
};
