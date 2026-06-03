import { useLocalStorage, useStorage } from "@vueuse/core";
import axios from "axios";
import type Artplayer from "artplayer";
import type {
  DriveListResult,
  AnimeDetail,
  FileParseResult,
  AnimeFileItem,
} from "@lavaanime/shared";

export type ParseResult = FileParseResult;
export type FileData = Array<AnimeFileItem>;
export type AnimeData = AnimeDetail;
export type DriveData = DriveListResult;

export function useAnime() {
  // ========== STATE ==========
  const laID = ref(0);

  const state = reactive({
    animeData: {
      isLoading: true,
      errorCode: null as number | null,
      errorMessage: null as string | null,
    },
    driveData: {
      isLoading: true,
      errorCode: null as number | null,
      errorMessage: null as string | null,
    },
    fileData: {
      isLoading: true,
      errorCode: null as number | null,
      errorMessage: null as string | null,
    },
  });

  const animeData = ref<AnimeData | null>(null);
  const driveData = ref<DriveData | null>(null);
  const preferredEndpointId = ref<number | null>(null);

  const myDrive = useStorage("myDrive", {
    rememberMyChoice: false,
    selectedDrive: null as string | null,
    selectedEndpoints: {} as Record<string, number>,
  });

  const fileData = reactive({
    activeEpisode: null as string | null,
    activeFileIndex: null as number | null,
    fileList: [] as FileData,
    actualDriveId: null as string | null,
    actualEndpointId: null as number | null,
  });

  const subtitleData = reactive({
    enabled: true,
    subtitleFileName: null as string | null,
    localSubtitle: null as {
      name: string;
      content: string;
      type: string;
    } | null,
  });

  const artInstance = ref<Artplayer | null>(null);
  const showArtPlayer = ref(false);
  const showAdminTools = ref(false);
  const ascOrder = useLocalStorage("AnimeFileAscOrder", true);

  const colorEgg = ref([
    {
      bgmID: 484761,
      episodeName: "头",
      follow: {
        add: "加入小鹿部",
        remove: "逃不掉了",
      },
      fileList: {
        title: "鹿园",
      },
    },
  ]);

  const isFileBrowserOpen = ref(false);

  // notify 回调 — 页面注入以便 composable 与 UI 解耦
  const notifyError = ref<(msg: string) => void>(() => {});
  const notifySuccess = ref<(msg: string) => void>(() => {});
  const notifyInfo = ref<(msg: string, options?: { duration: number }) => void>(() => {});

  // ========== GETTERS ==========
  const bgmID = computed(() => {
    return animeData.value?.bgmID ?? null;
  });

  const activeFile = computed((): (FileData[number] & { parseResult: ParseResult }) | null => {
    if (fileData.activeFileIndex === null || fileData.fileList === null) return null;
    const file = fileData.fileList[fileData.activeFileIndex];
    return file ? { ...file, parseResult: file.parseResult } : null;
  });

  const activeSubtitle = computed(() => {
    if (!subtitleData.enabled) return null;

    if (subtitleData.localSubtitle) {
      return {
        name: subtitleData.localSubtitle.name,
        url: URL.createObjectURL(
          new Blob([subtitleData.localSubtitle.content], {
            type: `text/${subtitleData.localSubtitle.type}`,
          })
        ),
        type: "file",
        parseResult: {
          extensionName: {
            type: "subtitle",
            result: subtitleData.localSubtitle.type,
            raw: subtitleData.localSubtitle.type,
            trueName: subtitleData.localSubtitle.type,
          },
        },
      };
    }

    if (subtitleData.subtitleFileName === null) return null;
    return fileData.fileList.find(
      (file) => file.name === subtitleData.subtitleFileName
    );
  });

  const preferredDrive = computed(() => {
    if (driveData.value === null) return null;
    if (myDrive.value.rememberMyChoice && myDrive.value.selectedDrive) {
      return driveData.value.list.find((drive) => {
        return myDrive.value.selectedDrive == drive.id;
      });
    } else if (myDrive.value.selectedDrive) {
      return driveData.value.list.find((drive) => {
        return myDrive.value.selectedDrive == drive.id;
      });
    } else {
      return driveData.value.list.find((drive) => {
        return driveData.value?.default == drive.id;
      });
    }
  });

  const preferredEndpoint = computed(() => {
    const drive = (function () {
      if (driveData.value === null) return null;
      if (myDrive.value.rememberMyChoice && myDrive.value.selectedDrive) {
        return driveData.value.list.find((drive) => {
          return myDrive.value.selectedDrive == drive.id;
        });
      } else if (myDrive.value.selectedDrive) {
        return driveData.value.list.find((drive) => {
          return myDrive.value.selectedDrive == drive.id;
        });
      } else {
        return driveData.value.list.find((drive) => {
          return driveData.value?.default == drive.id;
        });
      }
    })();
    if (!drive || !drive.endpoints?.length) return null;
    if (preferredEndpointId.value != null) {
      return drive.endpoints.find((ep) => ep.id === preferredEndpointId.value) ?? drive.endpoints[0];
    }
    const rememberedId = drive.id ? myDrive.value.selectedEndpoints[drive.id] : undefined;
    if (rememberedId != null) {
      return drive.endpoints.find((ep) => ep.id === rememberedId) ?? drive.endpoints[0];
    }
    return drive.endpoints[0];
  });

  const actualDrive = computed(() => {
    if (!fileData.actualDriveId || !driveData.value) return null;
    return driveData.value.list.find((d) => d.id === fileData.actualDriveId) ?? null;
  });

  const actualEndpoint = computed(() => {
    if (!fileData.actualEndpointId || !driveData.value) return null;
    for (const d of driveData.value.list) {
      const ep = d.endpoints?.find((e) => e.id === fileData.actualEndpointId);
      if (ep) return ep;
    }
    return null;
  });

  const actualDriveName = computed((): string | null => {
    return actualDrive.value?.name ?? null;
  });

  const actualEndpointName = computed((): string | null => {
    return actualEndpoint.value?.name ?? null;
  });

  const isFallback = computed((): boolean => {
    if (!fileData.actualDriveId || !driveData.value) return false;
    const preferredDriveId = preferredDrive.value?.id ?? null;
    const preferredEpId = preferredEndpoint.value?.id ?? null;
    return (
      fileData.actualDriveId !== preferredDriveId ||
      (fileData.actualEndpointId != null && fileData.actualEndpointId !== preferredEpId)
    );
  });

  const episodeList = computed(() => {
    if (fileData.fileList === null) return [];
    const result: { episode: string; list: typeof fileData.fileList }[] = [];
    for (const file of fileData.fileList) {
      if (
        file.type == "file" &&
        file.parseResult?.extensionName?.type == "video" &&
        file.parseResult?.episode
      ) {
        const thisEpObj = result.find(
          (ep) => ep.episode == file.parseResult?.episode
        );
        if (thisEpObj === undefined) {
          result.push({ episode: file.parseResult?.episode!, list: [file] });
        } else {
          thisEpObj.list.push(file);
        }
      }
    }
    result.sort((a, b) => {
      const aEp = String(a.episode);
      const bEp = String(b.episode);
      const [aInt, aFrac = "0"] = aEp.split(".");
      const [bInt, bFrac = "0"] = bEp.split(".");
      const aIntNum = parseInt(aInt);
      const bIntNum = parseInt(bInt);
      if (aIntNum !== bIntNum) {
        return aIntNum - bIntNum;
      }
      const aFracNum = parseInt(aFrac);
      const bFracNum = parseInt(bFrac);
      return aFracNum - bFracNum;
    });

    if (!ascOrder.value) result.reverse();
    return result;
  });

  const noEpisodeList = computed(() => {
    if (fileData.fileList === null) return [] as FileData;
    const result = fileData.fileList.filter((file) => {
      return (
        file.type == "file" &&
        file.parseResult?.extensionName?.type == "video" &&
        !file.parseResult?.episode
      );
    });
    if (!ascOrder.value) result.reverse();
    return result;
  });

  const musicList = computed(() => {
    if (fileData.fileList === null) return [] as FileData;
    const result = fileData.fileList.filter((file) => {
      return (
        file.type == "file" &&
        file.parseResult?.extensionName?.type == "music"
      );
    });
    if (!ascOrder.value) result.reverse();
    return result;
  });

  const otherList = computed(() => {
    if (fileData.fileList === null) return [] as FileData;
    const result = fileData.fileList.filter((file) => {
      return (
        file.type == "file" &&
        !["video", "music"].includes(file.parseResult.extensionName.type)
      );
    });
    if (!ascOrder.value) result.reverse();
    return result;
  });

  const subtitleList = computed(() => {
    if (fileData.fileList === null) return [] as FileData;
    return fileData.fileList.filter((file) => {
      if (file?.parseResult?.extensionName?.type == "subtitle") {
        const currentEpisode = activeFile.value?.parseResult?.episode;
        if (currentEpisode == file.parseResult?.episode) return true;
      }
      return false;
    });
  });

  const episodeListFind = computed(() => {
    return (episode: string) => {
      return episodeList.value?.find((epObj) => {
        return epObj.episode == episode;
      });
    };
  });

  const isNoBrowser = computed((): boolean => {
    const file = activeFile.value as
      | (FileData[number] & { parseResult: ParseResult })
      | null;
    return (
      !!file?.parseResult?.noBrowser ||
      file?.parseResult?.extensionName?.raw == "mkv"
    );
  });

  const findNextEpisode = computed(() => {
    return (episode?: string) => {
      const currentEpisode = episode || fileData.activeEpisode;
      if (!currentEpisode) return undefined;

      const currentIndex =
        episodeList.value?.findIndex((findEp) => {
          return findEp.episode == currentEpisode;
        }) ?? -1;

      if (currentIndex === -1 || !episodeList.value) return undefined;

      const nextEpisode = episodeList.value[currentIndex + 1]?.episode;
      console.log("当前集:", currentEpisode, "下一集:", nextEpisode);
      return nextEpisode;
    };
  });

  const getColorEgg = computed(() => {
    return colorEgg.value.find((egg) => egg.bgmID === animeData.value?.bgmID);
  });

  // ========== ACTIONS ==========
  async function buildPage(laIDStr: string, forceEpisode: string | null) {
    laID.value = parseInt(laIDStr);
    getAnimeData(laIDStr);
    (async () => {
      await getDriveData();
      await getAggregatedFileData(laID.value);
      if (forceEpisode) {
        try {
          return await changeEpisodeAutoHistory(forceEpisode);
        } catch (error) {
          if (error == "episodeNotFound")
            notifyError.value(
              `第 ${forceEpisode} 话不存在, 按正常情况播放`
            );
        }
      }
      await autoPlay();
    })();
  }

  async function getAnimeData(laIDStr: string) {
    state.animeData = {
      isLoading: true,
      errorCode: null,
      errorMessage: null,
    };
    animeData.value = {
      id: 0,
      index: { year: "", type: "", name: "" },
      views: 0,
      title: "",
      type: { bdrip: false, nsfw: false },
      images: { large: "", common: "", medium: "", small: "", grid: "", poster: "" },
      deleted: false,
      name: "",
      name_cn: "",
      summary: "",
      nsfw: false,
      locked: false,
      platform: "",
      meta_tags: [],
      volumes: 0,
      eps: 0,
      series: false,
      total_episodes: 0,
      rating: {
        rank: 0,
        total: 0,
        count: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0 },
        score: 0,
      },
      collection: { wish: 0, collect: 0, doing: 0, on_hold: 0, dropped: 0 },
      tags: [],
      relations: [],
      characters: [],
    };

    try {
      const result = await api.get("/v2/anime/get", {
        params: { id: laIDStr, full: true },
      });
      animeData.value = result.data.data;
    } catch (error: any) {
      console.log("获取信息时发生", error, "错误");
      state.animeData.errorCode = error.response?.status;
      state.animeData.errorMessage = error.response?.data?.message;
    } finally {
      state.animeData.isLoading = false;
    }
  }

  async function getDriveData() {
    state.driveData = {
      isLoading: true,
      errorCode: null,
      errorMessage: null,
    };
    driveData.value = {
      default: "",
      list: [],
    };
    try {
      const result = await api.get("/v2/drive/all");
      driveData.value = result.data.data;
      if (!myDrive.value.rememberMyChoice) {
        myDrive.value.selectedDrive = null;
      }
    } catch (error: any) {
      console.log("获取存储节点信息时发生", error, "错误");
      state.driveData.errorCode = error.response?.status;
      state.driveData.errorMessage = error.response?.data?.message;
    } finally {
      state.driveData.isLoading = false;
    }
  }

  async function getAggregatedFileData(laIDNum: number) {
    showArtPlayer.value = false;
    fileData.activeEpisode = null;
    fileData.activeFileIndex = null;
    fileData.fileList = [];
    fileData.actualDriveId = null;
    fileData.actualEndpointId = null;
    state.fileData = {
      isLoading: true,
      errorCode: null,
      errorMessage: null,
    };
    try {
      const result = await api.get("/v2/anime/file", {
        params: { id: laIDNum },
      });
      const rawList = result.data.data as Array<Record<string, unknown>>;
      fileData.fileList = rawList.map((item: Record<string, unknown>) => ({
        name: (item.name as string) ?? "",
        size: (item.size as number) ?? 0,
        updated: (item.modified as string) ?? "",
        driver: "",
        thumbnail: "",
        type: (item.type as string) ?? "file",
        url: undefined,
        parseResult: (item.parseResult as ParseResult) ?? {
          animeTitle: "",
          animeYear: null,
          extensionName: { result: "", type: "", raw: "", trueName: "" },
          fileName: "",
          groups: [],
        },
        animeTitle: (item.parseResult as ParseResult)?.animeTitle ?? "",
        animeYear: (item.parseResult as ParseResult)?.animeYear ?? null,
        episode: (item.parseResult as ParseResult)?.episode,
        extensionName: (item.parseResult as ParseResult)?.extensionName ?? { result: "", type: "", raw: "", trueName: "" },
        fileName: (item.parseResult as ParseResult)?.fileName ?? "",
        groups: (item.parseResult as ParseResult)?.groups ?? [],
        noBrowser: (item.parseResult as ParseResult)?.noBrowser,
        videoSource: (item.parseResult as ParseResult)?.videoSource,
        videoQuality: (item.parseResult as ParseResult)?.videoQuality,
        videoSubtitle: (item.parseResult as ParseResult)?.videoSubtitle,
        drives: (item.drives as Array<{ driveId: string; driveName: string; path: string }>) ?? [],
        modified: (item.modified as string | null) ?? null,
      })) as FileData;
      if (fileData.fileList.length) {
        showArtPlayer.value = true;
      }
    } catch (error: any) {
      console.log("获取聚合文件列表时发生", error, "错误");
      state.fileData.errorCode = error?.response?.status ?? error.code;
      state.fileData.errorMessage =
        error?.response?.data?.message ?? error.message;
    } finally {
      state.fileData.isLoading = false;
    }
  }

  async function resolveFileUrl(fileIndex: number, force = false): Promise<string> {
    const file = fileData.fileList[fileIndex];
    if (!file) throw new Error("File not found");
    if (file.url && !force) return file.url;

    const drives = file.drives;
    if (!drives?.length) throw new Error("No drives available for this file");

    const preferredId = preferredDrive.value?.id ?? null;
    let targetDrive = drives.find((d) => d.driveId === preferredId);
    if (!targetDrive) targetDrive = drives[0];

    const driveInfo = driveData.value?.list.find((d) => d.id === targetDrive!.driveId);
    let endpointId: number | undefined;
    if (driveInfo) {
      endpointId =
        preferredEndpointId.value ??
        myDrive.value.selectedEndpoints[targetDrive!.driveId] ??
        driveInfo.endpoints?.[0]?.id;
    }

    const params: Record<string, string | number> = {
      drive: targetDrive!.driveId,
      path: targetDrive!.path,
    };
    if (endpointId != null) params.endpoint = endpointId;

    const result = await api.get("/v2/anime/file/url", { params });
    const resolvedUrl = result.data?.data?.url;
    if (!resolvedUrl) throw new Error("获取文件链接失败");
    file.url = resolvedUrl;

    fileData.actualDriveId = targetDrive!.driveId;
    fileData.actualEndpointId = endpointId ?? null;

    return resolvedUrl;
  }

  function setPreferredDrive(driveId: string, endpointId?: number) {
    const oldDriveId = myDrive.value.selectedDrive;
    myDrive.value.selectedDrive = driveId;
    if (endpointId != null) {
      myDrive.value.selectedEndpoints = {
        ...myDrive.value.selectedEndpoints,
        [driveId]: endpointId,
      };
    }
    if (oldDriveId !== driveId) {
      preferredEndpointId.value = null;
    }
    reResolveIfActiveFileOnDrive(driveId);
  }

  function setPreferredEndpoint(endpointId: number) {
    const driveId = preferredDrive.value?.id;
    if (!driveId) return;
    preferredEndpointId.value = endpointId;
    myDrive.value.selectedEndpoints = {
      ...myDrive.value.selectedEndpoints,
      [driveId]: endpointId,
    };
    reResolveIfActiveFileOnDrive(driveId);
  }

  function reResolveIfActiveFileOnDrive(driveId: string) {
    const activeIndex = fileData.activeFileIndex;
    if (activeIndex === null || activeIndex < 0) return;
    const file = fileData.fileList[activeIndex];
    if (!file?.drives?.length) return;
    if (!file.drives.some((d) => d.driveId === driveId)) return;
    const newPreferredEpId = preferredEndpoint.value?.id ?? null;
    if (
      fileData.actualDriveId === driveId &&
      fileData.actualEndpointId === newPreferredEpId
    ) return;
    resolveFileUrl(activeIndex, true);
  }

  function changeEpisode(newEpisode: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      if (!episodeListFind.value(newEpisode)) return reject("episodeNotFound");
      (async () => {
        const oldGroups = activeFile.value?.parseResult?.groups || [];
        console.log("当前发布组:", oldGroups);

        const calculateGroupSimilarity = (
          groups: Array<{ result: string }>
        ) => {
          if (!oldGroups.length) return 0;
          const matched = groups.filter((g) =>
            oldGroups.some(
              (og) =>
                og.result.toLowerCase().includes(g.result.toLowerCase()) ||
                g.result.toLowerCase().includes(og.result.toLowerCase())
            )
          );
          return matched.length / oldGroups.length;
        };

        fileData.activeEpisode = newEpisode;
        const findResult = (findBetter = true) => {
          let bestMatchIndex = -1;
          let bestSimilarity = 0;

          fileData.fileList.forEach((file, index) => {
            if (
              file?.parseResult?.episode == newEpisode &&
              file?.parseResult?.extensionName?.type == "video" &&
              (findBetter ? file?.parseResult?.noBrowser === false : true)
            ) {
              const similarity = calculateGroupSimilarity(
                file.parseResult.groups || []
              );
              console.log(`文件 ${file.name} 发布组相似度: ${similarity}`);

              if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatchIndex = index;
              }
            }
          });

          if (bestSimilarity === 0) {
            return fileData.fileList.findIndex((file) => {
              return (
                file?.parseResult?.episode == newEpisode &&
                file?.parseResult?.extensionName?.type == "video" &&
                (findBetter ? file?.parseResult?.noBrowser === false : true)
              );
            });
          }

          return bestMatchIndex;
        };
        const bestIndex = findResult() != -1 ? findResult() : findResult(false);

        try {
          await resolveFileUrl(bestIndex);
        } catch (err) {
          return reject(err);
        }

        fileData.activeFileIndex = bestIndex;

        if (!artInstance.value)
          return reject(new Error("Artplayer instance not initialized"));
        artInstance.value.once("video:canplaythrough", () => {
          if (fileData.activeEpisode == newEpisode) {
            resolve(undefined);
          } else {
            reject("视频集数切换被其他事件中断");
          }
        });
        artInstance.value.once("error", (error: any) => {
          if (fileData.activeEpisode == newEpisode) {
            reject(error);
          }
        });
        autoSubtitle();
      })();
    });
  }

  function changeVideo(newVideoUrl: string, noEp = false) {
    return new Promise((resolve, reject) => {
      fileData.activeFileIndex = fileData.fileList.findIndex(
        (file) => {
          return file?.url == newVideoUrl;
        }
      );
      if (activeFile.value?.parseResult?.episode && !noEp) {
        fileData.activeEpisode = activeFile.value?.parseResult?.episode;
      }

      if (!artInstance.value)
        throw new Error("Artplayer instance not initialized");
      artInstance.value.once("video:canplaythrough", () => {
        if (activeFile.value?.url == newVideoUrl) {
          resolve(undefined);
        } else {
          reject("视频切换被其他事件中断");
        }
      });
      if (!artInstance.value)
        throw new Error("Artplayer instance not initialized");
      artInstance.value.once("error", (error: any) => {
        if (activeFile.value?.url == newVideoUrl) {
          reject(error);
        }
      });
    });
  }

  async function getAnimeViewHistory() {
    return await api.post("/v2/anime/history/my", {
      animeID: laID.value,
    });
  }

  async function reportView(isWebPlayer: boolean, watchMethod: string) {
    const content = {
      animeID: laID.value,
      fileName: activeFile.value?.name,
      currentTime: isWebPlayer ? artInstance.value?.currentTime : null,
      totalTime: isWebPlayer ? artInstance.value?.duration : null,
      watchMethod,
      useDrive: fileData.actualDriveId ?? preferredDrive.value?.id,
    };
    try {
      await api.post("/v2/anime/history/report", content, {
        timeout: 3000,
      });
    } catch (error) {
      console.error("播放进度上报失败", content, error);
    }
  }

  async function autoPlay() {
    try {
      const viewHistory = await getAnimeViewHistory();
      viewHistory.data.data = viewHistory.data.data?.filter(
        (record: any) => record.watchMethod == "WebPlayer"
      );

      if (viewHistory.data.data?.length == 0) {
        return firstThisAnime();
      }
      const lastRecord = viewHistory.data.data[0];
      if (!fileData.fileList)
        throw new Error("File list not initialized");
      const findThisFile = fileData.fileList.find((file) => {
        return file?.name == lastRecord.fileName;
      });

      if (findThisFile) {
        console.log("匹配到和上次播放完全相同的文件", findThisFile);
        try {
          const fileIndex = fileData.fileList.findIndex((f) => f.name === findThisFile.name);
          if (fileIndex !== -1) {
            const url = await resolveFileUrl(fileIndex);
            await changeVideo(url);
          }
          seekByHistory(lastRecord);
        } catch (error) {
          console.error("切换视频时失败", error);
        }
      } else {
        console.log("找不到文件, 同话数模式...", lastRecord?.episode);
        try {
          await changeEpisode(lastRecord?.episode);
          seekByHistory(lastRecord);
        } catch (error) {
          console.error("切换集数时失败", error);
          if (error == "episodeNotFound") {
            return firstThisAnime();
          }
        }
      }
    } catch (error) {
      console.error(error);
      firstThisAnime();
    }
  }

  async function firstThisAnime() {
    if (episodeList.value.length) {
      changeEpisode(episodeList.value[0].episode);
    } else if (fileData.fileList.length) {
      const index = fileData.fileList.findIndex((file) => {
        return (
          file?.type == "file" &&
          file?.parseResult?.extensionName?.type == "video"
        );
      });
      if (index !== -1) {
        try {
          const url = await resolveFileUrl(index);
          changeVideo(url);
        } catch (err) {
          console.error("解析首个视频 URL 失败:", err);
        }
      }
    }
  }

  async function seekByHistory(history: {
    currentTime?: number;
    episode?: string;
    totalTime?: number;
  }) {
    if (!history.currentTime) return;
    if (
      !history.totalTime ||
      !history.currentTime ||
      history.totalTime - history.currentTime < 20
    ) {
      notifySuccess.value("本话上次已看完");
      return;
    }

    if (!artInstance.value?.video)
      throw new Error("Artplayer video element not initialized");
    artInstance.value.video.currentTime = history.currentTime;
    const ep = history?.episode ? `第 ${history.episode} 话` : "";
    const m = Math.floor(history?.currentTime / 60)
      .toString()
      .padStart(2, "0");
    const s = (history?.currentTime % 60).toString().padStart(2, "0");
    notifyInfo.value(`上次${ep}播放到 ${m}:${s}, 已自动跳转`, {
      duration: 5000,
    });
  }

  async function changeEpisodeAutoHistory(episode: string) {
    if (episode === fileData.activeEpisode) return;
    const result = await Promise.allSettled([
      getAnimeViewHistory(),
      changeEpisode(episode),
    ]);
    if (result[1].status == "rejected") {
      throw result[1].reason;
    }
    if (result[0].status !== "rejected") {
      const viewHistory = (result[0] as PromiseFulfilledResult<any>).value;
      if (viewHistory.data.data.length) {
        seekByHistory(
          viewHistory.data.data.find(
            (record: {
              episode?: string;
              watchMethod?: string;
              currentTime?: number;
              totalTime?: number;
            }) => {
              return record.episode == episode;
            }
          )
        );
      }
    }
  }

  async function autoSubtitle() {
    const subtitles = subtitleList.value;
    console.log(
      "可用的字幕列表",
      subtitles.map((sub) => sub.name)
    );

    const priorityConfig = [
      {
        pattern: /(?:^|[._-])sc(?:h(?:i|s|_simp)?)?(?:[._-]|$)/i,
        log: "简体中文",
      },
      {
        pattern: /(?:^|[._-])chs(?:[._-]|$)/i,
        log: "简体中文",
      },
      {
        pattern: /(?:^|[._-])tc(?:h(?:t|_trad)?)?(?:[._-]|$)/i,
        log: "繁体中文",
      },
      {
        pattern: /(?:^|[._-])cht(?:[._-]|$)/i,
        log: "繁体中文",
      },
      {
        pattern: /(?:^|[._-])chi(?:n(?:ese|_sub))?(?:[._-]|$)/i,
        log: "中文",
      },
      {
        pattern: /(?:^|[._-])zho(?:[._-]|$)/i,
        log: "中文",
      },
    ];

    const matchedConfig = priorityConfig.find(({ pattern }) =>
      subtitles.some((sub) => pattern.test(sub.name))
    );

    if (matchedConfig) {
      const targetSub = subtitles.find((sub) =>
        matchedConfig.pattern.test(sub.name)
      )!;
      subtitleData.subtitleFileName = targetSub.name;
      console.log(`自动选择${matchedConfig.log}字幕: ${targetSub.name}`);
      return;
    }

    if (subtitles.length > 0) {
      subtitleData.subtitleFileName = subtitles[0].name;
      console.log("自动选择首个字幕:", subtitles[0].name);
      return;
    }

    subtitleData.subtitleFileName = null;
    console.log("未找到匹配的字幕文件");
  }

  async function uploadLocalSubtitle(file: File) {
    return new Promise<void>((resolve, reject) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!["srt", "ass", "ssa", "vtt"].includes(fileExtension || "")) {
        reject("不支持的字幕格式，请上传.srt、.ass、.ssa或.vtt格式的字幕");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        reject("字幕文件过大，请上传小于2MB的文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) {
            reject("读取字幕文件失败");
            return;
          }

          subtitleData.localSubtitle = {
            name: file.name,
            content: content,
            type: fileExtension || "srt",
          };

          subtitleData.enabled = true;
          subtitleData.subtitleFileName = null;

          resolve();
        } catch (error) {
          reject(`处理字幕文件失败: ${error}`);
        }
      };

      reader.onerror = () => {
        reject("读取字幕文件失败");
      };

      reader.readAsText(file);
    });
  }

  function clearLocalSubtitle() {
    subtitleData.localSubtitle = null;
  }

  async function selectAndPlayVideo(fileIndex: number) {
    const file = fileData.fileList[fileIndex];
    if (!file) return;
    if (!file.url) {
      try {
        await resolveFileUrl(fileIndex);
      } catch {
        notifyError.value("获取文件链接失败");
        return;
      }
    }
    if (file.url === activeFile.value?.url) return;
    const result = await Promise.allSettled([
      getAnimeViewHistory(),
      changeVideo(file.url!),
    ]);
    if (result[0].status !== "rejected") {
      const viewHistory = (result[0] as PromiseFulfilledResult<any>).value;
      if (viewHistory?.data?.data?.length) {
        const recentRecord =
          viewHistory.data.data.find(
            (record: any) => record.fileName == file.name
          ) ??
          viewHistory.data.data.find(
            (record: any) => record.episode == file.parseResult?.episode
          );
        seekByHistory(recentRecord);
      }
    }
  }

  async function selectAndPlayMusic(fileIndex: number) {
    const file = fileData.fileList[fileIndex];
    if (!file) return;
    if (!file.url) {
      try {
        await resolveFileUrl(fileIndex);
      } catch {
        notifyError.value("获取文件链接失败");
        return;
      }
    }
    changeVideo(file.url!, true);
  }

  async function openAttachment(fileIndex: number) {
    const file = fileData.fileList[fileIndex];
    if (!file) return;
    if (!file.url) {
      try {
        await resolveFileUrl(fileIndex);
      } catch {
        notifyError.value("获取文件链接失败");
        return;
      }
    }
    window.open(file.url, "_blank", "noopener,noreferrer");
  }

  function $reset() {
    laID.value = 0;
    state.animeData = { isLoading: true, errorCode: null, errorMessage: null };
    state.driveData = { isLoading: true, errorCode: null, errorMessage: null };
    state.fileData = { isLoading: true, errorCode: null, errorMessage: null };
    animeData.value = null;
    driveData.value = null;
    preferredEndpointId.value = null;
    myDrive.value = { rememberMyChoice: false, selectedDrive: null, selectedEndpoints: {} };
    fileData.activeEpisode = null;
    fileData.activeFileIndex = null;
    fileData.fileList = [];
    fileData.actualDriveId = null;
    fileData.actualEndpointId = null;
    subtitleData.enabled = true;
    subtitleData.subtitleFileName = null;
    subtitleData.localSubtitle = null;
    artInstance.value = null;
    showArtPlayer.value = false;
    showAdminTools.value = false;
    isFileBrowserOpen.value = false;
  }

  return reactive({
    // state
    laID,
    state,
    animeData,
    driveData,
    preferredEndpointId,
    myDrive,
    fileData,
    subtitleData,
    artInstance,
    showArtPlayer,
    showAdminTools,
    ascOrder,
    colorEgg,
    isFileBrowserOpen,

    // notify 回调 (页面注入)
    notifyError,
    notifySuccess,
    notifyInfo,

    // getters
    bgmID,
    activeFile,
    activeSubtitle,
    preferredDrive,
    preferredEndpoint,
    actualDrive,
    actualEndpoint,
    actualDriveName,
    actualEndpointName,
    isFallback,
    episodeList,
    noEpisodeList,
    musicList,
    otherList,
    subtitleList,
    episodeListFind,
    isNoBrowser,
    findNextEpisode,
    getColorEgg,

    // actions
    buildPage,
    getAnimeData,
    getDriveData,
    getAggregatedFileData,
    resolveFileUrl,
    setPreferredDrive,
    setPreferredEndpoint,
    reResolveIfActiveFileOnDrive,
    changeEpisode,
    changeVideo,
    getAnimeViewHistory,
    reportView,
    autoPlay,
    firstThisAnime,
    seekByHistory,
    changeEpisodeAutoHistory,
    autoSubtitle,
    uploadLocalSubtitle,
    clearLocalSubtitle,
    selectAndPlayVideo,
    selectAndPlayMusic,
    openAttachment,

    // reset
    $reset,
  })
}
