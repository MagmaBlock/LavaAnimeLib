import { AnimeManager } from "./anime/manager";
import { InviteCodeManager } from "./invite-code/manager";
import { LibraryManager } from "./library/manager";
import { TokenManager } from "./token/manager";
import { UserManager } from "./user/manager";

export class Entrance {
  private static instance: Entrance;
  constructor() {
    Entrance.instance = this;
  }
  static getInstance() {
    if (!Entrance.instance) {
      new Entrance();
    }
    return Entrance.instance;
  }

  getAnimeManager() {
    return new AnimeManager();
  }

  getInviteCodeManager() {
    return new InviteCodeManager();
  }

  getLibraryManager() {
    return new LibraryManager();
  }

  getUserManager() {
    return new UserManager();
  }

  getTokenManager() {
    return new TokenManager();
  }
}
