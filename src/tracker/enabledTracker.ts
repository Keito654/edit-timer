import { Stopwatch } from "ts-stopwatch";
import { Editor } from "../editor/editor";

export class EnabledTracker {
  private readonly editorTimers: Map<Editor, Stopwatch> = new Map<
    Editor,
    Stopwatch
  >();

  private constructor(editorTimers: Map<Editor, Stopwatch>) {
    this.editorTimers = editorTimers;
  }

  start(editor: Editor) {
    
  }

  stop() {}
}
