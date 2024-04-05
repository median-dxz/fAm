import { settingManager, type Setting } from "@/lib/setting";
import { revalidatePath } from "next/cache";

const convertSlug = (slug: string) => {
  let r = "";
  for (let i = 0; i < slug.length; i++) {
    if (slug[i] === "-") {
      r += slug[i + 1].toUpperCase();
      i++;
    } else {
      r += slug[i];
    }
  }
  return r;
};

export async function GET(request: Request, { params: { item } }: { params: { item: string } }) {
  const itemName = convertSlug(item) as keyof Setting;
  const settingItem = await settingManager.getItme(itemName);
  return Response.json({ ...settingItem });
}

export async function PUT(request: Request, { params: { item } }: { params: { item: string } }) {
  const itemName = convertSlug(item) as keyof Setting;
  const r = await settingManager.updateItme(itemName as keyof Setting, await request.json());
  revalidatePath("/dashboard/settings");
  return Response.json({ message: `update ${itemName} successfully`, success: true });
}
