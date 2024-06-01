import { Library } from "@prisma/client";
import { AlistLibraryTool } from "./alist";

export class LibraryManager {
  async getAllLibraryTool() {
    const librarys = await usePrisma.library.findMany();
    return librarys.map((library) => {
      return this.getLibraryTool(library);
    });
  }

  getLibraryTool(library: Library) {
    if (library.type === "Alist") return new AlistLibraryTool(library);
  }
}
