import { type CreateCollectionPayload } from "./types";

export const createCollection = async (payload: CreateCollectionPayload) => {
  try {
    const response = await fetch("/api/collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("$$$$$$$$$$$", response);
    if (!response.ok) {
      console.log("response.statusText", response.statusText);
      throw new Error(response.statusText);
    }
    const result = await response.json();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
    return { success: false, message: (err as Error).message };
  }
};
