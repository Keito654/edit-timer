import { UntrackedEditor } from "./untrackedEditor";

export class TrackedEditor {
  readonly name: string;
  readonly isActive: boolean;

  constructor(name: string, isActive: boolean) {
    this.name = name;
    this.isActive = isActive;
  }

  onActive(): TrackedEditor {
    return new TrackedEditor(this.name, true);
  }

  onBlur() {
    return new TrackedEditor(this.name, false);
  }

  toggleTracked() {
    return new UntrackedEditor(this.name, this.isActive);
  }
}
