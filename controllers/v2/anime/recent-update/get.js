import { prisma } from "../../../../prisma/client.js";

export async function getRecentUpdatesAPI(req, res) {
  let recentUpdates = await prisma.upload_message.findMany({ take: 50 });
}
