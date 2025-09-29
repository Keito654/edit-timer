export type FsPath = string;

export interface PersistentFileData {
  fsPath: FsPath;
  elapsedTime: number;
}

export interface PersistentData {
  excludedFiles: FsPath[];
  isTracking: boolean;
  fileData: PersistentFileData[];
  lastSavedAt: number;
}
