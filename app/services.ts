import { type CreateCollectionPayload } from "./types";

export const upsertCollection = async (
  edit: boolean,
  payload: CreateCollectionPayload & { id?: number },
) => {
  try {
    const response = await fetch("/api/collection", {
      method: edit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
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

export const deleteCollection = async (collectionId: number) => {
  try {
    const response = await fetch(`/api/collection?id=${collectionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Could not delete");
    }
    const result = await response.json();
    return result;
  } catch (err) {
    console.error(err);
    return { success: false, message: (err as Error).message };
  }
};
