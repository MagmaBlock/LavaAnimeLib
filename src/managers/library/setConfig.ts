import { AlistLibraryConfig } from "../../class/library/alist";

export async function librarySetConfig(
  id: string,
  config: AlistLibraryConfig | object
) {
  try {
    await usePrisma.library.update({
      where: {
        id,
      },
      data: {
        config,
      },
    });
  } catch (error) {
    throw error;
  }
}
