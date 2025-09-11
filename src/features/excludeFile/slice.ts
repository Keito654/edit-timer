import { StateCreator } from "zustand/vanilla";
import { FsPath } from "../../types";

export interface ExcludeFiles {
  excludeFiles: FsPath[];
  addExcludeFile: (fsPath: FsPath) => void;
  removeExcludeFile: (fsPath: FsPath) => void;
}

export const createExcludeFileSlice: StateCreator<
  ExcludeFiles,
  [],
  [],
  ExcludeFiles
> = (set) => ({
  excludeFiles: [],
  addExcludeFile: (fsPath) =>
    set((state) => ({
      excludeFiles: [...state.excludeFiles, fsPath],
    })),
  removeExcludeFile: (fsPath) =>
    set((state) => ({
      excludeFiles: state.excludeFiles.filter((x) => x === fsPath),
    })),
});
