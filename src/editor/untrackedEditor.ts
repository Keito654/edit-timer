import { TrackedEditor } from "./trackedEditor";

export class UntrackedEditor {
  readonly name: string;
  readonly isActive: boolean;

  constructor(name: string, isActive: boolean) {
    this.name = name;
    this.isActive = isActive;
  }

  onActive(): TrackedEditor {
    return new UntrackedEditor(this.name, true);
  }

  onBlur() {
    return new UntrackedEditor(this.name, false);
  }

  toggleTracked() {
    return new TrackedEditor(this.name, this.isActive);
  }
}
