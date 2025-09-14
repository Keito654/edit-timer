import type { StateCreator } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import type { FsPath } from "../../types";
import type { GlobalStore } from "../../app/store";

export interface ExcludeFiles {
  excludeFiles: Set<FsPath>;
  addExcludeFile: (fsPath: FsPath) => void;
  removeExcludeFile: (fsPath: FsPath) => void;
  switchExclude: (fsPath: FsPath) => void;
}

export const createExcludeFileSlice: StateCreator<
  GlobalStore,
  [],
  [["zustand/immer", never]],
  ExcludeFiles
> = immer((set) => ({
  excludeFiles: new Set<FsPath>(),
  addExcludeFile: (fsPath) =>
    set((state) => {
      state.excludeFiles.add(fsPath);
    }),
  removeExcludeFile: (fsPath) =>
    set((state) => {
      state.excludeFiles.delete(fsPath);
    }),
  switchExclude: (fsPath) =>
    set((state) => {
      if (state.excludeFiles.has(fsPath)) {
        state.excludeFiles.delete(fsPath);
      } else {
        state.excludeFiles.add(fsPath);
      }
    }),
}));
