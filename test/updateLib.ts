import { AlistLibraryTool } from "~/src/class/library/alist";

export async function main() {
  const library = await usePrisma.library.findFirst({
    where: {
      id: "3A_Xinxiang",
    },
  });
  const tool = new AlistLibraryTool(library);
  await tool.getScanner().scan("/");
}
