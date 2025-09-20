import { configureStore } from "@reduxjs/toolkit";
import timerSliceReducer from "../features/timer/timerSlice";

export const store = configureStore({
  reducer: {
    timer: timerSliceReducer,
  },
});

export const getTimerState = () => store.getState().timer;
